/* ── Supabase Data Access Layer: Leads & Search Jobs ──
 *
 * Alle Datenbankzugriffe für die Tabellen `leads` und `search_jobs`.
 * Verwendet den Server-Client (Cookie-basiert, RLS-geschützt).
 */

import { createClient } from "./server";
import type {
  Lead,
  LeadInsert,
  LeadUpdate,
  LeadStatus,
  SearchJob,
  SearchJobInsert,
  SearchJobStatus,
} from "@/types/leads";

/* ─────────────────────────── Typen ─────────────────────────── */

/** Optionale Filter für die Lead-Abfrage */
export interface LeadFilters {
  status?: LeadStatus;
  city?: string;
  category?: string;
  industry?: string;
  search_query?: string;
  search_location?: string;
  /** Volltextsuche über Name, Firma, E-Mail */
  search?: string;
}

/** Pagination-Optionen */
export interface PaginationOptions {
  page?: number;
  pageSize?: number;
}

/** Paginiertes Ergebnis */
export interface PaginatedResult<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** Statistik: Anzahl Leads pro Status */
export type LeadStats = Record<LeadStatus, number> & { total: number };

/** Optionale Zusatzfelder beim Aktualisieren des Search-Job-Status */
export interface SearchJobStatusExtras {
  results_count?: number;
  error_message?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
}

/* ───────────────────────── Leads ───────────────────────── */

/**
 * Leads abrufen mit optionalen Filtern und Pagination.
 * RLS sorgt dafür, dass nur Leads des eingeloggten Users zurückkommen.
 */
