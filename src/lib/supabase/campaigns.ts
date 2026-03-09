/* ── Supabase Data Access Layer: Campaigns ──
 *
 * Datenbankzugriffe für `campaigns` und `campaign_leads`.
 * Tracking-Endpunkte verwenden den Admin Client (kein Auth-Cookie bei Pixel-Requests).
 */

import { createClient } from "./server";
import { getSupabaseAdmin } from "./admin";
import type {
  Campaign,
  CampaignInsert,
  CampaignUpdate,
  CampaignLead,
  CampaignLeadStatus,
  CampaignStatus,
} from "@/types/campaigns";
import type { PaginatedResult, PaginationOptions } from "./leads";

/* ─────────────────────────── Typen ─────────────────────────── */

export interface CampaignFilters {
  status?: CampaignStatus;
  search?: string;
}

/* ───────────────────────── Campaigns ───────────────────────── */

export async function getCampaigns(
  userId: string,
  filters: CampaignFilters = {},
  pagination: PaginationOptions = {},
): Promise<PaginatedResult<Campaign>> {
  const supabase = await createClient();

  const page = pagination.page ?? 1;
  const pageSize = pagination.pageSize ?? 25;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("campaigns")
    .select("*", { count: "exact" })
    .eq("user_id", userId);

  if (filters.status) {
    query = query.eq("status", filters.status);
  }
  if (filters.search) {
    query = query.ilike("name", `%${filters.search}%`);
  }

  query = query.order("created_at", { ascending: false }).range(from, to);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Fehler beim Laden der Kampagnen: ${error.message}`);
  }

  const total = count ?? 0;
  return {
    data: (data ?? []) as Campaign[],
    count: total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getCampaignById(
  id: string,
  userId: string,
): Promise<Campaign | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Fehler beim Laden der Kampagne: ${error.message}`);
  }

  return data as Campaign;
}

export async function createCampaign(
  input: CampaignInsert,
  userId: string,
): Promise<Campaign> {
  const supabase = await createClient();

  // 1. Kampagne erstellen
  const { data: campaign, error } = await supabase
    .from("campaigns")
    .insert({
      user_id: userId,
      name: input.name,
      daily_limit: input.daily_limit,
      delay_minutes: input.delay_minutes,
      reply_to: input.reply_to,
      total_count: input.lead_ids.length,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Fehler beim Erstellen der Kampagne: ${error.message}`);
  }

  // 2. Campaign Leads erstellen
  if (input.lead_ids.length > 0) {
    const campaignLeads = input.lead_ids.map((lead_id) => ({
      campaign_id: campaign.id,
      lead_id,
      user_id: userId,
    }));

    const { error: leadsError } = await supabase
      .from("campaign_leads")
      .insert(campaignLeads);

    if (leadsError) {
      // Kampagne wieder löschen bei Fehler
      await supabase.from("campaigns").delete().eq("id", campaign.id);
      throw new Error(`Fehler beim Hinzufügen der Leads: ${leadsError.message}`);
    }
  }

  return campaign as Campaign;
}

export async function updateCampaign(
  id: string,
  data: CampaignUpdate,
  userId: string,
): Promise<Campaign> {
  const supabase = await createClient();

  const updatePayload: Record<string, unknown> = { ...data };

  // Timestamps für Statuswechsel
  if (data.status === "active") {
    updatePayload.started_at = new Date().toISOString();
  } else if (data.status === "completed") {
    updatePayload.completed_at = new Date().toISOString();
  }

  const { data: campaign, error } = await supabase
    .from("campaigns")
    .update(updatePayload)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Fehler beim Aktualisieren der Kampagne: ${error.message}`);
  }

  return campaign as Campaign;
}

