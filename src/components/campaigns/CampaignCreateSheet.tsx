"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { LeadPickerDialog } from "./LeadPickerDialog";

interface CampaignCreateSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function CampaignCreateSheet({
  open,
  onOpenChange,
  onCreated,
}: CampaignCreateSheetProps) {
  const [name, setName] = useState("");
  const [dailyLimit, setDailyLimit] = useState(200);
  const [delayMinutes, setDelayMinutes] = useState(8);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pickerOpen, setPickerOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Reset when sheet closes
  useEffect(() => {
    if (!open) {
      setName("");
      setDailyLimit(200);
      setDelayMinutes(8);
      setSelectedIds(new Set());
    }
  }, [open]);

  async function handleCreate() {
    if (!name.trim()) {
      toast.error("Bitte einen Namen eingeben");
      return;
    }
    if (selectedIds.size === 0) {
      toast.error("Bitte mindestens einen Lead auswählen");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          daily_limit: dailyLimit,
          delay_minutes: delayMinutes,
          reply_to: "info@ki-kanzlei.at",
          lead_ids: Array.from(selectedIds),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Fehler beim Erstellen");
      }

      toast.success("Kampagne erstellt");
      onOpenChange(false);
      onCreated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ein Fehler ist aufgetreten");
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="sm:max-w-md w-full flex flex-col">
          <SheetHeader>
            <SheetTitle>Neue Kampagne</SheetTitle>
            <SheetDescription>
              Kampagne konfigurieren und Leads zuweisen
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 px-4 space-y-5">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="campaign-name">Name</Label>
              <Input
                id="campaign-name"
                placeholder="z.B. Psychotherapeuten Wien"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="daily-limit">Tageslimit</Label>
                <Input
                  id="daily-limit"
                  type="number"
                  min={1}
                  max={500}
                  value={dailyLimit}
                  onChange={(e) => setDailyLimit(parseInt(e.target.value) || 200)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="delay-minutes">Verzögerung (Min.)</Label>
                <Input
                  id="delay-minutes"
                  type="number"
                  min={1}
                  max={60}
                  value={delayMinutes}
                  onChange={(e) => setDelayMinutes(parseInt(e.target.value) || 8)}
                />
              </div>
            </div>

            <Separator />

            {/* Lead Selection */}
            <div className="space-y-3">
              <Label>Leads</Label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setPickerOpen(true)}
                >
                  Leads auswählen
                </Button>
                {selectedIds.size > 0 && (
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {selectedIds.size} ausgewählt
                  </Badge>
                )}
              </div>
              {selectedIds.size === 0 && (
                <p className="text-xs text-muted-foreground">
                  Noch keine Leads ausgewählt
                </p>
              )}
            </div>
          </div>

          <Separator />

          <SheetFooter className="flex-row gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Abbrechen
            </Button>
            <Button
              className="flex-1"
              disabled={!name.trim() || selectedIds.size === 0 || creating}
              onClick={handleCreate}
            >
              {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Erstellen ({selectedIds.size} Leads)
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Lead Picker Dialog — renders above sheet */}
      <LeadPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        selectedIds={selectedIds}
        onConfirm={(ids) => {
          setSelectedIds(ids);
          setPickerOpen(false);
        }}
      />
    </>
  );
}
