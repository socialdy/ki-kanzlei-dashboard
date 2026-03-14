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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
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
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  pending: { label: "Wartend", variant: "secondary" },
  running: { label: "Läuft...", variant: "default" },
  completed: { label: "Abgeschlossen", variant: "outline" },
  failed: { label: "Fehlgeschlagen", variant: "destructive" },
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

interface SearchJobsListProps {
  jobs: SearchJob[];
  loading: boolean;
  onJobCancelled?: (jobId: string) => void;
}

export function SearchJobsList({ jobs, loading, onJobCancelled }: SearchJobsListProps) {
  const [cancellingIds, setCancellingIds] = useState<Set<string>>(new Set());

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
          <div className="divide-y">
            {jobs.map((job) => {
              const statusCfg = JOB_STATUS_CONFIG[job.status];
              const isActive =
                job.status === "pending" || job.status === "running";
              const isCancelling = cancellingIds.has(job.id);
              return (
                <div
                  key={job.id}
                  className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
                >
                  <div
                    className={cn(
                      "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
                      isActive
                        ? "bg-primary/10"
                        : job.status === "completed"
                          ? "bg-emerald-50"
                          : "bg-destructive/10",
                    )}
                  >
                    {isActive ? (
                      <Spinner className="h-5 w-5 text-primary" />
                    ) : job.status === "completed" ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive" />
                    )}
                  </div>

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
                        </span>
                      )}
                    </div>
                    {job.status === "running" && (
                      <Progress
                        value={undefined}
                        className="h-1 mt-2 w-full max-w-xs [&>div]:animate-pulse"
                      />
                    )}
                    {job.status === "failed" && job.error_message && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <AlertCircle className="h-3 w-3 text-destructive shrink-0" />
                        <span className="text-xs text-destructive truncate">
                          {job.error_message}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isActive && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleCancel(job)}
                        disabled={isCancelling}
                      >
                        {isCancelling ? (
                          <Spinner className="h-3 w-3 mr-1" />
                        ) : (
                          <Square className="h-3 w-3 mr-1 fill-current" />
                        )}
                        Stopp
                      </Button>
                    )}
                    <Badge
                      variant={statusCfg.variant}
                      className={cn(
                        job.status === "running" && "animate-pulse",
                      )}
                    >
                      {statusCfg.label}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
