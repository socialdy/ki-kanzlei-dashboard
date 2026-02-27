"use client";

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import type { Lead, LeadStatus } from "@/types/leads";

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

/* ── Sub-Components ── */
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

/* ── Main Component ── */
interface LeadsTableProps {
  leads: Lead[];
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  onEditLead: (lead: Lead) => void;
  onDeleteLead: (ids: string[]) => void;
  onStatusChange: (lead: Lead, status: LeadStatus) => Promise<void>;
}

export function LeadsTable({
  leads,
  selectedIds,
  onSelectionChange,
  onEditLead,
  onDeleteLead,
  onStatusChange,
}: LeadsTableProps) {
  const allSelected = leads.length > 0 && leads.every((l) => selectedIds.has(l.id));
  const someSelected = leads.some((l) => selectedIds.has(l.id)) && !allSelected;

  function toggleAll() {
    onSelectionChange(allSelected ? new Set() : new Set(leads.map((l) => l.id)));
  }

  function toggleOne(id: string) {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    onSelectionChange(next);
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b">
            <TableHead className="w-10 pl-4 pr-2">
              <Checkbox
                checked={allSelected ? true : someSelected ? "indeterminate" : false}
                onCheckedChange={toggleAll}
                aria-label="Alle auswählen"
              />
            </TableHead>
            <TableHead className="min-w-[180px] px-3 text-xs font-medium">Firma</TableHead>
            <TableHead className="min-w-[110px] px-3 text-xs font-medium">Branche</TableHead>
            <TableHead className="min-w-[120px] px-3 text-xs font-medium">Ort</TableHead>
            <TableHead className="min-w-[190px] px-3 text-xs font-medium">Kontakt</TableHead>
            <TableHead className="min-w-[120px] px-3 text-xs font-medium">Website</TableHead>
            <TableHead className="min-w-[90px] px-3 text-xs font-medium">Social</TableHead>
            <TableHead className="min-w-[120px] px-3 text-xs font-medium">Status</TableHead>
            <TableHead className="w-12 px-2" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => {
            const cfg = LEAD_STATUS_CONFIG[lead.status];
            const isSelected = selectedIds.has(lead.id);
            return (
              <TableRow
                key={lead.id}
                className={cn(
                  "h-12 cursor-pointer transition-colors group",
                  isSelected ? "bg-primary/5 hover:bg-primary/8" : "hover:bg-muted/40",
                )}
                onClick={() => onEditLead(lead)}
              >
                {/* Checkbox */}
                <TableCell className="pl-4 pr-2" onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleOne(lead.id)}
                    aria-label={`${lead.company} auswählen`}
                  />
                </TableCell>

                {/* Firma */}
                <TableCell className="py-2 px-3">
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
                </TableCell>

                {/* Branche */}
                <TableCell className="py-2 px-3 text-xs text-muted-foreground">
                  {lead.category ?? lead.industry ?? "—"}
                </TableCell>

                {/* Ort */}
                <TableCell className="py-2 px-3">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate max-w-[100px]">
                      {[lead.postal_code, lead.city].filter(Boolean).join(" ") || "—"}
                    </span>
                  </div>
                </TableCell>

                {/* Kontakt */}
                <TableCell className="py-2 px-3">
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
                </TableCell>

                {/* Website */}
                <TableCell className="py-2 px-3">
                  {lead.website ? (
                    <a
                      href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="h-3 w-3 shrink-0" />
                      <span className="truncate max-w-[90px]">
                        {lead.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                      </span>
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground/50">—</span>
                  )}
                </TableCell>

                {/* Social */}
                <TableCell className="py-2 px-3">
                  <SocialIcons lead={lead} />
                </TableCell>

                {/* Status */}
                <TableCell className="py-2 px-3">
                  <Badge
                    variant={cfg.variant}
                    className="gap-1.5 text-xs font-medium"
                  >
                    <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", cfg.dot)} />
                    {cfg.label}
                  </Badge>
                </TableCell>

                {/* Row Actions */}
                <TableCell className="py-2 px-2" onClick={(e) => e.stopPropagation()}>
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
                        onClick={() => onEditLead(lead)}
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
                              onClick={() => onStatusChange(lead, opt.value)}
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
                        onClick={() => onDeleteLead([lead.id])}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
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
    </div>
  );
}
