"use client";

import { useState } from "react";
import { toast } from "sonner";
import { X, Trash2, Pencil, ChevronDown, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { LeadStatus } from "@/types/leads";

const STATUS_OPTIONS: { value: LeadStatus; label: string; dot: string }[] = [
  { value: "new",       label: "Neu",          dot: "bg-blue-500" },
  { value: "enriched",  label: "Angereichert", dot: "bg-violet-500" },
  { value: "contacted", label: "Kontaktiert",  dot: "bg-amber-500" },
  { value: "qualified", label: "Qualifiziert", dot: "bg-emerald-500" },
  { value: "converted", label: "Konvertiert",  dot: "bg-green-600" },
  { value: "closed",    label: "Geschlossen",  dot: "bg-slate-400" },
];

interface LeadSelectionBarProps {
  selectedCount: number;
  onClear: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: LeadStatus) => Promise<void>;
}

export function LeadSelectionBar({
  selectedCount,
  onClear,
  onEdit,
  onDelete,
  onStatusChange,
}: LeadSelectionBarProps) {
  const [changingStatus, setChangingStatus] = useState(false);

  if (selectedCount === 0) return null;

  async function handleStatusChange(status: LeadStatus) {
    setChangingStatus(true);
    try {
      await onStatusChange(status);
    } catch {
      toast.error("Status konnte nicht geändert werden");
    } finally {
      setChangingStatus(false);
    }
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-3 fade-in duration-150">
      <div className="flex items-center gap-0.5 border border-white/10 bg-foreground/95 backdrop-blur-xl shadow-xl px-2 py-1.5 rounded-xl">
        {/* Count */}
        <div className="flex items-center gap-1.5 px-2 mr-0.5">
          <CheckSquare className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold text-white whitespace-nowrap">
            {selectedCount} ausgewählt
          </span>
        </div>

        <Separator orientation="vertical" className="h-4 bg-white/10" />

        {/* Status ändern */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              disabled={changingStatus}
              className="h-7 px-2.5 text-xs text-white/80 hover:text-white hover:bg-white/10 gap-1"
            >
              Status
              <ChevronDown className="h-3 w-3 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" side="top" className="w-44 mb-1">
            <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
              Status setzen auf…
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {STATUS_OPTIONS.map((opt) => (
              <DropdownMenuItem
                key={opt.value}
                onClick={() => handleStatusChange(opt.value)}
                className="text-xs gap-2 cursor-pointer"
              >
                <span className={`h-2 w-2 rounded-full shrink-0 ${opt.dot}`} />
                {opt.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Bearbeiten — nur bei 1 Lead */}
        {selectedCount === 1 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2.5 text-xs text-white/80 hover:text-white hover:bg-white/10 gap-1"
            onClick={onEdit}
          >
            <Pencil className="h-3 w-3" />
            Bearbeiten
          </Button>
        )}

        <Separator orientation="vertical" className="h-4 bg-white/10" />

        {/* Löschen */}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-1"
          onClick={onDelete}
        >
          <Trash2 className="h-3 w-3" />
          Löschen
        </Button>

        {/* Schließen */}
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-white/30 hover:text-white hover:bg-white/10 ml-0.5"
          onClick={onClear}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
