-- CRM-Export: Neue Spalten in user_settings für API-Keys & Tokens
ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS hubspot_api_key text,
  ADD COLUMN IF NOT EXISTS pipedrive_api_key text,
  ADD COLUMN IF NOT EXISTS pipedrive_domain text,
  ADD COLUMN IF NOT EXISTS salesforce_instance_url text,
  ADD COLUMN IF NOT EXISTS salesforce_access_token text,
  ADD COLUMN IF NOT EXISTS zoho_client_id text,
  ADD COLUMN IF NOT EXISTS zoho_client_secret text,
  ADD COLUMN IF NOT EXISTS zoho_refresh_token text,
  ADD COLUMN IF NOT EXISTS webhook_url text;
