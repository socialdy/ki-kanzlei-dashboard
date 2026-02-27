"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Search,
  Users,
  Download,
  RefreshCw,
  InboxIcon,
  X,
  Filter,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

import { LeadsTable, LEAD_STATUS_CONFIG } from "@/components/leads/LeadsTable";
import { LeadSelectionBar } from "@/components/leads/LeadSelectionBar";
import { LeadEditSheet } from "@/components/leads/LeadEditSheet";
import { LeadDeleteDialog } from "@/components/leads/LeadDeleteDialog";
import { SearchJobsList } from "@/components/leads/SearchJobsList";
import { LeadSearchForm } from "@/components/leads/LeadSearchForm";
import { IndustryCombobox } from "@/components/leads/IndustryCombobox";
import type { SearchFormValues } from "@/components/leads/LeadSearchForm";

import type { Lead, LeadStatus, SearchJob } from "@/types/leads";
import { countryLabel } from "@/types/leads";

const PAGE_SIZE = 20;

/* ── CSV Export ── */
function exportLeadsToCSV(leads: Lead[]): void {
  if (leads.length === 0) {
    toast.error("Keine Leads zum Exportieren vorhanden");
    return;
  }

  const headers = [
    "Firma", "Name/GF", "Titel", "Anrede", "Branche", "Rechtsform",
    "Straße", "PLZ", "Ort", "Land",
    "Telefon", "E-Mail", "Website", "Status",
    "LinkedIn", "Facebook", "Instagram", "Xing", "Twitter/X", "YouTube", "TikTok",
  ];

  function escapeCSV(value: string | number | null | undefined): string {
    if (value === null || value === undefined) return "";
    const str = String(value);
    if (str.includes(";") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  const rows = leads.map((lead) => {
    const statusLabel = LEAD_STATUS_CONFIG[lead.status]?.label ?? lead.status;
    const genderLabel = lead.ceo_gender === "herr" ? "Herr" : lead.ceo_gender === "frau" ? "Frau" : "";
    return [
      escapeCSV(lead.company), escapeCSV(lead.ceo_name ?? lead.name),
      escapeCSV(lead.ceo_title), escapeCSV(genderLabel),
      escapeCSV(lead.category ?? lead.industry), escapeCSV(lead.legal_form),
      escapeCSV(lead.street ?? lead.address),
      escapeCSV(lead.postal_code), escapeCSV(lead.city), escapeCSV(countryLabel(lead.country)),
      escapeCSV(lead.phone), escapeCSV(lead.email), escapeCSV(lead.website),
      escapeCSV(statusLabel),
      escapeCSV(lead.social_linkedin), escapeCSV(lead.social_facebook),
      escapeCSV(lead.social_instagram), escapeCSV(lead.social_xing),
      escapeCSV(lead.social_twitter), escapeCSV(lead.social_youtube),
      escapeCSV(lead.social_tiktok),
    ].join(";");
  });

  const BOM = "\uFEFF";
  const csvContent = BOM + headers.join(";") + "\n" + rows.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const dateStr = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `leads_export_${dateStr}.csv`;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
  toast.success(`${leads.length} Leads als CSV exportiert`);
}

/* ── Pagination helpers ── */
function buildPageNumbers(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "…", total];
  if (current >= total - 3) return [1, "…", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "…", current - 1, current, current + 1, "…", total];
}

/* ── Status-Liste für Filter ── */
const STATUS_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: "all",       label: "Alle Status" },
  { value: "new",       label: "Neu" },
  { value: "enriched",  label: "Angereichert" },
  { value: "contacted", label: "Kontaktiert" },
  { value: "qualified", label: "Qualifiziert" },
  { value: "converted", label: "Konvertiert" },
  { value: "closed",    label: "Geschlossen" },
];

/* ══════════════════════════════════════════════════════════════
   Hauptkomponente
   ══════════════════════════════════════════════════════════════ */
