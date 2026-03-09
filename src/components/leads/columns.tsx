"use client";

import { ColumnDef } from "@tanstack/react-table";
import {
  Building2,
  MapPin,
  ExternalLink,
  Linkedin,
  Facebook,
  Instagram,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTableColumnHeader } from "./DataTableColumnHeader";
import type { Lead, LeadStatus } from "@/types/leads";
import { countryLabel } from "@/types/leads";

/* ── Status config ── */
export const LEAD_STATUS_CONFIG: Record<
  LeadStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; dot: string }
> = {
  new:       { label: "Neu",          variant: "secondary",  dot: "bg-blue-500" },
  enriched:  { label: "Angereichert", variant: "secondary",  dot: "bg-violet-500" },
  contacted: { label: "Kontaktiert",  variant: "outline",    dot: "bg-amber-500" },
  qualified: { label: "Qualifiziert", variant: "secondary",  dot: "bg-emerald-500" },
  converted: { label: "Konvertiert",  variant: "default",    dot: "bg-green-600" },
  closed:    { label: "Geschlossen",  variant: "outline",    dot: "bg-slate-400" },
};

const STATUS_LIST: { value: LeadStatus; label: string; dot: string }[] = [
  { value: "new",       label: "Neu",          dot: "bg-blue-500" },
  { value: "enriched",  label: "Angereichert", dot: "bg-violet-500" },
  { value: "contacted", label: "Kontaktiert",  dot: "bg-amber-500" },
  { value: "qualified", label: "Qualifiziert", dot: "bg-emerald-500" },
  { value: "converted", label: "Konvertiert",  dot: "bg-green-600" },
  { value: "closed",    label: "Geschlossen",  dot: "bg-slate-400" },
];

