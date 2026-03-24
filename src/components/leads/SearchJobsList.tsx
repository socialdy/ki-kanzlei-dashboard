"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Search,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Square,
  Loader2,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import type { SearchJob, SearchJobStatus } from "@/types/leads";

const JOB_STATUS_CONFIG: Record<
  SearchJobStatus,
  { label: string; className: string; dot: string }
> = {
  pending:   { label: "Wartend",        className: "bg-primary/8 text-primary border border-primary/15",   dot: "bg-primary/50" },
  running:   { label: "Läuft…",         className: "bg-primary/10 text-primary border border-primary/20",  dot: "bg-primary" },
  completed: { label: "Abgeschlossen",  className: "bg-primary/12 text-primary border border-primary/20",  dot: "bg-primary" },
  failed:    { label: "Fehlgeschlagen", className: "bg-muted text-muted-foreground border border-border",  dot: "bg-muted-foreground/50" },
};

function formatTime(dateStr: string | null): string {
  if (!dateStr) return "--";
  return new Date(dateStr).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatETA(estimatedEnd: string | null): string | null {
  if (!estimatedEnd) return null;
  const remaining = new Date(estimatedEnd).getTime() - Date.now();
  if (remaining <= 0) return "Gleich fertig…";
  const mins = Math.ceil(remaining / 60000);
  if (mins < 1) return "< 1 Min.";
  return `~${mins} Min. verbleibend`;
}

const JOBS_PAGE_SIZE = 10;

function buildPageNumbers(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "…", total];
  if (current >= total - 3) return [1, "…", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "…", current - 1, current, current + 1, "…", total];
}

interface SearchJobsListProps {
  jobs: SearchJob[];
  loading: boolean;
  onJobCancelled?: (jobId: string) => void;
  onJobDeleted?: (jobId: string) => void;
  onBulkDeleted?: (jobIds: string[]) => void;
}

