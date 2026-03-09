/* ── Supabase Data Access Layer: User Settings ── */

import { createClient } from "./server";
import { getSupabaseAdmin } from "./admin";

export interface UserSettings {
  user_id: string;
  n8n_webhook_url: string | null;
  gemini_api_key: string | null;
  created_at: string;
  updated_at: string;
}

export type UserSettingsUpdate = Partial<
  Pick<UserSettings, "n8n_webhook_url" | "gemini_api_key">
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