export async function getLeads(
  filters: LeadFilters = {},
  pagination: PaginationOptions = {},
): Promise<PaginatedResult<Lead>> {
  const supabase = await createClient();

  const page = pagination.page ?? 1;
  const pageSize = pagination.pageSize ?? 25;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("leads")
    .select("*", { count: "exact" });

  /* Exakte Filter */
  if (filters.status) {
    query = query.eq("status", filters.status);
  }
  if (filters.city) {
    query = query.ilike("city", `%${filters.city}%`);
  }
  if (filters.category) {
    query = query.ilike("category", `%${filters.category}%`);
  }
  if (filters.industry) {
    query = query.ilike("industry", `%${filters.industry}%`);
  }
  if (filters.search_query) {
    query = query.eq("search_query", filters.search_query);
  }
  if (filters.search_location) {
    query = query.eq("search_location", filters.search_location);
  }

  /* Volltextsuche über mehrere Spalten */
  if (filters.search) {
    const term = `%${filters.search}%`;
    query = query.or(
      `name.ilike.${term},company.ilike.${term},company_name.ilike.${term},email.ilike.${term},city.ilike.${term}`,
    );
  }

  /* Sortierung & Pagination */
  query = query.order("created_at", { ascending: false }).range(from, to);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Fehler beim Laden der Leads: ${error.message}`);
  }

  const total = count ?? 0;

  return {
    data: (data ?? []) as Lead[],
    count: total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * Einzelnen Lead anhand der ID abrufen.
 */
export async function getLeadById(id: string): Promise<Lead | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    /* PGRST116 = kein Ergebnis gefunden → null zurückgeben */
    if (error.code === "PGRST116") return null;
    throw new Error(`Fehler beim Laden des Leads: ${error.message}`);
  }

  return data as Lead;
}

/**
 * Mehrere Leads auf einmal einfügen (Bulk Insert).
 * Gibt die eingefügten Leads zurück.
 */
export async function insertLeads(leads: LeadInsert[]): Promise<Lead[]> {
  if (leads.length === 0) return [];

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("leads")
    .insert(leads)
    .select();

  if (error) {
    throw new Error(`Fehler beim Einfügen der Leads: ${error.message}`);
  }

  return (data ?? []) as Lead[];
}

/**
 * Status eines Leads aktualisieren.
 * Setzt automatisch `updated_at` auf den aktuellen Zeitpunkt.
 */
export async function updateLeadStatus(
  id: string,
  status: LeadStatus,
): Promise<Lead> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("leads")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`Fehler beim Aktualisieren des Lead-Status: ${error.message}`);
  }

  return data as Lead;
}

/**
 * Lead aktualisieren (beliebige Felder).
 */
export async function updateLead(
  id: string,
  fields: LeadUpdate,
): Promise<Lead> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("leads")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`Fehler beim Aktualisieren des Leads: ${error.message}`);
  }

  return data as Lead;
}

/**
 * Einzelnen Lead löschen.
 */
export async function deleteLead(id: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("leads")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(`Fehler beim Löschen des Leads: ${error.message}`);
  }
}

/**
 * Mehrere Leads auf einmal löschen.
 */
export async function bulkDeleteLeads(ids: string[]): Promise<void> {
  if (ids.length === 0) return;

  const supabase = await createClient();

  const { error } = await supabase
    .from("leads")
    .delete()
    .in("id", ids);

  if (error) {
    throw new Error(`Fehler beim Bulk-Löschen der Leads: ${error.message}`);
  }
}

/**
 * Status mehrerer Leads gleichzeitig aktualisieren.
 */
export async function bulkUpdateLeadStatus(
  ids: string[],
  status: LeadStatus,
): Promise<void> {
  if (ids.length === 0) return;

  const supabase = await createClient();

  const { error } = await supabase
    .from("leads")
    .update({ status, updated_at: new Date().toISOString() })
    .in("id", ids);

  if (error) {
    throw new Error(`Fehler beim Bulk-Status-Update: ${error.message}`);
  }
}

/**
 * Statistiken: Anzahl der Leads gruppiert nach Status.
 */
export async function getLeadStats(): Promise<LeadStats> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("leads")
    .select("status");

  if (error) {
    throw new Error(`Fehler beim Laden der Lead-Statistiken: ${error.message}`);
  }

  const statuses: LeadStatus[] = [
    "new",
    "enriched",
    "contacted",
    "qualified",
    "converted",
    "closed",
  ];

  const stats = Object.fromEntries(
    statuses.map((s) => [s, 0]),
  ) as Record<LeadStatus, number> & { total: number };
  stats.total = 0;

  for (const row of data ?? []) {
    const s = row.status as LeadStatus;
    if (s in stats) {
      stats[s]++;
    }
    stats.total++;
  }

  return stats;
}

/* ─────────────────────── Search Jobs ─────────────────────── */

/**
 * Neuen Such-Job anlegen.
 */
export async function createSearchJob(
  job: SearchJobInsert,
): Promise<SearchJob> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("search_jobs")
    .insert({ ...job, status: job.status ?? "pending" })
    .select()
    .single();

  if (error) {
    throw new Error(`Fehler beim Anlegen des Such-Jobs: ${error.message}`);
  }

  return data as SearchJob;
}

/**
 * Alle Such-Jobs des eingeloggten Users abrufen (neueste zuerst).
 */
export async function getSearchJobs(): Promise<SearchJob[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("search_jobs")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Fehler beim Laden der Such-Jobs: ${error.message}`);
  }

  return (data ?? []) as SearchJob[];
}

/**
 * Status eines Such-Jobs aktualisieren.
 */
export async function updateSearchJobStatus(
  id: string,
  status: SearchJobStatus,
  extras: SearchJobStatusExtras = {},
): Promise<SearchJob> {
  const supabase = await createClient();

  const updatePayload: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
    ...extras,
  };

  const { data, error } = await supabase
    .from("search_jobs")
    .update(updatePayload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`Fehler beim Aktualisieren des Such-Job-Status: ${error.message}`);
  }

  return data as SearchJob;
}

/**
 * Einzelnen Such-Job anhand der ID abrufen.
 */
export async function getSearchJobById(id: string): Promise<SearchJob | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("search_jobs")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Fehler beim Laden des Such-Jobs: ${error.message}`);
  }

  return data as SearchJob;
}
