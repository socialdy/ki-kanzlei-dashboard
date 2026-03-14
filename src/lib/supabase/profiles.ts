import { createClient } from "./server";

export type UserRole = "admin" | "user";

export interface UserProfile {
  id: string;
  role: UserRole;
  display_name: string | null;
  created_at: string;
  updated_at: string;
}

/** Load the full profile for a user */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !data) return null;
  return data as UserProfile;
}

/** Load only the role for a user (for quick permission checks) */
export async function getUserRole(userId: string): Promise<UserRole> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (error || !data) return "user"; // default to least privilege
  return data.role as UserRole;
}
