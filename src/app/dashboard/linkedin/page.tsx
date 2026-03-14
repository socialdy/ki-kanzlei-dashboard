"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  MoreHorizontal,
  Trash2,
  Play,
  Pause,
  Eye,
  X,
  Linkedin,
  MessageSquare,
  UserPlus,
  Send,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";

/* ── Status Config ── */
type LinkedInCampaignStatus = "draft" | "active" | "paused" | "completed";

const STATUS_CONFIG: Record<LinkedInCampaignStatus, { label: string; className: string }> = {
  draft:     { label: "Entwurf",  className: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400" },
  active:    { label: "Aktiv",    className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" },
  paused:    { label: "Pausiert", className: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400" },
  completed: { label: "Fertig",   className: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400" },
};

/* ── Types (placeholder until backend is ready) ── */
interface LinkedInCampaign {
  id: string;
  name: string;
  status: LinkedInCampaignStatus;
  total_count: number;
  connected_count: number;
  messaged_count: number;
  replied_count: number;
  created_at: string;
}

function pct(count: number, total: number): string {
  if (total === 0) return "—";
  return `${((count / total) * 100).toFixed(1)}%`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("de-AT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function LinkedInPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<LinkedInCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Placeholder: simulate loading (no backend yet)
  useEffect(() => {
    const timer = setTimeout(() => {
      setCampaigns([]);
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const hasFilters = searchFilter || statusFilter !== "all";

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
      {/* ── Page Header ── */}
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold tracking-tight">
            LinkedIn Outreach
          </h1>
          <p className="text-sm text-muted-foreground">
            Automatisiere dein LinkedIn-Outreach mit Verbindungsanfragen und Nachrichten.
          </p>
        </div>
        <Button className="h-10 px-5" disabled>
          <Plus className="h-4 w-4 mr-2" />
          Neue Kampagne
        </Button>
      </div>

      {/* ── Connection Status ── */}
      <Card className="border-dashed border-[#0A66C2]/30 bg-[#0A66C2]/5">
        <CardContent className="flex items-center justify-between py-4 px-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-[#0A66C2]/10 flex items-center justify-center">
              <Linkedin className="h-5 w-5 text-[#0A66C2]" />
            </div>
            <div>
              <p className="text-sm font-medium">LinkedIn-Konto verbinden</p>
              <p className="text-xs text-muted-foreground">
                Verbinde dein LinkedIn-Konto über Unipile, um automatisierte Outreach-Kampagnen zu starten.
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" disabled>
            Verbinden
          </Button>
        </CardContent>
      </Card>

      {/* ── Filters ── */}
      <Card>
        <CardContent className="flex items-center gap-3 py-3 px-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Kampagne suchen..."
              className="pl-9 h-9"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Status</SelectItem>
              <SelectItem value="draft">Entwurf</SelectItem>
              <SelectItem value="active">Aktiv</SelectItem>
              <SelectItem value="paused">Pausiert</SelectItem>
              <SelectItem value="completed">Fertig</SelectItem>
            </SelectContent>
          </Select>

          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 px-3 text-muted-foreground"
              onClick={() => { setSearchFilter(""); setStatusFilter("all"); }}
            >
              <X className="h-4 w-4 mr-1.5" />
              Zurücksetzen
            </Button>
          )}
        </CardContent>
      </Card>

      {/* ── Campaign List ── */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-20">
            <Empty className="border-0">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Linkedin />
                </EmptyMedia>
                <EmptyTitle className="text-base">
                  {hasFilters
                    ? "Keine Kampagnen gefunden"
                    : "Noch keine LinkedIn-Kampagnen erstellt"}
                </EmptyTitle>
                <EmptyDescription className="max-w-sm mx-auto">
                  {hasFilters
                    ? "Passe die Filter an oder setze sie zurück."
                    : "Verbinde dein LinkedIn-Konto und erstelle deine erste Outreach-Kampagne."}
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                {hasFilters ? (
                  <Button variant="outline" onClick={() => { setSearchFilter(""); setStatusFilter("all"); }}>
                    Filter zurücksetzen
                  </Button>
                ) : (
                  <Button disabled>
                    <Plus className="h-4 w-4 mr-2" />
                    Erste Kampagne erstellen
                  </Button>
                )}
              </EmptyContent>
            </Empty>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-28 pl-5">Status</TableHead>
                <TableHead>Kampagne</TableHead>
                <TableHead className="text-center w-28">
                  <span className="flex items-center justify-center gap-1.5">
                    <UserPlus className="h-3.5 w-3.5" />
                    Vernetzt
                  </span>
                </TableHead>
                <TableHead className="text-center w-28">
                  <span className="flex items-center justify-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5" />
                    Nachricht
                  </span>
                </TableHead>
                <TableHead className="text-center w-24">
                  <span className="flex items-center justify-center gap-1.5">
                    <Send className="h-3.5 w-3.5" />
                    Antwort
                  </span>
                </TableHead>
                <TableHead className="w-28">Erstellt</TableHead>
                <TableHead className="w-14 pr-5" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((c) => {
                const cfg = STATUS_CONFIG[c.status];
                return (
                  <TableRow
                    key={c.id}
                    className="cursor-pointer h-14 hover:bg-muted/40 transition-colors"
                  >
                    <TableCell className="pl-5">
                      <Badge
                        variant="secondary"
                        className={`text-[11px] font-medium px-2.5 py-0.5 ${cfg.className}`}
                      >
                        {cfg.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p className="font-semibold text-sm">{c.name}</p>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-sm tabular-nums text-muted-foreground">
                        {c.connected_count}
                        <span className="text-muted-foreground/50">/{c.total_count}</span>
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-sm font-medium tabular-nums">
                        {pct(c.messaged_count, c.connected_count)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-sm font-medium tabular-nums text-emerald-600">
                        {pct(c.replied_count, c.messaged_count)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(c.created_at)}
                      </span>
                    </TableCell>
                    <TableCell className="pr-5">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            Details anzeigen
                          </DropdownMenuItem>
                          {(c.status === "draft" || c.status === "paused") && (
                            <DropdownMenuItem>
                              <Play className="h-4 w-4 mr-2" />
                              Kampagne starten
                            </DropdownMenuItem>
                          )}
                          {c.status === "active" && (
                            <DropdownMenuItem>
                              <Pause className="h-4 w-4 mr-2" />
                              Pausieren
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem variant="destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Löschen
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
