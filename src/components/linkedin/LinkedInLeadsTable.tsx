"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  flexRender,
  useReactTable,
  getCoreRowModel,
  type SortingState,
  type VisibilityState,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  MoreHorizontal, Trash2, Sparkles,
  Eye, Loader2, Linkedin, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
  DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Spinner } from "@/components/ui/spinner";
import { DataTableColumnHeader } from "@/components/leads/DataTableColumnHeader";
import { LinkedInStatusBadge } from "./LinkedInStatusBadge";
import { LinkedInLeadSheet } from "./LinkedInLeadSheet";
import { LinkedInSelectionBar } from "./LinkedInSelectionBar";
import type { LinkedInLead, LinkedInLeadStatus } from "@/types/linkedin";
import { LINKEDIN_STATUS_CONFIG, LINKEDIN_STATUS_OPTIONS } from "@/types/linkedin";

/* ── Props ── */

interface LinkedInLeadsTableProps {
  leads: LinkedInLead[];
  totalCount?: number;
  loading?: boolean;
  onRefresh: () => void;
  sorting: SortingState;
  onSortingChange: (sorting: SortingState) => void;
  columnVisibility: VisibilityState;
  onColumnVisibilityChange: (visibility: VisibilityState) => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("de-AT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/* ── Column labels for DataTableViewOptions ── */
export const LINKEDIN_COLUMN_LABELS: Record<string, string> = {
  status:   "Status",
  name:     "Name",
  company:  "Firma",
  position: "Position",
  industry: "Branche",
  location: "Standort",
  ai_score: "Score",
  created_at: "Erstellt",
};

/* ── Column definitions ── */

function createLinkedInColumns(
  onSheetOpen: (lead: LinkedInLead) => void,
  onAnalyze: (id: string) => void,
  onStatusChange: (ids: string[], status: LinkedInLeadStatus) => void,
  onDelete: (ids: string[]) => void,
  analyzingId: string | null,
): ColumnDef<LinkedInLead>[] {
  return [
    /* Select */
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected()
              ? true
              : table.getIsSomePageRowsSelected()
                ? "indeterminate"
                : false
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Alle auswählen"
        />
      ),
      cell: ({ row }) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Checkbox
            className="cursor-pointer"
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    },

    /* Status */
    {
      accessorKey: "status",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => <LinkedInStatusBadge status={row.original.status} />,
      size: 130,
    },

    /* Name */
    {
      id: "name",
      accessorKey: "full_name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
      cell: ({ row }) => {
        const lead = row.original;
        const initials = (lead.first_name?.[0] || "") + (lead.last_name?.[0] || "");
        return (
          <div className="flex items-center gap-2.5">
            <Avatar className="h-8 w-8 shadow-sm shrink-0">
              {lead.profile_picture_url && (
                <AvatarImage src={lead.profile_picture_url} alt={lead.full_name} />
              )}
              <AvatarFallback className="text-[10px] font-semibold bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
                {initials || "?"}
              </AvatarFallback>
            </Avatar>
            <p className="text-sm font-medium truncate min-w-0">{lead.full_name}</p>
          </div>
        );
      },
      enableHiding: false,
      size: 180,
    },

    /* Firma */
    {
      accessorKey: "company",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Firma" />,
      cell: ({ getValue }) => {
        const v = getValue() as string | null;
        return v
          ? <p className="text-sm truncate max-w-[180px]">{v}</p>
          : <span className="text-xs text-muted-foreground/40">—</span>;
      },
      size: 180,
    },

    /* Position */
    {
      accessorKey: "position",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Position" />,
      cell: ({ getValue }) => {
        const v = getValue() as string | null;
        return v
          ? <p className="text-sm truncate max-w-[160px]">{v}</p>
          : <span className="text-xs text-muted-foreground/40">—</span>;
      },
      size: 160,
    },

    /* Branche */
    {
      accessorKey: "industry",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Branche" />,
      cell: ({ getValue }) => {
        const v = getValue() as string | null;
        return v
          ? <p className="text-sm truncate max-w-[130px]">{v}</p>
          : <span className="text-xs text-muted-foreground/40">—</span>;
      },
      size: 130,
    },

    /* Standort */
    {
      accessorKey: "location",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Standort" />,
      cell: ({ getValue }) => {
        const v = getValue() as string | null;
        return v
          ? <p className="text-sm truncate max-w-[130px]">{v}</p>
          : <span className="text-xs text-muted-foreground/40">—</span>;
      },
      size: 130,
    },

    /* Score */
    {
      accessorKey: "ai_score",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Score" />,
      cell: ({ row }) => {
        const lead = row.original;
        const isAnalyzing = analyzingId === lead.id;
        if (isAnalyzing) {
          return <Loader2 className="h-4 w-4 animate-spin mx-auto text-primary" />;
        }
        if (lead.ai_score != null) {
          return (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              lead.ai_score >= 70
                ? "bg-primary/10 text-primary"
                : lead.ai_score >= 40
                ? "bg-primary/5 text-primary/70"
                : "bg-muted text-muted-foreground"
            }`}>
              {lead.ai_score}
            </span>
          );
        }
        return <span className="text-xs text-muted-foreground/40">—</span>;
      },
      size: 80,
    },

    /* Erstellt */
    {
      accessorKey: "created_at",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Erstellt" />,
      cell: ({ getValue }) => (
        <span className="text-xs text-muted-foreground">
          {formatDate(getValue() as string)}
        </span>
      ),
      size: 110,
    },

    /* Actions */
    {
      id: "actions",
      cell: ({ row }) => {
        const lead = row.original;
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity data-[state=open]:opacity-100"
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onSheetOpen(lead)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAnalyze(lead.id)}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  KI-Analyse
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="text-xs gap-2 cursor-pointer">
                    <span className={`h-2 w-2 rounded-full shrink-0 ${LINKEDIN_STATUS_CONFIG[lead.status].dot}`} />
                    Status ändern
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-44">
                    {LINKEDIN_STATUS_OPTIONS.map((opt) => (
                      <DropdownMenuItem
                        key={opt.value}
                        className="text-xs gap-2 cursor-pointer"
                        disabled={opt.value === lead.status}
                        onClick={() => onStatusChange([lead.id], opt.value)}
                      >
                        <span className={`h-2 w-2 rounded-full shrink-0 ${opt.dot}`} />
                        {opt.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => onDelete([lead.id])}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Löschen
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
      size: 48,
    },
  ];
}

/* ── Main Component ── */

export function LinkedInLeadsTable({
  leads, totalCount, loading, onRefresh,
  sorting, onSortingChange,
  columnVisibility, onColumnVisibilityChange,
}: LinkedInLeadsTableProps) {
  const [sheetLead, setSheetLead] = useState<LinkedInLead | null>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [isGlobalSelected, setIsGlobalSelected] = useState(false);
  const [deleteIds, setDeleteIds] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);

  /* ── Handlers ── */

  async function fetchAllLeadIds(): Promise<string[]> {
    try {
      const res = await fetch("/api/linkedin/leads?pageSize=9999");
      if (!res.ok) return [];
      const json = await res.json();
      return (json.data?.data ?? []).map((l: { id: string }) => l.id);
    } catch {
      return [];
    }
  }

  async function handleStatusChange(ids: string[], status: LinkedInLeadStatus) {
    try {
      const effectiveIds = isGlobalSelected ? await fetchAllLeadIds() : ids;
      const res = await fetch("/api/linkedin/leads/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "status", ids: effectiveIds, status }),
      });
      if (!res.ok) throw new Error();
      toast.success(`${effectiveIds.length} Lead(s) Status geändert`);
    } catch {
      toast.error("Fehler beim Ändern des Status");
    }
    table.resetRowSelection();
    setIsGlobalSelected(false);
    onRefresh();
  }

  function handleDelete(ids: string[]) {
    setDeleteIds(ids);
  }

  async function confirmDelete() {
    setDeleting(true);
    try {
      const effectiveIds = isGlobalSelected ? await fetchAllLeadIds() : deleteIds;
      const res = await fetch("/api/linkedin/leads/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", ids: effectiveIds }),
      });
      if (!res.ok) throw new Error();
      toast.success(`${effectiveIds.length} Lead(s) gelöscht`);
      setDeleteIds([]);
      table.resetRowSelection();
      setIsGlobalSelected(false);
      onRefresh();
    } catch {
      toast.error("Fehler beim Löschen");
    } finally {
      setDeleting(false);
    }
  }

  async function handleAnalyze(id: string) {
    setAnalyzingId(id);
    try {
      const res = await fetch("/api/linkedin/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: id }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Analyse fehlgeschlagen");
        return;
      }
      toast.success("Profil analysiert");
      if (json.data && sheetLead?.id === id) {
        setSheetLead(json.data);
      }
      onRefresh();
    } catch {
      toast.error("Fehler bei der Analyse");
    } finally {
      setAnalyzingId(null);
    }
  }

  async function handleBulkAnalyze() {
    const selectedIds = Object.keys(table.getState().rowSelection);
    const effectiveIds = isGlobalSelected ? await fetchAllLeadIds() : selectedIds;
    const toastId = toast.loading(`0/${effectiveIds.length} Profile analysiert…`, { duration: Infinity });
    let done = 0;

    for (const id of effectiveIds) {
      try {
        await fetch("/api/linkedin/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leadId: id }),
        });
        done++;
        toast.loading(`${done}/${effectiveIds.length} Profile analysiert…`, { id: toastId });
      } catch {
        // continue
      }
    }

    toast.success(`${done} Profile analysiert`, { id: toastId });
    table.resetRowSelection();
    setIsGlobalSelected(false);
    onRefresh();
  }

  /* ── Columns ── */

  const columns = createLinkedInColumns(
    setSheetLead,
    handleAnalyze,
    handleStatusChange,
    handleDelete,
    analyzingId,
  );

  /* ── Table instance ── */

  const table = useReactTable({
    data: leads,
    columns,
    state: {
      sorting,
      columnVisibility,
    },
    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater;
      onSortingChange(next);
    },
    onColumnVisibilityChange: (updater) => {
      const next = typeof updater === "function" ? updater(columnVisibility) : updater;
      onColumnVisibilityChange(next);
    },
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    manualPagination: true,
    getRowId: (row) => row.id,
  });

  /* ── ESC to clear selection ── */
  const clearSelection = useCallback(() => {
    table.resetRowSelection();
    setIsGlobalSelected(false);
  }, [table]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && Object.keys(table.getState().rowSelection).length > 0) {
        clearSelection();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [table, clearSelection]);

  /* ── Skeleton loading ── */

  if (loading) {
    return (
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-10 pl-4"><Skeleton className="h-4 w-4 rounded" /></TableHead>
            <TableHead className="w-28"><Skeleton className="h-4 w-16 rounded" /></TableHead>
            <TableHead><Skeleton className="h-4 w-20 rounded" /></TableHead>
            <TableHead><Skeleton className="h-4 w-24 rounded" /></TableHead>
            <TableHead><Skeleton className="h-4 w-20 rounded" /></TableHead>
            <TableHead><Skeleton className="h-4 w-20 rounded" /></TableHead>
            <TableHead><Skeleton className="h-4 w-16 rounded" /></TableHead>
            <TableHead className="w-20 text-center"><Skeleton className="h-4 w-10 rounded mx-auto" /></TableHead>
            <TableHead className="w-28"><Skeleton className="h-4 w-16 rounded" /></TableHead>
            <TableHead className="w-12 pr-4" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 8 }).map((_, i) => (
            <TableRow key={i} className="h-14">
              <TableCell className="pl-4"><Skeleton className="h-4 w-4 rounded" /></TableCell>
              <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
              <TableCell>
                <div className="flex items-center gap-2.5">
                  <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                  <Skeleton className="h-3.5 w-28 rounded" />
                </div>
              </TableCell>
              <TableCell><Skeleton className="h-3.5 w-28 rounded" /></TableCell>
              <TableCell><Skeleton className="h-3.5 w-24 rounded" /></TableCell>
              <TableCell><Skeleton className="h-3.5 w-20 rounded" /></TableCell>
              <TableCell><Skeleton className="h-3.5 w-16 rounded" /></TableCell>
              <TableCell className="text-center"><Skeleton className="h-5 w-8 rounded-full mx-auto" /></TableCell>
              <TableCell><Skeleton className="h-3 w-16 rounded" /></TableCell>
              <TableCell className="pr-4"><Skeleton className="h-8 w-8 rounded" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="py-20 text-center">
        <Linkedin className="h-10 w-10 mx-auto text-muted-foreground/20 mb-3" />
        <p className="text-sm font-medium text-muted-foreground">
          Keine Leads gefunden
        </p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          Passe die Filter an oder starte eine neue Suche.
        </p>
      </div>
    );
  }

  const selectedIds = Object.keys(table.getState().rowSelection);
  const displayCount = isGlobalSelected ? (totalCount ?? selectedIds.length) : selectedIds.length;

  return (
    <>
      {/* Table */}
      <div className="overflow-x-auto">
        <Table className="table-fixed">
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
            {table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className={cn(
                  "h-14 cursor-pointer transition-colors group",
                  row.getIsSelected()
                    ? "bg-primary/5 hover:bg-primary/8"
                    : "hover:bg-muted/40",
                )}
                onClick={() => setSheetLead(row.original)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className="py-2 px-3"
                    style={{ width: cell.column.getSize() }}
                    onClick={cell.column.id === "select" ? (e) => e.stopPropagation() : undefined}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Selection Bar */}
      <LinkedInSelectionBar
        selectedCount={displayCount}
        totalCount={totalCount}
        selectedIds={selectedIds}
        onClear={() => { table.resetRowSelection(); setIsGlobalSelected(false); }}
        onDelete={() => handleDelete(selectedIds)}
        onStatusChange={(status) => handleStatusChange(selectedIds, status)}
        onAnalyze={handleBulkAnalyze}
        onSelectAll={totalCount && totalCount > selectedIds.length && !isGlobalSelected
          ? () => { setIsGlobalSelected(true); table.toggleAllPageRowsSelected(true); }
          : undefined
        }
      />

      {/* Lead Detail Sheet */}
      <LinkedInLeadSheet
        lead={sheetLead}
        open={!!sheetLead}
        onOpenChange={(open) => { if (!open) setSheetLead(null); }}
        onUpdated={async (updatedLead?: LinkedInLead) => {
          if (updatedLead) {
            setSheetLead(updatedLead);
          } else if (sheetLead) {
            try {
              const res = await fetch(`/api/linkedin/leads/${sheetLead.id}`);
              if (res.ok) {
                const json = await res.json();
                if (json.data) setSheetLead(json.data);
              }
            } catch { /* keep current */ }
          }
          onRefresh();
        }}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteIds.length > 0} onOpenChange={(open) => { if (!open) setDeleteIds([]); }}>
        <AlertDialogContent className="sm:max-w-[420px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {deleteIds.length === 1 ? "Lead löschen" : `${isGlobalSelected ? totalCount : deleteIds.length} Leads löschen`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteIds.length === 1
                ? "Möchtest du diesen Lead wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden."
                : `Möchtest du ${isGlobalSelected ? totalCount : deleteIds.length} Leads wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={(e) => { e.preventDefault(); confirmDelete(); }}
              disabled={deleting}
            >
              {deleting && <Spinner className="h-4 w-4 mr-2" />}
              {deleteIds.length === 1 ? "Löschen" : `${isGlobalSelected ? totalCount : deleteIds.length} löschen`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
