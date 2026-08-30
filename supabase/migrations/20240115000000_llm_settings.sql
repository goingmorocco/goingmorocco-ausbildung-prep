-- Supabase Migration: provider-agnostic, dashboard-manageable LLM
-- configuration for the writing grader and hint assistant.
--
-- Design: API keys are stored ENCRYPTED in this table (pgcrypto,
-- symmetric encryption with a passphrase that lives ONLY as a Supabase
-- secret, never in the database). This is the one credential that still
-- needs a one-time CLI setup:
--   supabase secrets set LLM_VAULT_KEY=<any long random string>
-- After that single step, every future provider swap, model change, or
-- API key update happens entirely from the admin dashboard -- no CLI,
-- no redeploy, ever again.
--
-- Two rows exist by default ('grading' and 'hints'), so grade-writing
-- and get-hint can use different providers/models if wanted (e.g. a
-- cheaper/faster model for hints, a stronger one for grading) without
-- being forced to share one config.
--
-- Access is layered even for admins: the raw table only ever exposes
-- CIPHERTEXT to a normal client query (even to an admin's own browser).
-- Decryption happens exclusively inside get_llm_config(), which is
-- REVOKEd from every role except service_role -- so only the Edge
-- Functions themselves (which run under service_role) can ever recover
-- a plaintext key, never a browser session, admin or not.

-- Supabase installs most extensions, including pgcrypto, into a
-- dedicated "extensions" schema rather than "public" -- both
-- functions below include it in their search_path for exactly
-- this reason.
CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.llm_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purpose VARCHAR(30) NOT NULL UNIQUE, -- 'grading' | 'hints'
    provider VARCHAR(30) NOT NULL DEFAULT 'groq',
    model VARCHAR(100) NOT NULL,
    base_url TEXT NOT NULL,
    api_key_encrypted TEXT,              -- NULL until an admin sets a key
    has_key BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES public.users(id)
);

ALTER TABLE public.llm_settings ENABLE ROW LEVEL SECURITY;

-- Admins can read/list configs (provider, model, base_url, has_key) to
-- populate the settings UI -- but api_key_encrypted, even if selected
-- directly, is useless ciphertext without the vault key.
CREATE POLICY "Admins can view llm settings"
    ON public.llm_settings FOR SELECT
    USING (public.is_admin());

-- Seed the two default configs, matching current hardcoded behavior
-- (Groq + gpt-oss-120b) so nothing changes until an admin actively
-- changes something in the new settings UI.
INSERT INTO public.llm_settings (purpose, provider, model, base_url)
VALUES
    ('grading', 'groq', 'openai/gpt-oss-120b', 'https://api.groq.com/openai/v1'),
    ('hints', 'groq', 'openai/gpt-oss-120b', 'https://api.groq.com/openai/v1')
ON CONFLICT (purpose) DO NOTHING;

-- ---------------------------------------------------------------------
-- Sets (encrypts) an API key for a given purpose. Callable only by
-- admins (checked explicitly, since this is SECURITY DEFINER and would
-- otherwise run with the function owner's broad privileges regardless
-- of caller).
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_llm_api_key(
    p_purpose VARCHAR,
    p_api_key TEXT,
    p_vault_key TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'admin access required';
    END IF;

    UPDATE public.llm_settings
    SET api_key_encrypted = pgp_sym_encrypt(p_api_key, p_vault_key),
        has_key = TRUE,
        updated_at = NOW(),
        updated_by = auth.uid()
    WHERE purpose = p_purpose;
END;
$$;

-- ---------------------------------------------------------------------
-- Reads back a DECRYPTED config for a purpose. Deliberately NOT
-- restricted to admin-only via is_admin(), because the caller here is
-- the Edge Function itself running as service_role, which has no
-- auth.uid() at all. The real access control is the REVOKE/GRANT below:
-- only service_role can call this function, period -- no authenticated
-- user, admin or not, can reach it through the normal client SDK.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_llm_config(
    p_purpose VARCHAR,
    p_vault_key TEXT
)
RETURNS TABLE(provider VARCHAR, model VARCHAR, base_url TEXT, api_key TEXT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, extensions
STABLE
AS $$
    SELECT
        provider,
        model,
        base_url,
        CASE WHEN api_key_encrypted IS NOT NULL
             THEN pgp_sym_decrypt(api_key_encrypted::bytea, p_vault_key)
             ELSE NULL END
    FROM public.llm_settings
    WHERE purpose = p_purpose;
$$;

REVOKE ALL ON FUNCTION public.get_llm_config(VARCHAR, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_llm_config(VARCHAR, TEXT) TO service_role;
