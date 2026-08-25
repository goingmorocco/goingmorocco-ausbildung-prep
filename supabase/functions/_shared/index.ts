// Shared CORS headers for all Edge Functions. The browser sends a
// preflight OPTIONS request before any cross-origin POST; every function
// in this project needs to answer it the same way.
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
