"use client";

import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuCheckboxItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const COLUMN_LABELS: Record<string, string> = {
  status: "Status",
  category: "Kategorie",
  word_count: "Wörter",
  keywords: "Keywords",
  date: "Datum",
};

const TOGGLEABLE_COLUMNS = Object.keys(COLUMN_LABELS);

interface SeoViewOptionsProps {
  visibleColumns: Set<string>;
  onToggle: (column: string) => void;
}

export function SeoViewOptions({ visibleColumns, onToggle }: SeoViewOptionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Spalten
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel className="text-xs">Spalten ein-/ausblenden</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {TOGGLEABLE_COLUMNS.map((col) => (
          <DropdownMenuCheckboxItem
            key={col}
            checked={visibleColumns.has(col)}
            onCheckedChange={() => onToggle(col)}
            className="text-xs"
          >
            {COLUMN_LABELS[col]}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
