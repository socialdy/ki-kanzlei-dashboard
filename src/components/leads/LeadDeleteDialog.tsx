"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface LeadDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** IDs der zu löschenden Leads */
  leadIds: string[];
  onDeleted: () => void;
}

export function LeadDeleteDialog({
  open,
  onOpenChange,
  leadIds,
  onDeleted,
}: LeadDeleteDialogProps) {
  const [deleting, setDeleting] = useState(false);
  const count = leadIds.length;

  async function handleDelete() {
    setDeleting(true);
    try {
      if (count === 1) {
        const res = await fetch(`/api/leads/${leadIds[0]}`, { method: "DELETE" });
        if (!res.ok) throw new Error();
      } else {
        const res = await fetch("/api/leads/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "delete", ids: leadIds }),
        });
        if (!res.ok) throw new Error();
      }
      toast.success(
        count === 1
          ? "Lead gelöscht"
          : `${count} Leads gelöscht`,
      );
      onOpenChange(false);
      onDeleted();
    } catch {
      toast.error("Fehler beim Löschen");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            {count === 1 ? "Lead löschen" : `${count} Leads löschen`}
          </DialogTitle>
          <DialogDescription>
            {count === 1
              ? "Möchtest du diesen Lead wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden."
              : `Möchtest du ${count} Leads wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleting}
          >
            Abbrechen
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {count === 1 ? "Löschen" : `${count} löschen`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