export async function deleteCampaign(
  id: string,
  userId: string,
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("campaigns")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Fehler beim Löschen der Kampagne: ${error.message}`);
  }
}

/* ───────────────────── Campaign Leads ───────────────────── */

export async function getCampaignLeads(
  campaignId: string,
  userId: string,
  pagination: PaginationOptions = {},
  filters: { status?: CampaignLeadStatus; search?: string } = {},
): Promise<PaginatedResult<CampaignLead>> {
  const supabase = await createClient();

  const page = pagination.page ?? 1;
  const pageSize = pagination.pageSize ?? 25;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("campaign_leads")
    .select("*, lead:leads(company, email, ceo_name)", { count: "exact" })
    .eq("campaign_id", campaignId)
    .eq("user_id", userId);

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  query = query.order("created_at", { ascending: false }).range(from, to);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Fehler beim Laden der Campaign Leads: ${error.message}`);
  }

  const total = count ?? 0;
  return {
    data: (data ?? []) as CampaignLead[],
    count: total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/* ──────────────── Tracking (Admin Client) ──────────────── */

export async function trackOpen(token: string): Promise<boolean> {
  const admin = getSupabaseAdmin();

  // Campaign Lead finden und updaten
  const { data: cl, error: findError } = await admin
    .from("campaign_leads")
    .select("id, campaign_id, open_count, status")
    .eq("tracking_token", token)
    .single();

  if (findError || !cl) return false;

  const now = new Date().toISOString();
  const updates: Record<string, unknown> = {
    open_count: (cl.open_count ?? 0) + 1,
    last_opened_at: now,
  };

  // Nur beim ersten Open
  if (cl.open_count === 0) {
    updates.first_opened_at = now;
  }

  // Status nur auf 'opened' setzen wenn aktuell 'sent'
  if (cl.status === "sent") {
    updates.status = "opened";
  }

  await admin
    .from("campaign_leads")
    .update(updates)
    .eq("id", cl.id);

  // Campaign-Zähler inkrementieren (nur beim ersten Open)
  if (cl.open_count === 0) {
    await incrementCampaignCounter(cl.campaign_id, "open_count");
  }

  return true;
}

export async function trackBounce(
  email: string,
  bounceType?: string,
): Promise<boolean> {
  const admin = getSupabaseAdmin();

  // Suche campaign_lead über Join mit leads
  const { data: leads } = await admin
    .from("leads")
    .select("id")
    .eq("email", email);

  if (!leads || leads.length === 0) return false;

  const leadIds = leads.map((l) => l.id);
  const now = new Date().toISOString();

  // Finde den neuesten campaign_lead mit status 'sent' oder 'opened'
  const { data: cl } = await admin
    .from("campaign_leads")
    .select("id, campaign_id")
    .in("lead_id", leadIds)
    .in("status", ["sent", "opened"])
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!cl) return false;

  await admin
    .from("campaign_leads")
    .update({
      status: "bounced",
      bounced_at: now,
      bounce_type: bounceType ?? "hard",
    })
    .eq("id", cl.id);

  await incrementCampaignCounter(cl.campaign_id, "bounce_count");

  return true;
}

export async function trackReply(
  email: string,
  replyPreview?: string,
): Promise<boolean> {
  const admin = getSupabaseAdmin();

  const { data: leads } = await admin
    .from("leads")
    .select("id")
    .eq("email", email);

  if (!leads || leads.length === 0) return false;

  const leadIds = leads.map((l) => l.id);
  const now = new Date().toISOString();

  const { data: cl } = await admin
    .from("campaign_leads")
    .select("id, campaign_id")
    .in("lead_id", leadIds)
    .in("status", ["sent", "opened"])
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!cl) return false;

  await admin
    .from("campaign_leads")
    .update({
      status: "replied",
      replied_at: now,
      reply_preview: replyPreview ?? null,
    })
    .eq("id", cl.id);

  await incrementCampaignCounter(cl.campaign_id, "reply_count");

  return true;
}

async function incrementCampaignCounter(
  campaignId: string,
  field: string,
): Promise<void> {
  const admin = getSupabaseAdmin();

  // Atomares Increment via RPC (kein Read-then-Write Race Condition)
  const rpcName = `increment_${field}`;
  const { error } = await admin.rpc(rpcName, { p_campaign_id: campaignId });

  // Fallback: Falls RPC nicht existiert, klassisches Update
  if (error) {
    const { data } = await admin
      .from("campaigns")
      .select(field)
      .eq("id", campaignId)
      .single();

    if (!data) return;

    await admin
      .from("campaigns")
      .update({ [field]: ((data as unknown as Record<string, number>)[field] ?? 0) + 1 })
      .eq("id", campaignId);
  }
}
