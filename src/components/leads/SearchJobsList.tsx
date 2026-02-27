"use client";

import {
  Search,
  Clock,
  Users,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
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
}

export function SearchJobsList({ jobs, loading }: SearchJobsListProps) {
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
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center mb-4">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-semibold mb-1">Keine Suchaufträge</h3>
            <p className="text-sm text-muted-foreground text-center max-w-xs">
              Starte eine neue Suche oben, um Leads zu finden.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {jobs.map((job) => {
              const statusCfg = JOB_STATUS_CONFIG[job.status];
              const isActive =
                job.status === "pending" || job.status === "running";
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
                      <Loader2 className="h-5 w-5 text-primary animate-spin" />
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

                  <Badge
                    variant={statusCfg.variant}
                    className={cn(
                      "shrink-0",
                      job.status === "running" && "animate-pulse",
                    )}
                  >
                    {statusCfg.label}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
