// Admin-only member management: list / approve / reject / reset / delete.
//   supabase.functions.invoke('admin-members', { body: { action: 'list', status, q } })
//   supabase.functions.invoke('admin-members', { body: { action: 'approve', member_id } })
//   supabase.functions.invoke('admin-members', { body: { action: 'reject', member_id } })
//   supabase.functions.invoke('admin-members', { body: { action: 'reset', member_id } })
//   supabase.functions.invoke('admin-members', { body: { action: 'delete', member_id } })
//
// Every action re-checks that the caller is an admin server-side (never
// trust a client-sent role) before touching any other user's data.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
// CORS headers inlined directly (rather than imported from _shared/) to
// avoid a known Supabase bundler bug where deploying a function by name
// sometimes fails to resolve sibling _shared/ imports.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function requireAdmin(req: Request) {
  const authClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } }
  );
  const { data: { user }, error } = await authClient.auth.getUser();
  if (error || !user) return { ok: false as const, status: 401, message: 'غير مصرح به' };

  const admin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
  const { data: profile } = await admin.from('users').select('role, full_name').eq('id', user.id).single();
  if (!profile || profile.role !== 'admin') {
    return { ok: false as const, status: 403, message: 'هذا الإجراء متاح للمشرفين فقط' };
  }
  return { ok: true as const, admin, adminUser: profile, userId: user.id };
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const check = await requireAdmin(req);
  if (!check.ok) return json({ success: false, message: check.message }, check.status);
  const { admin } = check;

  try {
    const body = await req.json();

    if (body.action === 'list') {
      let query = admin.from('users').select('*, subscriptions(status, current_period_end, cancel_at_period_end)').neq('role', 'admin');
      if (body.status && body.status !== 'all') query = query.eq('membership_status', body.status);
      if (body.q) query = query.or(`full_name.ilike.%${body.q}%,email.ilike.%${body.q}%`);
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return json({ success: true, members: data });
    }

    if (body.action === 'stats') {
      const { data, error } = await admin.from('users').select('membership_status').neq('role', 'admin');
      if (error) throw error;
      const total = data.length;
      const pending = data.filter((u: any) => u.membership_status === 'pending').length;
      const active = data.filter((u: any) => u.membership_status === 'active').length;
      const rejected = data.filter((u: any) => u.membership_status === 'rejected').length;
      const { count: activeSubscriptions } = await admin
        .from('subscriptions')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active');
      return json({ success: true, stats: { total, pending, active, rejected, activeSubscriptions: activeSubscriptions || 0 } });
    }

    if (body.action === 'approve') {
      const { member_id } = body;
      await admin.from('users').update({ membership_status: 'active' }).eq('id', member_id);

      const start = new Date();
      const end = new Date();
      end.setMonth(end.getMonth() + 3);

      const { data: existing } = await admin.from('subscriptions').select('id').eq('user_id', member_id).maybeSingle();
      if (existing) {
        await admin
          .from('subscriptions')
          .update({ status: 'active', current_period_start: start.toISOString(), current_period_end: end.toISOString(), cancel_at_period_end: false })
          .eq('id', existing.id);
      } else {
        await admin.from('subscriptions').insert({
          user_id: member_id, status: 'active',
          current_period_start: start.toISOString(), current_period_end: end.toISOString()
        });
      }
      return json({ success: true });
    }

    if (body.action === 'reject') {
      await admin.from('users').update({ membership_status: 'rejected' }).eq('id', body.member_id);
      await admin.from('subscriptions').update({ status: 'canceled' }).eq('user_id', body.member_id);
      return json({ success: true });
    }

    if (body.action === 'reset') {
      await admin.from('users').update({ membership_status: 'pending' }).eq('id', body.member_id);
      return json({ success: true });
    }

    if (body.action === 'delete') {
      const { member_id } = body;
      const { data: target } = await admin.from('users').select('role').eq('id', member_id).single();
      if (target?.role === 'admin') return json({ success: false, message: 'لا يمكن حذف حساب مشرف' }, 400);
      // Deletes the auth.users row too, via cascade on public.users.id.
      const { error } = await admin.auth.admin.deleteUser(member_id);
      if (error) throw error;
      return json({ success: true });
    }

    return json({ success: false, message: 'action غير معروف' }, 400);
  } catch (err) {
    console.error(err);
    return json({ success: false, message: 'حدث خطأ في الخادم' }, 500);
  }
});
