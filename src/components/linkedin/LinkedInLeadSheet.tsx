"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Loader2, ExternalLink, Sparkles,
  ListPlus, Linkedin,
} from "lucide-react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LinkedInStatusBadge } from "./LinkedInStatusBadge";
import type { LinkedInLead, LinkedInLeadStatus } from "@/types/linkedin";

interface LinkedInLeadSheetProps {
  lead: LinkedInLead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: (updatedLead?: LinkedInLead) => void;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("de-AT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function LinkedInLeadSheet({ lead, open, onOpenChange, onUpdated }: LinkedInLeadSheetProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    setNotes(lead?.notes ?? "");
  }, [lead?.id, lead?.notes]);

  if (!lead) return null;

  async function handleAnalyze() {
    setAnalyzing(true);
    try {
      const res = await fetch("/api/linkedin/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: lead!.id }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Analyse fehlgeschlagen");
        return;
      }
      toast.success("Profil analysiert");
      onUpdated(json.data ?? undefined);
    } catch {
      toast.error("Netzwerkfehler");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleStatusChange(status: LinkedInLeadStatus) {
    try {
      const res = await fetch(`/api/linkedin/leads/${lead!.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      const json = await res.json();
      toast.success("Status geändert");
      onUpdated(json.data ?? undefined);
    } catch {
      toast.error("Fehler beim Ändern des Status");
    }
  }

  async function handleSaveNotes() {
    setSavingNotes(true);
    try {
      const res = await fetch(`/api/linkedin/leads/${lead!.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      if (!res.ok) throw new Error();
      const json = await res.json();
      toast.success("Notizen gespeichert");
      onUpdated(json.data ?? undefined);
    } catch {
      toast.error("Fehler beim Speichern");
    } finally {
      setSavingNotes(false);
    }
  }

  const hasTimelineEntries = lead.connection_sent_at || lead.connection_accepted_at
    || lead.follow_up_sent_at || lead.last_message_at;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[480px] sm:w-[520px] flex flex-col p-0 gap-0">

        {/* ── Header ── */}
        <SheetHeader className="px-6 pt-5 pb-4 border-b shrink-0">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <Linkedin className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-base truncate leading-tight">
                {lead.full_name}
              </SheetTitle>
              <SheetDescription className="text-xs mt-0.5 line-clamp-1">
                {lead.headline || "LinkedIn Lead"}
              </SheetDescription>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {analyzing ? (
                <Skeleton className="h-5 w-20 rounded-full" />
              ) : (
                <>
                  <LinkedInStatusBadge status={lead.status} />
                  {lead.ai_score != null && (
                    <Badge
                      variant="secondary"
                      className={`text-xs font-medium ${
                        lead.ai_score >= 70
                          ? "bg-emerald-100 text-emerald-700"
                          : lead.ai_score >= 40
                          ? "bg-amber-100 text-amber-700"
                          : ""
                      }`}
                    >
                      {lead.ai_score}
                    </Badge>
                  )}
                </>
              )}
            </div>
          </div>
        </SheetHeader>

        {/* ── Content ── */}
        <ScrollArea className="flex-1">
          <div className="px-6 py-5 space-y-5">

            {/* Profil */}
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground">Profil</p>
              {analyzing ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-3.5 w-12 rounded" />
                    <Skeleton className="h-3.5 w-32 rounded" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-3.5 w-14 rounded" />
                    <Skeleton className="h-3.5 w-28 rounded" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-3.5 w-16 rounded" />
                    <Skeleton className="h-3.5 w-24 rounded" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-3.5 w-14 rounded" />
                    <Skeleton className="h-3.5 w-20 rounded" />
                  </div>
                </div>
              ) : (
              <div className="space-y-2">
                {lead.company && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Firma</span>
                    <span className="font-medium text-right">{lead.company}</span>
                  </div>
                )}
                {lead.position && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Position</span>
                    <span className="font-medium text-right">{lead.position}</span>
                  </div>
                )}
                {lead.industry && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Branche</span>
                    <span className="font-medium text-right">{lead.industry}</span>
                  </div>
                )}
                {lead.location && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Standort</span>
                    <span className="font-medium text-right">{lead.location}</span>
                  </div>
                )}
                {!lead.company && !lead.position && !lead.industry && !lead.location && (
                  <p className="text-xs text-muted-foreground/60 italic">
                    Keine Profildetails vorhanden
                  </p>
                )}
              </div>
              )}
              <a
                href={lead.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline inline-flex items-center gap-1.5"
              >
                Profil auf LinkedIn
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            <Separator />

            {/* Headline */}
            {lead.headline && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">Headline</p>
                <p className="text-sm">{lead.headline}</p>
              </div>
            )}

            {/* Error */}
            {lead.error_message && (
              <div className="bg-red-50 border border-red-100 text-red-700 text-sm p-3 rounded-lg">
                <p className="font-medium text-xs mb-1">Fehler</p>
                {lead.error_message}
              </div>
            )}

            {/* Timeline */}
            {hasTimelineEntries && (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Timeline</p>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Erstellt</span>
                      <span className="text-foreground">{formatDate(lead.created_at)}</span>
                    </div>
                    {lead.connection_sent_at && (
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Einladung</span>
                        <span className="text-foreground">{formatDate(lead.connection_sent_at)}</span>
                      </div>
                    )}
                    {lead.connection_accepted_at && (
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Angenommen</span>
                        <span className="text-foreground">{formatDate(lead.connection_accepted_at)}</span>
                      </div>
                    )}
                    {lead.follow_up_sent_at && (
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Follow-Up</span>
                        <span className="text-foreground">{formatDate(lead.follow_up_sent_at)}</span>
                      </div>
                    )}
                    {lead.last_message_at && (
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Letzte Nachricht</span>
                        <span className="text-foreground">{formatDate(lead.last_message_at)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            <Separator />

            {/* Notizen */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Notizen</p>
              <Textarea
                placeholder="Eigene Notizen zu diesem Lead..."
                className="min-h-[72px] text-sm resize-none"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={handleSaveNotes}
                  disabled={savingNotes || notes === (lead.notes ?? "")}
                >
                  {savingNotes ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : null}
                  Speichern
                </Button>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* ── Footer Actions ── */}
        <div className="px-6 py-3 border-t bg-muted/30 shrink-0 space-y-2">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1.5 flex-1"
              onClick={handleAnalyze}
              disabled={analyzing}
            >
              {analyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              {lead.ai_score != null ? "Erneut analysieren" : "Profil analysieren"}
            </Button>
            {(lead.status === "new" || lead.status === "analyzed") && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs gap-1.5 flex-1"
                onClick={() => handleStatusChange("queued")}
              >
                <ListPlus className="h-3.5 w-3.5" />
                In Warteschlange
              </Button>
            )}
            {lead.status === "error" && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs gap-1.5 flex-1"
                onClick={() => handleStatusChange("queued")}
              >
                Erneut versuchen
              </Button>
            )}
          </div>
          <Button
            variant="default"
            size="sm"
            className="text-xs gap-1.5 w-full"
            onClick={() => handleStatusChange("queued")}
          >
            <Linkedin className="h-3.5 w-3.5" />
            Vernetzungsanfrage schicken
          </Button>
        </div>

      </SheetContent>
    </Sheet>
  );
}
