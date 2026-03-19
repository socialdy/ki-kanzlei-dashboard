"use client";

import { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { X, Trash2, Pencil, ChevronDown, CheckSquare, Sparkles, Download, Loader2, Globe } from "lucide-react";
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
import type { LeadStatus, LeadFilters } from "@/types/leads";
import type { CrmProvider, CrmExportResult } from "@/lib/crm/types";
import { CRM_PROVIDERS, WEBHOOK_PROVIDER } from "@/lib/crm/providers";

const STATUS_OPTIONS: { value: LeadStatus; label: string; dot: string }[] = [
  { value: "new",       label: "Neu",          dot: "bg-blue-500" },
  { value: "enriched",  label: "Angereichert", dot: "bg-violet-500" },
  { value: "contacted", label: "Kontaktiert",  dot: "bg-amber-500" },
  { value: "converted", label: "Konvertiert",  dot: "bg-emerald-500" },
  { value: "closed",    label: "Geschlossen",  dot: "bg-slate-400" },
];

interface CrmSettings {
  hubspot_api_key?: string | null;
  pipedrive_api_key?: string | null;
  pipedrive_domain?: string | null;
  salesforce_instance_url?: string | null;
  salesforce_access_token?: string | null;
  zoho_client_id?: string | null;
  zoho_client_secret?: string | null;
  zoho_refresh_token?: string | null;
  webhook_url?: string | null;
}

function isConnected(providerId: CrmProvider, s: CrmSettings): boolean {
  switch (providerId) {
    case "hubspot": return !!s.hubspot_api_key?.trim();
    case "pipedrive": return !!s.pipedrive_api_key?.trim() && !!s.pipedrive_domain?.trim();
    case "salesforce": return !!s.salesforce_instance_url?.trim() && !!s.salesforce_access_token?.trim();
    case "zoho": return !!s.zoho_client_id?.trim() && !!s.zoho_client_secret?.trim() && !!s.zoho_refresh_token?.trim();
    case "webhook": return !!s.webhook_url?.trim();
    default: return false;
  }
}

interface LeadSelectionBarProps {
  selectedCount: number;
  totalCount?: number;
  selectedIds: string[];
  isGlobalSelected: boolean;
  filters: LeadFilters;
  crmSettings: CrmSettings;
  onClear: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: LeadStatus) => Promise<void>;
  onExport: (format: "csv" | "xlsx") => void;
  onSelectAll?: () => void;
}

export function LeadSelectionBar({
  selectedCount,
  totalCount,
  selectedIds,
  isGlobalSelected,
  filters,
  crmSettings,
  onClear,
  onEdit,
  onDelete,
  onStatusChange,
  onExport,
  onSelectAll,
}: LeadSelectionBarProps) {
  const [changingStatus, setChangingStatus] = useState(false);
  const [exportingCrm, setExportingCrm] = useState<CrmProvider | null>(null);

  if (selectedCount === 0) return null;

  async function handleStatusChange(status: LeadStatus) {
    setChangingStatus(true);
    try {
      await onStatusChange(status);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Status konnte nicht geändert werden");
    } finally {
      setChangingStatus(false);
    }
  }

  async function handleCrmExport(provider: CrmProvider) {
    setExportingCrm(provider);
    try {
      const payload: Record<string, unknown> = { provider };

      if (isGlobalSelected) {
        payload.selectionMode = "all";
        payload.filters = filters;
      } else {
        payload.selectionMode = "ids";
        payload.ids = selectedIds;
      }

      const res = await fetch("/api/export/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error ?? `Fehler ${res.status}`);
      }

      const json = await res.json();
      const result = json.data as CrmExportResult;
      const providerName = provider === "webhook" ? "Webhook" : CRM_PROVIDERS.find(p => p.id === provider)?.name ?? provider;

      if (result.failed === 0) {
        toast.success(`${result.success} Lead(s) nach ${providerName} exportiert`);
      } else {
        toast.warning(`${result.success} erfolgreich, ${result.failed} fehlgeschlagen (${providerName})`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "CRM-Export fehlgeschlagen");
    } finally {
      setExportingCrm(null);
    }
  }

  const displayCount = isGlobalSelected && totalCount ? totalCount : selectedCount;

  // Build connected CRM list
  const connectedProviders = CRM_PROVIDERS.filter(p => isConnected(p.id, crmSettings));
  const webhookConnected = isConnected("webhook", crmSettings);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-3 fade-in duration-150">
      <div className="flex items-center gap-0.5 border border-white/10 bg-foreground/95 backdrop-blur-xl shadow-xl px-2 py-1.5 rounded-xl">
        {/* Count */}
        <div className="flex items-center gap-1.5 px-2 mr-0.5">
          <CheckSquare className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold text-white whitespace-nowrap">
            {displayCount} ausgewählt
          </span>
        </div>

        {/* Global Select Button */}
        {!isGlobalSelected && onSelectAll && totalCount && totalCount > selectedCount && (
          <>
            <Separator orientation="vertical" className="h-4 bg-white/10" />
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2.5 text-xs text-primary hover:text-primary hover:bg-white/10 gap-1.5"
              onClick={onSelectAll}
            >
              <Sparkles className="h-3 w-3" />
              Alle {totalCount} auswählen
            </Button>
          </>
        )}

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

        {/* Bearbeiten — nur bei 1 Lead und NICHT global selected */}
        {selectedCount === 1 && !isGlobalSelected && (
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

        {/* Export — Datei + CRM direkt im Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              disabled={!!exportingCrm}
              className="h-7 px-2.5 text-xs text-white/80 hover:text-white hover:bg-white/10 gap-1"
            >
              {exportingCrm ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Download className="h-3 w-3" />
              )}
              Export
              <ChevronDown className="h-3 w-3 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" side="top" className="w-48 mb-1">
            <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
              Datei
            </DropdownMenuLabel>
            <DropdownMenuItem
              className="text-xs gap-2 cursor-pointer"
              onClick={() => onExport("xlsx")}
            >
              <Download className="h-3 w-3 text-emerald-600" />
              Excel (.xlsx)
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-xs gap-2 cursor-pointer"
              onClick={() => onExport("csv")}
            >
              <Download className="h-3 w-3 text-blue-600" />
              CSV (.csv)
            </DropdownMenuItem>

            {/* CRM providers */}
            {(connectedProviders.length > 0 || webhookConnected) && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                  CRM
                </DropdownMenuLabel>
                {connectedProviders.map((p) => (
                  <DropdownMenuItem
                    key={p.id}
                    className="text-xs gap-2 cursor-pointer"
                    disabled={!!exportingCrm}
                    onClick={() => handleCrmExport(p.id)}
                  >
                    <Image src={p.logo} alt={p.name} width={14} height={14} className="shrink-0" />
                    {p.name}
                    {exportingCrm === p.id && <Loader2 className="h-3 w-3 animate-spin ml-auto" />}
                  </DropdownMenuItem>
                ))}
                {webhookConnected && (
                  <DropdownMenuItem
                    className="text-xs gap-2 cursor-pointer"
                    disabled={!!exportingCrm}
                    onClick={() => handleCrmExport("webhook")}
                  >
                    <Globe className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                    Webhook
                    {exportingCrm === "webhook" && <Loader2 className="h-3 w-3 animate-spin ml-auto" />}
                  </DropdownMenuItem>
                )}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

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
          size="sm"
          className="h-7 px-1.5 text-white/30 hover:text-white hover:bg-white/10 ml-0.5"
          onClick={onClear}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
