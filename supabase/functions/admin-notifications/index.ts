// Admin-only notifications: list sent history, or send a new one to a
// segment of members.
//   supabase.functions.invoke('admin-notifications', { body: { action: 'list' } })
//   supabase.functions.invoke('admin-notifications', {
//     body: { action: 'send', title, message, audience }  // audience: all | active | pending | rejected | <user_id>
//   })

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
  const { data: profile } = await admin.from('users').select('role').eq('id', user.id).single();
  if (!profile || profile.role !== 'admin') {
    return { ok: false as const, status: 403, message: 'هذا الإجراء متاح للمشرفين فقط' };
  }
  return { ok: true as const, admin, userId: user.id };
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
  const { admin, userId } = check;

  try {
    const body = await req.json();

    if (body.action === 'list') {
      const { data, error } = await admin
        .from('notifications')
        .select('*, notification_recipients(id)')
        .order('sent_at', { ascending: false });
      if (error) throw error;
      const withCounts = data.map((n: any) => ({ ...n, recipient_count: (n.notification_recipients || []).length }));
      return json({ success: true, notifications: withCounts });
    }

    if (body.action === 'send') {
      const { title, message, audience, link_url } = body;
      if (!title || !message || !audience) {
        return json({ success: false, message: 'العنوان والرسالة والجمهور المستهدف مطلوبة' }, 400);
      }

      let recipientsQuery = admin.from('users').select('id').neq('role', 'admin');
      if (['pending', 'active', 'rejected'].includes(audience)) {
        recipientsQuery = recipientsQuery.eq('membership_status', audience);
      } else if (audience !== 'all') {
        recipientsQuery = admin.from('users').select('id').eq('id', audience);
      }
      const { data: recipients, error: recErr } = await recipientsQuery;
      if (recErr) throw recErr;

      const { data: notification, error: notifErr } = await admin
        .from('notifications')
        .insert({ title, message, audience, link_url: link_url || null, sent_by: userId })
        .select()
        .single();
      if (notifErr) throw notifErr;

      if (recipients.length) {
        const rows = recipients.map((r: any) => ({ notification_id: notification.id, user_id: r.id }));
        const { error: linkErr } = await admin.from('notification_recipients').insert(rows);
        if (linkErr) throw linkErr;
      }

      return json({ success: true, notification: { ...notification, recipient_count: recipients.length } });
    }

    return json({ success: false, message: 'action غير معروف' }, 400);
  } catch (err) {
    console.error(err);
    return json({ success: false, message: 'حدث خطأ في الخادم' }, 500);
  }
});
