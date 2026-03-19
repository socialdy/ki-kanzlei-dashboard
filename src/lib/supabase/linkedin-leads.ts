/* ── Supabase Data Access Layer: LinkedIn Leads ── */

import { createClient } from "./server";
import type {
  LinkedInLead,
  LinkedInLeadInsert,
  LinkedInLeadUpdate,
  LinkedInLeadStatus,
  LinkedInLeadFilters,
  LinkedInLeadStats,
} from "@/types/linkedin";

/* ── Pagination ── */

export interface PaginationOptions {
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/* ── Read ── */

export async function getLinkedInLeads(
  userId: string,
  filters: LinkedInLeadFilters = {},
  pagination: PaginationOptions = {},
): Promise<PaginatedResult<LinkedInLead>> {
  const supabase = await createClient();

  const page = pagination.page ?? 1;
  const pageSize = pagination.pageSize ?? 25;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("linkedin_leads")
    .select("*", { count: "exact" })
    .eq("user_id", userId);

  if (filters.status) {
    query = query.eq("status", filters.status);
  }
  if (filters.search_query) {
    query = query.eq("search_query", filters.search_query);
  }
  if (filters.search) {
    const term = `%${filters.search}%`;
    query = query.or(
      `full_name.ilike.${term},company.ilike.${term},headline.ilike.${term},location.ilike.${term}`,
    );
  }
  if (filters.industry) {
    query = query.eq("industry", filters.industry);
  }
  if (filters.location) {
    query = query.ilike("location", `%${filters.location}%`);
  }

  // Sorting
  const sortBy = filters.sort_by || "created_at";
  const sortAsc = filters.sort_dir === "asc";
  query = query.order(sortBy, { ascending: sortAsc }).range(from, to);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Fehler beim Laden der LinkedIn-Leads: ${error.message}`);
  }

  const total = count ?? 0;
  return {
    data: (data ?? []) as LinkedInLead[],
    count: total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getLinkedInLead(id: string): Promise<LinkedInLead | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("linkedin_leads")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Fehler beim Laden des LinkedIn-Leads: ${error.message}`);
  }

  return data as LinkedInLead;
}

/* ── Write ── */

export async function upsertLinkedInLead(
  lead: LinkedInLeadInsert,
): Promise<LinkedInLead> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("linkedin_leads")
    .upsert(lead, { onConflict: "user_id,linkedin_url" })
    .select()
    .single();

  if (error) {
    throw new Error(`Fehler beim Speichern des LinkedIn-Leads: ${error.message}`);
  }

  return data as LinkedInLead;
}

export async function upsertLinkedInLeads(
  leads: LinkedInLeadInsert[],
): Promise<LinkedInLead[]> {
  if (leads.length === 0) return [];

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("linkedin_leads")
    .upsert(leads, { onConflict: "user_id,linkedin_url" })
    .select();

  if (error) {
    throw new Error(`Fehler beim Speichern der LinkedIn-Leads: ${error.message}`);
  }

  return (data ?? []) as LinkedInLead[];
}

export async function updateLinkedInLeadStatus(
  id: string,
  status: LinkedInLeadStatus,
  extra: Partial<LinkedInLead> = {},
): Promise<LinkedInLead> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("linkedin_leads")
    .update({
      status,
      ...extra,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`Fehler beim Status-Update: ${error.message}`);
  }

  return data as LinkedInLead;
}

export async function updateLinkedInLead(
  id: string,
  fields: LinkedInLeadUpdate,
): Promise<LinkedInLead> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("linkedin_leads")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`Fehler beim Aktualisieren: ${error.message}`);
  }

  return data as LinkedInLead;
}

export async function deleteLinkedInLead(id: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("linkedin_leads")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(`Fehler beim Löschen: ${error.message}`);
  }
}

export async function bulkDeleteLinkedInLeads(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const supabase = await createClient();

  // Batch in chunks of 100 to avoid PostgREST URL length limits
  const BATCH = 100;
  for (let i = 0; i < ids.length; i += BATCH) {
    const chunk = ids.slice(i, i + BATCH);
    const { error } = await supabase
      .from("linkedin_leads")
      .delete()
      .in("id", chunk);

    if (error) {
      throw new Error(`Fehler beim Bulk-Löschen: ${error.message}`);
    }
  }
}

export async function bulkUpdateLinkedInLeadStatus(
  ids: string[],
  status: LinkedInLeadStatus,
): Promise<void> {
  if (ids.length === 0) return;
  const supabase = await createClient();

  // Batch in chunks of 100 to avoid PostgREST URL length limits
  const BATCH = 100;
  for (let i = 0; i < ids.length; i += BATCH) {
    const chunk = ids.slice(i, i + BATCH);
    const { error } = await supabase
      .from("linkedin_leads")
      .update({ status, updated_at: new Date().toISOString() })
      .in("id", chunk);

    if (error) {
      throw new Error(`Fehler beim Bulk-Status-Update: ${error.message}`);
    }
  }
}

/* ── Stats ── */

export async function getLinkedInLeadStats(
  userId: string,
): Promise<LinkedInLeadStats> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("linkedin_leads")
    .select("status")
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Fehler beim Laden der Statistiken: ${error.message}`);
  }

  const statuses: LinkedInLeadStatus[] = [
    "new", "analyzed", "queued", "invited",
    "accepted", "messaged", "replied", "declined", "error",
  ];

  const counts: Record<string, number> = {};
  for (const s of statuses) counts[s] = 0;
  counts.total = 0;

  for (const row of data ?? []) {
    const s = row.status as string;
    if (s in counts) {
      counts[s]++;
    }
    counts.total++;
  }

  return counts as unknown as LinkedInLeadStats;
}

/* ── Distinct values for filters ── */

export async function getDistinctLinkedInIndustries(
  userId: string,
): Promise<string[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("linkedin_leads")
    .select("industry")
    .eq("user_id", userId)
    .not("industry", "is", null)
    .order("industry");

  if (error) {
    throw new Error(`Fehler beim Laden der Branchen: ${error.message}`);
  }

  const unique = [...new Set((data ?? []).map((r) => r.industry as string).filter(Boolean))];
  return unique;
}

export async function getDistinctLinkedInLocations(
  userId: string,
): Promise<string[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("linkedin_leads")
    .select("location")
    .eq("user_id", userId)
    .not("location", "is", null)
    .order("location");

  if (error) {
    throw new Error(`Fehler beim Laden der Standorte: ${error.message}`);
  }

  const unique = [...new Set((data ?? []).map((r) => r.location as string).filter(Boolean))];
  return unique;
}

/* ── Outreach Queue ── */

export async function getLinkedInLeadsForOutreach(
  userId: string,
  limit: number,
): Promise<LinkedInLead[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("linkedin_leads")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "queued")
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(`Fehler beim Laden der Outreach-Queue: ${error.message}`);
  }

  return (data ?? []) as LinkedInLead[];
}

export async function getLinkedInLeadsForFollowUp(
  userId: string,
  followUpDays: number,
): Promise<LinkedInLead[]> {
  const supabase = await createClient();

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - followUpDays);

  const { data, error } = await supabase
    .from("linkedin_leads")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "accepted")
    .lt("connection_accepted_at", cutoff.toISOString())
    .is("follow_up_sent_at", null)
    .order("connection_accepted_at", { ascending: true });

  if (error) {
    throw new Error(`Fehler beim Laden der Follow-Up-Leads: ${error.message}`);
  }

  return (data ?? []) as LinkedInLead[];
}