export function SearchJobsList({ jobs, loading, onJobCancelled, onJobDeleted, onBulkDeleted }: SearchJobsListProps) {
  const [cancellingIds, setCancellingIds] = useState<Set<string>>(new Set());
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [page, setPage] = useState(1);

  // Active jobs always on top, then done jobs paginated
  const activeJobs = jobs.filter((j) => j.status === "pending" || j.status === "running");
  const doneJobs = jobs.filter((j) => j.status !== "pending" && j.status !== "running");

  const totalDonePages = Math.max(1, Math.ceil(doneJobs.length / JOBS_PAGE_SIZE));
  const safePage = Math.min(page, totalDonePages);
  const doneFrom = (safePage - 1) * JOBS_PAGE_SIZE;
  const doneTo = doneFrom + JOBS_PAGE_SIZE;
  const visibleDoneJobs = doneJobs.slice(doneFrom, doneTo);
  const visibleJobs = [...activeJobs, ...visibleDoneJobs];
  const pageNumbers = buildPageNumbers(safePage, totalDonePages);

  async function handleCancel(job: SearchJob) {
    setCancellingIds((prev) => new Set(prev).add(job.id));
    try {
      const res = await fetch(`/api/leads/search/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "failed",
          error_message: "Vom Benutzer abgebrochen",
        }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Suche "${job.query}" abgebrochen`);
      onJobCancelled?.(job.id);
    } catch {
      toast.error("Abbrechen fehlgeschlagen");
    } finally {
      setCancellingIds((prev) => {
        const next = new Set(prev);
        next.delete(job.id);
        return next;
      });
    }
  }

  async function handleDelete(job: SearchJob) {
    setDeletingIds((prev) => new Set(prev).add(job.id));
    try {
      const res = await fetch(`/api/leads/search/${job.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success(`Suchauftrag "${job.query}" gelöscht`);
      onJobDeleted?.(job.id);
    } catch {
      toast.error("Löschen fehlgeschlagen");
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(job.id);
        return next;
      });
    }
  }

  async function handleBulkDelete() {
    if (doneJobs.length === 0) return;
    setBulkDeleting(true);
    try {
      const res = await fetch("/api/leads/search/bulk", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: doneJobs.map((j) => j.id) }),
      });
      if (!res.ok) throw new Error();
      toast.success(`${doneJobs.length} Suchaufträge gelöscht`);
      setPage(1);
      onBulkDeleted?.(doneJobs.map((j) => j.id));
    } catch {
      toast.error("Bulk-Löschen fehlgeschlagen");
    } finally {
      setBulkDeleting(false);
    }
  }

  return (
    <Card>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-6 w-24" />
              </div>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <Empty className="py-16 border-0">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Search />
              </EmptyMedia>
              <EmptyTitle className="text-sm">Keine Suchaufträge</EmptyTitle>
              <EmptyDescription>
                Starte eine neue Suche oben, um Leads zu finden.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            {/* Count bar */}
            <div className="px-4 py-2.5 border-b">
              <p className="text-sm text-muted-foreground">
                {jobs.length} Suchaufträge
                {activeJobs.length > 0 && (
                  <span className="ml-1 text-primary font-medium">
                    · {activeJobs.length} aktiv
                  </span>
                )}
              </p>
            </div>

            <div className="divide-y">
              {visibleJobs.map((job) => {
                const statusCfg = JOB_STATUS_CONFIG[job.status];
                const isActive =
                  job.status === "pending" || job.status === "running";
                const isCancelling = cancellingIds.has(job.id);
                const isDeleting = deletingIds.has(job.id);

                // Progress calculation
                const progressPercent = job.total_count && job.total_count > 0
                  ? Math.min(100, Math.round((job.results_count / job.total_count) * 100))
                  : undefined;
                const etaText = isActive ? formatETA(job.estimated_end_at ?? null) : null;

                return (
                  <div
                    key={job.id}
                    className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
                  >
                    {/* Icon — all in brand blue */}
                    <div
                      className={cn(
                        "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
                        job.status === "failed" ? "bg-muted" : "bg-primary/10",
                      )}
                    >
                      {isActive ? (
                        <Loader2 className="h-5 w-5 text-primary animate-spin" />
                      ) : job.status === "completed" ? (
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      ) : (
                        <XCircle className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">
                          {job.query}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          in {job.location}
                          {job.country && ` (${job.country})`}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(job.created_at)}
                        </span>
                        {job.results_count > 0 && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {job.results_count} Ergebnisse
                            {job.total_count ? ` / ${job.total_count} gesamt` : ""}
                          </span>
                        )}
                        {etaText && (
                          <span className="text-xs text-primary/70">
                            {etaText}
                          </span>
                        )}
                      </div>
                      {/* Progress bar for running jobs */}
                      {job.status === "running" && (
                        <Progress
                          value={progressPercent}
                          className="h-1 mt-2 w-full max-w-xs"
                        />
                      )}
                      {/* Error message for failed jobs */}
                      {job.status === "failed" && job.error_message && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <AlertCircle className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className="text-xs text-muted-foreground truncate">
                            {job.error_message}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {isActive && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted"
                          onClick={() => handleCancel(job)}
                          disabled={isCancelling}
                        >
                          {isCancelling ? (
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          ) : (
                            <Square className="h-3 w-3 mr-1 fill-current" />
                          )}
                          Stopp
                        </Button>
                      )}
                      {!isActive && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted"
                          onClick={() => handleDelete(job)}
                          disabled={isDeleting}
                        >
                          {isDeleting ? (
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3 mr-1" />
                          )}
                          Löschen
                        </Button>
                      )}
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-[11px] font-medium px-2 py-0.5 gap-1.5",
                          statusCfg.className,
                          job.status === "running" && "animate-pulse",
                        )}
                      >
                        <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", statusCfg.dot)} />
                        {statusCfg.label}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination — identical to leads table */}
            {totalDonePages > 1 && (
              <>
                <Separator />
                <div className="px-4 py-3 flex items-center justify-between gap-4">
                  <p className="text-sm text-muted-foreground whitespace-nowrap">
                    Seite {safePage} von {totalDonePages} ({doneJobs.length} abgeschlossen)
                  </p>
                  <Pagination className="mx-0 w-auto justify-end">
                    <PaginationContent className="gap-1">
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => { e.preventDefault(); if (safePage > 1) setPage(safePage - 1); }}
                          className={safePage <= 1 ? "pointer-events-none opacity-40" : ""}
                        />
                      </PaginationItem>

                      {pageNumbers.map((p, i) =>
                        p === "…" ? (
                          <PaginationItem key={`ellipsis-${i}`}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        ) : (
                          <PaginationItem key={p}>
                            <PaginationLink
                              href="#"
                              isActive={p === safePage}
                              onClick={(e) => { e.preventDefault(); setPage(p as number); }}
                            >
                              {p}
                            </PaginationLink>
                          </PaginationItem>
                        ),
                      )}

                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => { e.preventDefault(); if (safePage < totalDonePages) setPage(safePage + 1); }}
                          className={safePage >= totalDonePages ? "pointer-events-none opacity-40" : ""}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
