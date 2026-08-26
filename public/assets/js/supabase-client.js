// Shared Supabase client, loaded by all three pages (index/dashboard/admin).
//
// SETUP: fill in your project's URL and anon (public) key below -- both
// from Supabase dashboard -> Project Settings -> API. The anon key is
// safe to expose in client-side code by design (it only grants access
// allowed by your Row Level Security policies); never put the service
// role key here or anywhere in frontend code.
const SUPABASE_URL = 'https://qonzvlatldtsalscffmm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbnp2bGF0bGR0c2Fsc2NmZm1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1MjI1NjEsImV4cCI6MjEwMzA5ODU2MX0.bP5C_sRr1ZrhojxJPc_wm9i23H5_xvw_HPt30_kvtwk';

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Small helpers reused across pages, so each page's Alpine logic doesn't
// have to repeat the same Supabase query/invoke boilerplate.

async function sbGetProfile(userId) {
  const { data, error } = await sb.from('users').select('*').eq('id', userId).single();
  if (error) throw error;
  return data;
}

async function sbInvoke(functionName, body) {
  const { data, error } = await sb.functions.invoke(functionName, { body });
  if (error) {
    // Edge Functions return a normal JSON body even on 4xx/5xx; the
    // supabase-js client surfaces those as a "non-2xx" FunctionsHttpError
    // without exposing the parsed body directly, so fall back to a
    // generic message when that happens.
    let message = 'حدث خطأ أثناء الاتصال بالخادم';
    try {
      if (error.context && typeof error.context.json === 'function') {
        const parsed = await error.context.json();
        if (parsed && parsed.message) message = parsed.message;
      }
    } catch (_) { /* ignore parse failure, use generic message */ }
    return { success: false, message };
  }
  return data;
}
