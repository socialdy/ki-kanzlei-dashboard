/* ── Supabase Data Access Layer: User Settings ── */

import { createClient } from "./server";
import { getSupabaseAdmin } from "./admin";

export interface LinkedInSenderProfile {
  name?: string;
  position?: string;
  company?: string;
  specialization?: string;
  tone?: string;
}

export interface UserSettings {
  user_id: string;
  n8n_webhook_url: string | null;
  gemini_api_key: string | null;
  /* CRM-Export */
  hubspot_api_key: string | null;
  pipedrive_api_key: string | null;
  pipedrive_domain: string | null;
  salesforce_instance_url: string | null;
  salesforce_access_token: string | null;
  zoho_client_id: string | null;
  zoho_client_secret: string | null;
  zoho_refresh_token: string | null;
  webhook_url: string | null;
  /* Unipile / LinkedIn */
  unipile_api_key: string | null;
  unipile_dsn: string | null;
  unipile_account_id: string | null;
  linkedin_daily_limit: number | null;
  linkedin_auto_outreach: boolean | null;
  linkedin_follow_up_days: number | null;
  linkedin_sender_profile: LinkedInSenderProfile | null;
  linkedin_outreach_template: string | null;
  created_at: string;
  updated_at: string;
}

export type UserSettingsUpdate = Partial<
  Pick<UserSettings,
    | "n8n_webhook_url"
    | "gemini_api_key"
    | "hubspot_api_key"
    | "pipedrive_api_key"
    | "pipedrive_domain"
    | "salesforce_instance_url"
    | "salesforce_access_token"
    | "zoho_client_id"
    | "zoho_client_secret"
    | "zoho_refresh_token"
    | "webhook_url"
    | "unipile_api_key"
    | "unipile_dsn"
    | "unipile_account_id"
    | "linkedin_daily_limit"
    | "linkedin_auto_outreach"
    | "linkedin_follow_up_days"
    | "linkedin_sender_profile"
    | "linkedin_outreach_template"
  >
>;

export async function getUserSettings(
  userId: string,
): Promise<UserSettings | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Fehler beim Laden der Einstellungen: ${error.message}`);
  }

  return data as UserSettings;
}

export async function upsertUserSettings(
  userId: string,
  data: UserSettingsUpdate,
): Promise<UserSettings> {
  const supabase = await createClient();

  const { data: settings, error } = await supabase
    .from("user_settings")
    .upsert({ user_id: userId, ...data })
    .select()
    .single();

  if (error) {
    throw new Error(`Fehler beim Speichern der Einstellungen: ${error.message}`);
  }

  return settings as UserSettings;
}

/* ── Admin-Zugriff (für n8n Trigger ohne Auth-Cookie) ── */
export async function getUserSettingsByUserId(
  userId: string,
): Promise<UserSettings | null> {
  const admin = getSupabaseAdmin();

  const { data, error } = await admin
    .from("user_settings")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(error.message);
  }

  return data as UserSettings;
}

/* ── Alle User mit auto_outreach holen (für Cron Jobs) ── */
export async function getAllAutoOutreachUsers(): Promise<UserSettings[]> {
  const admin = getSupabaseAdmin();

  const { data, error } = await admin
    .from("user_settings")
    .select("*")
    .eq("linkedin_auto_outreach", true)
    .not("unipile_api_key", "is", null)
    .not("unipile_dsn", "is", null)
    .not("unipile_account_id", "is", null);

  if (error) {
    throw new Error(`Fehler beim Laden der Auto-Outreach User: ${error.message}`);
  }

  return (data ?? []) as UserSettings[];
}
