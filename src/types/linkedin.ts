/* ── LinkedIn Lead Types ── */

export type LinkedInLeadStatus =
  | "new"
  | "analyzed"
  | "queued"
  | "invited"
  | "accepted"
  | "messaged"
  | "replied"
  | "declined"
  | "error";

export interface LinkedInLead {
  id: string;
  user_id: string;
  linkedin_url: string;
  linkedin_id?: string | null;
  full_name: string;
  first_name?: string | null;
  last_name?: string | null;
  headline?: string | null;
  company?: string | null;
  position?: string | null;
  location?: string | null;
  profile_picture_url?: string | null;
  industry?: string | null;
  status: LinkedInLeadStatus;
  connection_sent_at?: string | null;
  connection_accepted_at?: string | null;
  follow_up_sent_at?: string | null;
  last_message_at?: string | null;
  ai_summary?: string | null;
  ai_score?: number | null;
  invite_message?: string | null;
  follow_up_message?: string | null;
  matched_lead_id?: string | null;
  search_query?: string | null;
  error_message?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export type LinkedInLeadInsert = Omit<LinkedInLead, "id" | "created_at" | "updated_at"> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type LinkedInLeadUpdate = Partial<
  Pick<
    LinkedInLead,
    | "full_name" | "first_name" | "last_name" | "headline"
    | "company" | "position" | "location" | "industry"
    | "profile_picture_url" | "linkedin_id"
    | "status" | "ai_summary" | "ai_score"
    | "invite_message" | "follow_up_message"
    | "matched_lead_id" | "notes" | "error_message"
    | "connection_sent_at" | "connection_accepted_at"
    | "follow_up_sent_at" | "last_message_at"
  >
>;

export interface LinkedInLeadFilters {
  status?: LinkedInLeadStatus;
  search?: string;
  search_query?: string;
  industry?: string;
  location?: string;
  sort_by?: string;
  sort_dir?: "asc" | "desc";
}

export interface LinkedInLeadStats {
  total: number;
  new: number;
  analyzed: number;
  queued: number;
  invited: number;
  accepted: number;
  messaged: number;
  replied: number;
  declined: number;
  error: number;
}

/* ── Status Display Config ── */

export const LINKEDIN_STATUS_CONFIG: Record<
  LinkedInLeadStatus,
  { label: string; className: string; dot: string }
> = {
  new:      { label: "Neu",           className: "bg-primary/8 text-primary border border-primary/15",                dot: "bg-primary/50" },
  analyzed: { label: "Analysiert",    className: "bg-primary/12 text-primary border border-primary/20",               dot: "bg-primary" },
  queued:   { label: "Warteschlange", className: "bg-amber-500/10 text-amber-700 border border-amber-500/15",         dot: "bg-amber-500" },
  invited:  { label: "Eingeladen",    className: "bg-primary/10 text-primary border border-primary/15",               dot: "bg-primary" },
  accepted: { label: "Akzeptiert",    className: "bg-emerald-500/10 text-emerald-700 border border-emerald-500/15",   dot: "bg-emerald-500" },
  messaged: { label: "Nachricht",     className: "bg-primary/10 text-primary border border-primary/15",               dot: "bg-primary" },
  replied:  { label: "Antwort",       className: "bg-emerald-500/10 text-emerald-700 border border-emerald-500/15",   dot: "bg-emerald-500" },
  declined: { label: "Kein Interesse", className: "bg-muted text-muted-foreground border border-border",              dot: "bg-muted-foreground/50" },
  error:    { label: "Fehler",        className: "bg-muted text-muted-foreground border border-border",               dot: "bg-muted-foreground/50" },
};

/** Status-Optionen die manuell gesetzt werden können (für Dropdowns) */
export const LINKEDIN_STATUS_OPTIONS: { value: LinkedInLeadStatus; label: string; dot: string }[] = [
  { value: "new",      label: "Neu",            dot: "bg-primary/50" },
  { value: "queued",   label: "Warteschlange",  dot: "bg-amber-500" },
  { value: "invited",  label: "Eingeladen",     dot: "bg-primary" },
  { value: "accepted", label: "Akzeptiert",     dot: "bg-emerald-500" },
  { value: "messaged", label: "Nachricht",      dot: "bg-primary" },
  { value: "replied",  label: "Antwort",        dot: "bg-emerald-500" },
  { value: "declined", label: "Kein Interesse", dot: "bg-muted-foreground/50" },
];