/* ── Social Icons sub-component ── */
function SocialIcons({ lead }: { lead: Lead }) {
  const socials = [
    { url: lead.social_linkedin,  label: "LinkedIn",  icon: Linkedin,  color: "text-[#0A66C2]" },
    { url: lead.social_facebook,  label: "Facebook",  icon: Facebook,  color: "text-[#1877F2]" },
    { url: lead.social_instagram, label: "Instagram", icon: Instagram, color: "text-[#E4405F]" },
    { url: lead.social_xing,      label: "Xing",      icon: undefined, color: "text-[#006567]" },
    { url: lead.social_twitter,   label: "X",         icon: undefined, color: "text-foreground" },
    { url: lead.social_youtube,   label: "YT",        icon: undefined, color: "text-[#FF0000]" },
    { url: lead.social_tiktok,    label: "TT",        icon: undefined, color: "text-foreground" },
  ].filter((s) => s.url);

  if (socials.length === 0) return <span className="text-xs text-muted-foreground/50">—</span>;

  return (
    <div className="flex items-center gap-1">
      {socials.map((s) => (
        <Tooltip key={s.label}>
          <TooltipTrigger asChild>
            <a
              href={s.url!}
              target="_blank"
              rel="noopener noreferrer"
              className={cn("hover:opacity-60 transition-opacity", s.color)}
              onClick={(e) => e.stopPropagation()}
            >
              {s.icon ? (
                <s.icon className="h-3.5 w-3.5" />
              ) : (
                <span className="text-[10px] font-bold leading-none">{s.label}</span>
              )}
            </a>
          </TooltipTrigger>
          <TooltipContent>{s.label}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}

/* ── Column definitions factory ── */
interface ColumnActions {
  onEditLead: (lead: Lead) => void;
  onDeleteLead: (ids: string[]) => void;
  onStatusChange: (lead: Lead, status: LeadStatus) => Promise<void>;
}

export function createColumns(actions: ColumnActions): ColumnDef<Lead>[] {
  return [
    /* Select */
    {
      id: "select",
      header: ({ table }) => (
        <div
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
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
        </div>
      ),
      cell: ({ row }) => (
        <div
          className="relative z-10"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
        >
          <Checkbox
            className="cursor-pointer"
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label={`${row.original.company} auswählen`}
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    },

    /* Firma */
    {
      accessorKey: "company",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Firma" />,
      cell: ({ row }) => {
        const lead = row.original;
        return (
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-md bg-primary/8 flex items-center justify-center shrink-0 group-hover:bg-primary/12 transition-colors">
              <Building2 className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate max-w-[160px] leading-tight">
                {lead.company}
              </p>
              {(lead.ceo_name || lead.name) && (
                <p className="text-[11px] text-muted-foreground truncate max-w-[160px] leading-tight mt-0.5">
                  {lead.ceo_name ?? lead.name}
                </p>
              )}
            </div>
          </div>
        );
      },
      enableHiding: false,
      size: 200,
    },

    /* Branche */
    {
      accessorKey: "industry",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Branche" />,
      cell: ({ getValue }) => (
        <span className="text-xs text-muted-foreground">{(getValue() as string) ?? "—"}</span>
      ),
      size: 130,
    },

    /* Ort */
    {
      id: "city",
      accessorFn: (row) => [row.postal_code, row.city].filter(Boolean).join(" ") || "—",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Ort" />,
      cell: ({ row }) => {
        const lead = row.original;
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 shrink-0" />
                <div className="min-w-0">
                  <span className="truncate block max-w-[110px]">
                    {[lead.postal_code, lead.city].filter(Boolean).join(" ") || "—"}
                  </span>
                  {lead.country && (
                    <span className="text-[10px] text-muted-foreground/60 truncate block max-w-[110px]">
                      {countryLabel(lead.country)}
                    </span>
                  )}
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs space-y-0.5">
                {(lead.street || lead.address) && <p>{lead.street ?? lead.address}</p>}
                <p>{[lead.postal_code, lead.city].filter(Boolean).join(" ")}</p>
                {lead.country && <p>{countryLabel(lead.country)}</p>}
              </div>
            </TooltipContent>
          </Tooltip>
        );
      },
      size: 140,
    },

    /* Kontakt */
    {
      id: "contact",
      header: "Kontakt",
      cell: ({ row }) => {
        const lead = row.original;
        return (
          <div className="flex flex-col gap-0.5">
            {lead.phone ? (
              <a
                href={`tel:${lead.phone}`}
                className="text-xs text-primary hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {lead.phone}
              </a>
            ) : (
              <span className="text-xs text-muted-foreground/50">—</span>
            )}
            {lead.email && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <a
                    href={`mailto:${lead.email}`}
                    className="text-[11px] text-muted-foreground hover:text-primary hover:underline truncate max-w-[170px] block"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {lead.email}
                  </a>
                </TooltipTrigger>
                <TooltipContent>{lead.email}</TooltipContent>
              </Tooltip>
            )}
          </div>
        );
      },
      enableSorting: false,
      size: 190,
    },

    /* Website */
    {
      accessorKey: "website",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Website" />,
      cell: ({ getValue }) => {
        const website = getValue() as string | null;
        if (!website) return <span className="text-xs text-muted-foreground/50">—</span>;
        return (
          <a
            href={website.startsWith("http") ? website : `https://${website}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="h-3 w-3 shrink-0" />
            <span className="truncate max-w-[90px]">
              {website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
            </span>
          </a>
        );
      },
      size: 130,
    },

    /* Social */
    {
      id: "social",
      header: "Social",
      cell: ({ row }) => <SocialIcons lead={row.original} />,
      enableSorting: false,
      size: 100,
    },

    /* Status */
    {
      accessorKey: "status",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const cfg = LEAD_STATUS_CONFIG[row.original.status];
        return (
          <Badge variant={cfg.variant} className="gap-1.5 text-xs font-medium">
            <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", cfg.dot)} />
            {cfg.label}
          </Badge>
        );
      },
      size: 130,
    },

    /* Actions */
    {
      id: "actions",
      cell: ({ row }) => {
        const lead = row.original;
        const cfg = LEAD_STATUS_CONFIG[lead.status];
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
                  <span className="sr-only">Aktionen</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                  Aktionen
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-xs gap-2 cursor-pointer"
                  onClick={() => actions.onEditLead(lead)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Bearbeiten
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="text-xs gap-2 cursor-pointer">
                    <span className={cn("h-2 w-2 rounded-full shrink-0", cfg.dot)} />
                    Status ändern
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-44">
                    {STATUS_LIST.map((opt) => (
                      <DropdownMenuItem
                        key={opt.value}
                        className="text-xs gap-2 cursor-pointer"
                        disabled={opt.value === lead.status}
                        onClick={() => actions.onStatusChange(lead, opt.value)}
                      >
                        <span className={cn("h-2 w-2 rounded-full shrink-0", opt.dot)} />
                        {opt.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-xs gap-2 cursor-pointer text-destructive focus:text-destructive"
                  onClick={() => actions.onDeleteLead([lead.id])}
                >
                  <Trash2 className="h-3.5 w-3.5" />
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
