"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[420px]">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            {count === 1 ? "Lead löschen" : `${count} Leads löschen`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {count === 1
              ? "Möchtest du diesen Lead wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden."
              : `Möchtest du ${count} Leads wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>
            Abbrechen
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting && <Spinner className="h-4 w-4 mr-2" />}
            {count === 1 ? "Löschen" : `${count} löschen`}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