export default function LeadScrapingPage() {
  /* ── State ── */
  const [leads, setLeads]           = useState<Lead[]>([]);
  const [leadsCount, setLeadsCount] = useState(0);
  const [leadsLoading, setLeadsLoading] = useState(true);
  const [leadsPage, setLeadsPage]   = useState(1);

  const [searchJobs, setSearchJobs] = useState<SearchJob[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab]   = useState("search");

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [editLead, setEditLead]     = useState<Lead | null>(null);
  const [editOpen, setEditOpen]     = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteIds, setDeleteIds]   = useState<string[]>([]);

  /* ── Filter State ── */
  const [filterSearch, setFilterSearch]     = useState("");
  const [filterStatus, setFilterStatus]     = useState("all");
  const [filterIndustry, setFilterIndustry] = useState<string | undefined>(undefined);
  const [filterCity, setFilterCity]         = useState("");

  const hasActiveFilters = filterSearch || filterStatus !== "all" || filterIndustry || filterCity;

  function resetFilters() {
    setFilterSearch("");
    setFilterStatus("all");
    setFilterIndustry(undefined);
    setFilterCity("");
    setLeadsPage(1);
  }

  /* ── Data fetching ── */
  const fetchLeads = useCallback(async (page = 1) => {
    setLeadsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (filterSearch) params.set("search", filterSearch);
      if (filterStatus !== "all") params.set("status", filterStatus);
      if (filterIndustry) params.set("industry", filterIndustry);
      if (filterCity) params.set("city", filterCity);

      const res = await fetch(`/api/leads?${params.toString()}`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      setLeads(json.data ?? []);
      setLeadsCount(json.count ?? 0);
    } catch {
      toast.error("Fehler beim Laden der Leads");
    } finally {
      setLeadsLoading(false);
    }
  }, [filterSearch, filterStatus, filterIndustry, filterCity]);

  const fetchJobs = useCallback(async () => {
    setJobsLoading(true);
    try {
      const res = await fetch("/api/leads/search");
      if (!res.ok) throw new Error();
      const json = await res.json();
      setSearchJobs(json.data ?? []);
    } catch {
      /* silent */
    } finally {
      setJobsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads(1);
    fetchJobs();
  }, [fetchLeads, fetchJobs]);

  // Re-fetch when filters change (reset to page 1)
  useEffect(() => {
    setLeadsPage(1);
    fetchLeads(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, filterIndustry]);

  /* ── Debounced text-filter fetch ── */
  useEffect(() => {
    const timer = setTimeout(() => {
      setLeadsPage(1);
      fetchLeads(1);
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterSearch, filterCity]);

  /* ── Polling + Stale-Job-Timeout ── */
  const STALE_JOB_TIMEOUT_MS = 10 * 60 * 1000;

  useEffect(() => {
    const activeJobs = searchJobs.filter(
      (j) => j.status === "pending" || j.status === "running",
    );
    if (activeJobs.length === 0) return;

    const interval = setInterval(async () => {
      let hasChanges = false;
      const now = Date.now();
      const updatedJobs = await Promise.all(
        searchJobs.map(async (job) => {
          if (job.status !== "pending" && job.status !== "running") return job;

          const jobAge = now - new Date(job.created_at).getTime();
          if (jobAge > STALE_JOB_TIMEOUT_MS) {
            hasChanges = true;
            toast.error(
              `Suche "${job.query}" abgebrochen — Zeitüberschreitung (n8n Workflow nicht erreichbar)`,
            );
            fetch(`/api/leads/search/${job.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                status: "failed",
                error_message: "Zeitüberschreitung — n8n Workflow nicht erreichbar oder inaktiv",
              }),
            }).catch(() => {});
            return {
              ...job,
              status: "failed" as const,
              error_message: "Zeitüberschreitung — n8n Workflow nicht erreichbar oder inaktiv",
            };
          }

          try {
            const res = await fetch(`/api/leads/search/${job.id}`);
            if (!res.ok) return job;
            const json = await res.json();
            const updated = json.data as SearchJob;
            if (updated.status !== job.status) {
              hasChanges = true;
              if (updated.status === "completed") {
                toast.success(
                  `Suche "${job.query} in ${job.location}" abgeschlossen — ${updated.results_count} Ergebnisse`,
                );
              } else if (updated.status === "failed") {
                toast.error(
                  `Suche "${job.query}" fehlgeschlagen: ${updated.error_message ?? "Unbekannter Fehler"}`,
                );
              }
            }
            return updated;
          } catch {
            return job;
          }
        }),
      );
      setSearchJobs(updatedJobs);
      if (hasChanges) fetchLeads(leadsPage);
    }, 3000);

    return () => clearInterval(interval);
  }, [searchJobs, fetchLeads, leadsPage]);

  /* ── Search submit ── */
  async function onSearchSubmit(values: SearchFormValues) {
    setIsSearching(true);
    try {
      const res = await fetch("/api/leads/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error ?? "Suche konnte nicht gestartet werden");
      }
      const json = await res.json();
      setSearchJobs((prev) => [json.data as SearchJob, ...prev]);
      setActiveTab("search");
      toast.success(`Suche nach "${values.query}" in ${values.location} gestartet`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ein Fehler ist aufgetreten");
    } finally {
      setIsSearching(false);
    }
  }

  /* ── Pagination ── */
  function handlePageChange(page: number) {
    setLeadsPage(page);
    fetchLeads(page);
    setSelectedIds(new Set());
  }

  /* ── Selection / Bulk actions ── */
  function handleRefresh() {
    setSelectedIds(new Set());
    fetchJobs();
    fetchLeads(leadsPage);
  }

  function handleEditFromSelection() {
    const id = Array.from(selectedIds)[0];
    const lead = leads.find((l) => l.id === id);
    if (lead) { setEditLead(lead); setEditOpen(true); }
  }

  function handleDeleteFromSelection() {
    setDeleteIds(Array.from(selectedIds));
    setDeleteOpen(true);
  }

  async function handleBulkStatusChange(status: LeadStatus) {
    const ids = Array.from(selectedIds);
    const res = await fetch("/api/leads/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "status", ids, status }),
    });
    if (!res.ok) throw new Error();
    toast.success(`Status von ${ids.length} Lead(s) geändert`);
    setSelectedIds(new Set());
    fetchLeads(leadsPage);
  }

  /* ── Row-level actions ── */
  function handleEditLead(lead: Lead) {
    setEditLead(lead);
    setEditOpen(true);
  }

  function handleDeleteLead(ids: string[]) {
    setDeleteIds(ids);
    setDeleteOpen(true);
  }

  async function handleRowStatusChange(lead: Lead, status: LeadStatus) {
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Status von „${lead.company}" auf „${LEAD_STATUS_CONFIG[status].label}" geändert`);
      fetchLeads(leadsPage);
    } catch {
      toast.error("Status konnte nicht geändert werden");
    }
  }

  /* ── Callbacks after save/delete ── */
  function handleSaved() {
    setSelectedIds(new Set());
    fetchLeads(leadsPage);
  }

  function handleDeleted() {
    setSelectedIds(new Set());
    setDeleteIds([]);
    fetchLeads(leadsPage);
  }

  /* ── Derived ── */
  const totalPages     = Math.max(1, Math.ceil(leadsCount / PAGE_SIZE));
  const activeJobsCount = searchJobs.filter(
    (j) => j.status === "pending" || j.status === "running",
  ).length;
  const pageNumbers = buildPageNumbers(leadsPage, totalPages);

  /* ══════════════════════════════════════════════════════════
     Render
     ══════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-5">

      {/* Page Header */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Leads</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Finde und verwalte Leads über Google Places + LangSearch
        </p>
      </div>

      {/* Suchformular */}
      <LeadSearchForm onSubmit={onSearchSubmit} isSearching={isSearching} />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-0">
        <div className="flex items-center justify-between">
          <TabsList className="h-9">
            <TabsTrigger value="search" className="text-xs gap-1.5 px-3">
              <Search className="h-3.5 w-3.5" />
              Suchaufträge
              {activeJobsCount > 0 && (
                <Badge variant="secondary" className="h-4 px-1.5 text-[10px] ml-0.5">
                  {activeJobsCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="leads" className="text-xs gap-1.5 px-3">
              <Users className="h-3.5 w-3.5" />
              Alle Leads
              {leadsCount > 0 && (
                <Badge variant="secondary" className="h-4 px-1.5 text-[10px] ml-0.5">
                  {leadsCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Leads-Tab Toolbar */}
          {activeTab === "leads" && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportLeadsToCSV(leads)}
                disabled={leads.length === 0 || leadsLoading}
                className="h-8 text-xs gap-1.5"
              >
                <Download className="h-3.5 w-3.5" />
                CSV Export
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleRefresh}
                title="Aktualisieren"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>

        {/* Tab: Suchaufträge */}
        <TabsContent value="search" className="mt-3">
          <SearchJobsList jobs={searchJobs} loading={jobsLoading} />
        </TabsContent>

        {/* Tab: Alle Leads */}
        <TabsContent value="leads" className="mt-3">
          <div className="rounded-lg border bg-card overflow-hidden">

            {/* Filter-Leiste */}
            <div className="px-4 py-3 border-b bg-muted/20 space-y-3">
              <div className="flex items-center gap-2">
                <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs font-medium text-muted-foreground">Filter</span>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-[11px] text-muted-foreground ml-auto"
                    onClick={resetFilters}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Zurücksetzen
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                {/* Textsuche */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Suche (Firma, Name, E-Mail...)"
                    className="h-8 pl-8 text-xs"
                    value={filterSearch}
                    onChange={(e) => setFilterSearch(e.target.value)}
                  />
                </div>

                {/* Status */}
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_FILTER_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="text-xs">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Branche */}
                <IndustryCombobox
                  value={filterIndustry}
                  onChange={(val) => setFilterIndustry(val ?? undefined)}
                  placeholder="Branche filtern"
                />

                {/* Stadt */}
                <Input
                  placeholder="Stadt / Ort"
                  className="h-8 text-xs"
                  value={filterCity}
                  onChange={(e) => setFilterCity(e.target.value)}
                />
              </div>
            </div>

            {/* Count-Bar */}
            <div className="px-4 py-2.5 border-b bg-muted/30 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {leadsCount.toLocaleString("de-DE")} Einträge gesamt
                {hasActiveFilters && (
                  <span className="ml-1 text-primary">(gefiltert)</span>
                )}
                {selectedIds.size > 0 && (
                  <span className="ml-2 text-primary font-medium">
                    · {selectedIds.size} ausgewählt
                  </span>
                )}
              </p>
            </div>

            {/* Table or states */}
            {leadsLoading ? (
              <div className="p-5 space-y-2.5">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-md" />
                ))}
              </div>
            ) : leads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-4">
                <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mb-3">
                  <InboxIcon className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-sm font-semibold mb-1">
                  {hasActiveFilters ? "Keine Ergebnisse" : "Noch keine Leads"}
                </h3>
                <p className="text-sm text-muted-foreground text-center max-w-xs">
                  {hasActiveFilters
                    ? "Passe die Filter an oder setze sie zurück."
                    : "Starte eine Suche, um Leads zu importieren."}
                </p>
                {hasActiveFilters && (
                  <Button variant="outline" size="sm" className="mt-3 text-xs" onClick={resetFilters}>
                    Filter zurücksetzen
                  </Button>
                )}
              </div>
            ) : (
              <>
                <LeadsTable
                  leads={leads}
                  selectedIds={selectedIds}
                  onSelectionChange={setSelectedIds}
                  onEditLead={handleEditLead}
                  onDeleteLead={handleDeleteLead}
                  onStatusChange={handleRowStatusChange}
                />

                {/* Pagination */}
                {totalPages > 1 && (
                  <>
                    <Separator />
                    <div className="px-4 py-3 flex items-center justify-between gap-4">
                      <p className="text-xs text-muted-foreground whitespace-nowrap">
                        Seite {leadsPage} von {totalPages}
                      </p>
                      <Pagination className="mx-0 w-auto justify-end">
                        <PaginationContent className="gap-0.5">
                          <PaginationItem>
                            <PaginationPrevious
                              href="#"
                              onClick={(e) => { e.preventDefault(); if (leadsPage > 1) handlePageChange(leadsPage - 1); }}
                              className={`h-8 text-xs px-2 ${leadsPage <= 1 ? "pointer-events-none opacity-40" : ""}`}
                            />
                          </PaginationItem>

                          {pageNumbers.map((p, i) =>
                            p === "…" ? (
                              <PaginationItem key={`ellipsis-${i}`}>
                                <PaginationEllipsis className="h-8 w-8" />
                              </PaginationItem>
                            ) : (
                              <PaginationItem key={p}>
                                <PaginationLink
                                  href="#"
                                  isActive={p === leadsPage}
                                  onClick={(e) => { e.preventDefault(); handlePageChange(p as number); }}
                                  className="h-8 w-8 text-xs"
                                >
                                  {p}
                                </PaginationLink>
                              </PaginationItem>
                            ),
                          )}

                          <PaginationItem>
                            <PaginationNext
                              href="#"
                              onClick={(e) => { e.preventDefault(); if (leadsPage < totalPages) handlePageChange(leadsPage + 1); }}
                              className={`h-8 text-xs px-2 ${leadsPage >= totalPages ? "pointer-events-none opacity-40" : ""}`}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Selection Bar (fixed bottom) */}
      <LeadSelectionBar
        selectedCount={selectedIds.size}
        onClear={() => setSelectedIds(new Set())}
        onEdit={handleEditFromSelection}
        onDelete={handleDeleteFromSelection}
        onStatusChange={handleBulkStatusChange}
      />

      {/* Edit Sheet */}
      <LeadEditSheet
        lead={editLead}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSaved={handleSaved}
      />

      {/* Delete Dialog */}
      <LeadDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        leadIds={deleteIds}
        onDeleted={handleDeleted}
      />
    </div>
  );
}
