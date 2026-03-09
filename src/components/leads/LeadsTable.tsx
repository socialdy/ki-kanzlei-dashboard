"use client";

import {
  flexRender,
  useReactTable,
  getCoreRowModel,
  type SortingState,
  type VisibilityState,
  type ColumnDef,
} from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Kbd } from "@/components/ui/kbd";
import { Pencil, Trash2 } from "lucide-react";
import type { Lead, LeadStatus } from "@/types/leads";

import { LEAD_STATUS_CONFIG } from "./columns";

// Re-export for backward compat
export { LEAD_STATUS_CONFIG } from "./columns";

const STATUS_LIST: { value: LeadStatus; label: string; dot: string }[] = [
  { value: "new",       label: "Neu",          dot: "bg-blue-500" },
  { value: "enriched",  label: "Angereichert", dot: "bg-violet-500" },
  { value: "contacted", label: "Kontaktiert",  dot: "bg-amber-500" },
  { value: "qualified", label: "Qualifiziert", dot: "bg-emerald-500" },
  { value: "converted", label: "Konvertiert",  dot: "bg-green-600" },
  { value: "closed",    label: "Geschlossen",  dot: "bg-slate-400" },
];

interface LeadsTableProps {
  leads: Lead[];
  columns: ColumnDef<Lead>[];
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  onEditLead: (lead: Lead) => void;
  onDeleteLead: (ids: string[]) => void;
  onStatusChange: (lead: Lead, status: LeadStatus) => Promise<void>;
  sorting: SortingState;
  onSortingChange: (sorting: SortingState) => void;
  columnVisibility: VisibilityState;
  onColumnVisibilityChange: (visibility: VisibilityState) => void;
}

export function LeadsTable({
  leads,
  columns,
  selectedIds,
  onSelectionChange,
  onEditLead,
  onDeleteLead,
  onStatusChange,
  sorting,
  onSortingChange,
  columnVisibility,
  onColumnVisibilityChange,
}: LeadsTableProps) {
  // Bridge Set<string> ↔ Record<string, boolean>
  const rowSelection: Record<string, boolean> = {};
  leads.forEach((lead, idx) => {
    if (selectedIds.has(lead.id)) rowSelection[idx] = true;
  });

  const table = useReactTable({
    data: leads,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
    },
    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater;
      onSortingChange(next);
    },
    onColumnVisibilityChange: (updater) => {
      const next = typeof updater === "function" ? updater(columnVisibility) : updater;
      onColumnVisibilityChange(next);
    },
    onRowSelectionChange: (updater) => {
      const current: Record<string, boolean> = {};
      leads.forEach((lead, idx) => {
        if (selectedIds.has(lead.id)) current[idx] = true;
      });
      const next = typeof updater === "function" ? updater(current) : updater;
      const ids = new Set<string>();
      for (const [idx, selected] of Object.entries(next)) {
        if (selected && leads[Number(idx)]) {
          ids.add(leads[Number(idx)].id);
        }
      }
      onSelectionChange(ids);
    },
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    manualPagination: true,
    getRowId: (row) => row.id,
  });

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-transparent border-b">
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className="px-3 text-xs font-medium"
                  style={{ width: header.getSize() }}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => {
            const lead = row.original;
            const cfg = LEAD_STATUS_CONFIG[lead.status];
            const cells = row.getVisibleCells();
            const checkboxCell = cells.find((c) => c.column.id === "select");
            const otherCells = cells.filter((c) => c.column.id !== "select");
            return (
              <ContextMenu key={row.id}>
                <TableRow
                  className={cn(
                    "h-12 cursor-pointer transition-colors group",
                    row.getIsSelected()
                      ? "bg-primary/5 hover:bg-primary/8"
                      : "hover:bg-muted/40",
                  )}
                >
                  {/* Checkbox-Zelle außerhalb des ContextMenuTriggers */}
                  {checkboxCell && (
                    <TableCell
                      key={checkboxCell.id}
                      className="py-2 px-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {flexRender(checkboxCell.column.columnDef.cell, checkboxCell.getContext())}
                    </TableCell>
                  )}
                  {/* Rest der Zellen im ContextMenuTrigger */}
                  <ContextMenuTrigger asChild>
                    <td
                      colSpan={otherCells.length}
                      className="p-0"
                      onClick={() => onEditLead(lead)}
                    >
                      <div className="flex items-center">
                        {otherCells.map((cell) => (
                          <div
                            key={cell.id}
                            className="py-2 px-3 shrink-0"
                            style={{ width: cell.column.getSize() }}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </div>
                        ))}
                      </div>
                    </td>
                  </ContextMenuTrigger>
                </TableRow>
                <ContextMenuContent className="w-48">
                  <ContextMenuLabel className="text-xs font-normal text-muted-foreground">
                    Aktionen
                  </ContextMenuLabel>
                  <ContextMenuSeparator />
                  <ContextMenuItem
                    className="text-xs gap-2 cursor-pointer"
                    onClick={() => onEditLead(lead)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Bearbeiten
                    <ContextMenuShortcut><Kbd>E</Kbd></ContextMenuShortcut>
                  </ContextMenuItem>
                  <ContextMenuSub>
                    <ContextMenuSubTrigger className="text-xs gap-2 cursor-pointer">
                      <span className={cn("h-2 w-2 rounded-full shrink-0", cfg.dot)} />
                      Status ändern
                    </ContextMenuSubTrigger>
                    <ContextMenuSubContent className="w-44">
                      {STATUS_LIST.map((opt) => (
                        <ContextMenuItem
                          key={opt.value}
                          className="text-xs gap-2 cursor-pointer"
                          disabled={opt.value === lead.status}
                          onClick={() => onStatusChange(lead, opt.value)}
                        >
                          <span className={cn("h-2 w-2 rounded-full shrink-0", opt.dot)} />
                          {opt.label}
                        </ContextMenuItem>
                      ))}
                    </ContextMenuSubContent>
                  </ContextMenuSub>
                  <ContextMenuSeparator />
                  <ContextMenuItem
                    variant="destructive"
                    className="text-xs gap-2 cursor-pointer"
                    onClick={() => onDeleteLead([lead.id])}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Löschen
                    <ContextMenuShortcut><Kbd>Del</Kbd></ContextMenuShortcut>
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
