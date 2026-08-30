// Admin-only management of which LLM provider/model powers writing
// grading and hints, plus setting the API key for each -- all from the
// dashboard, no CLI or redeploy needed after the one-time LLM_VAULT_KEY
// secret is set.
//
//   supabase.functions.invoke('admin-llm-settings', { body: { action: 'list' } })
//   supabase.functions.invoke('admin-llm-settings', {
//     body: { action: 'save_config', purpose, provider, model, base_url }
//   })
//   supabase.functions.invoke('admin-llm-settings', {
//     body: { action: 'set_key', purpose, api_key }
//   })
//
// The raw api_key never reaches the database in plaintext (set_key
// encrypts it via the set_llm_api_key() Postgres function, which itself
// checks admin status), and 'list' never returns key material at all --
// only whether one is set (has_key).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } }
    );
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) return json({ success: false, message: 'غير مصرح به' }, 401);

    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    const { data: profile } = await admin.from('users').select('role').eq('id', user.id).single();
    if (!profile || profile.role !== 'admin') {
      return json({ success: false, message: 'هذا الإجراء متاح للمشرفين فقط' }, 403);
    }

    const body = await req.json();

    if (body.action === 'list') {
      const { data, error } = await admin
        .from('llm_settings')
        .select('purpose, provider, model, base_url, has_key, updated_at')
        .order('purpose');
      if (error) throw error;
      return json({ success: true, settings: data });
    }

    if (body.action === 'save_config') {
      const { purpose, provider, model, base_url } = body;
      if (!purpose || !provider || !model || !base_url) {
        return json({ success: false, message: 'جميع الحقول مطلوبة' }, 400);
      }
      const { error } = await admin
        .from('llm_settings')
        .update({ provider, model, base_url, updated_at: new Date().toISOString(), updated_by: user.id })
        .eq('purpose', purpose);
      if (error) throw error;
      return json({ success: true });
    }

    if (body.action === 'set_key') {
      const { purpose, api_key } = body;
      if (!purpose || !api_key || !api_key.trim()) {
        return json({ success: false, message: 'المفتاح مطلوب' }, 400);
      }
      const vaultKey = Deno.env.get('LLM_VAULT_KEY');
      if (!vaultKey) {
        return json({ success: false, message: 'إعداد التشفير غير مُفعّل بعد (LLM_VAULT_KEY)' }, 500);
      }
      // Called via authClient (not the service-role admin client) so
      // auth.uid() resolves correctly inside set_llm_api_key()'s own
      // admin check.
      const { error } = await authClient.rpc('set_llm_api_key', {
        p_purpose: purpose,
        p_api_key: api_key.trim(),
        p_vault_key: vaultKey
      });
      if (error) throw error;
      return json({ success: true });
    }

    return json({ success: false, message: 'action غير معروف' }, 400);
  } catch (err) {
    console.error(err);
    return json({ success: false, message: 'حدث خطأ في الخادم' }, 500);
  }
});
