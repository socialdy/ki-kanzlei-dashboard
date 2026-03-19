"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DACH_COUNTRIES,
  getRegionOptions,
  getRegionLabel,
} from "@/types/leads";
import type { UnipileSearchResult } from "@/lib/unipile/types";

/* ── LinkedIn Account Limits ── */
const ACCOUNT_LIMITS = {
  classic:         { search: 1000, outreach: 25, label: "Classic",         color: "text-muted-foreground" },
  premium:         { search: 1000, outreach: 25, label: "Premium",         color: "text-blue-600" },
  sales_navigator: { search: 2500, outreach: 50, label: "Sales Navigator", color: "text-amber-600" },
} as const;

type AccountType = keyof typeof ACCOUNT_LIMITS;

const searchSchema = z.object({
  query: z.string().min(2, "Mindestens 2 Zeichen"),
  country: z.string().min(2),
  location: z.string().optional(),
  city: z.string().optional(),
  industry: z.string().optional(),
});

type SearchFormValues = z.infer<typeof searchSchema>;

interface LinkedInSearchFormProps {
  onImported: () => void;
}

export function LinkedInSearchForm({ onImported }: LinkedInSearchFormProps) {
  const [searching, setSearching] = useState(false);
  const [accountType, setAccountType] = useState<AccountType>("classic");
  const [ready, setReady] = useState(false);
  const abortRef = useRef(false);

  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: { query: "", country: "AT", location: "", city: "", industry: "" },
  });

  const selectedCountry = form.watch("country");
  const regionOptions = getRegionOptions(selectedCountry);
  const regionLabel = getRegionLabel(selectedCountry);
  const limits = ACCOUNT_LIMITS[accountType];

  // Auto-detect account type on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/linkedin/accounts");
        if (!res.ok) { setReady(true); return; }
        const json = await res.json();
        const settingsRes = await fetch("/api/settings");
        const settingsJson = await settingsRes.json();
        const savedId = settingsJson.data?.unipile_account_id;
        const accounts = json.data ?? [];
        const match = savedId
          ? accounts.find((a: { id: string }) => a.id === savedId)
          : accounts[0];
        if (match?.type) setAccountType(match.type as AccountType);
      } catch { /* silent */ }
      finally { setReady(true); }
    })();
  }, []);

  function handleCountryChange(value: string) {
    form.setValue("country", value);
    form.setValue("location", "");
    form.clearErrors();
  }

  const importBatch = useCallback(async (items: UnipileSearchResult[], query: string) => {
    if (items.length === 0) return 0;

    // Filter out unknown/invalid profiles
    const validItems = items.filter((r) => {
      const name = (r.name || "").toLowerCase().trim();
      return name && name !== "unknown" && name !== "linkedin member" && name !== "linkedin user" && name.length > 1;
    });
    if (validItems.length === 0) return 0;

    const leads = validItems.map((r) => {
      const fullName = r.name || [r.first_name, r.last_name].filter(Boolean).join(" ") || r.id;
      const nameParts = fullName.split(" ");
      return {
        linkedin_url: r.profile_url || r.public_profile_url || `https://www.linkedin.com/in/${r.public_identifier || r.id}`,
        linkedin_id: r.id || r.provider_id,
        full_name: fullName,
        first_name: r.first_name || nameParts[0] || null,
        last_name: r.last_name || nameParts.slice(1).join(" ") || null,
        headline: r.headline || null,
        location: r.location || null,
        profile_picture_url: r.profile_picture_url || null,
        search_query: query,
      };
    });

    try {
      const res = await fetch("/api/linkedin/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leads }),
      });
      const json = await res.json();
      return res.ok ? (json.count ?? leads.length) : 0;
    } catch {
      return 0;
    }
  }, []);

  async function handleSearch() {
    const valid = await form.trigger();
    if (!valid) return;

    const values = form.getValues();
    const queryStr = values.query.trim();

    abortRef.current = false;
    setSearching(true);

    // Build location string — use most specific term for Unipile parameter resolution
    // Priority: city > region > country (Unipile resolves text → LinkedIn location IDs)
    let locationStr = "";
    if (values.city?.trim()) {
      locationStr = values.city.trim();
    } else if (values.location && values.location !== "all") {
      locationStr = values.location;
    } else {
      const country = DACH_COUNTRIES.find((c) => c.value === values.country);
      if (country) locationStr = country.label;
    }

    const apiType = accountType === "sales_navigator" ? "sales_navigator" : "classic";
    let cursor: string | null = null;
    let pageNum = 0;
    let totalImported = 0;
    let totalDuplicates = 0;
    let totalResults = 0;
    let totalCount = 0;

    // Show persistent toast for search progress
    const toastId = toast.loading("LinkedIn-Suche gestartet…", {
      description: "Ergebnisse werden geladen und importiert",
      duration: Infinity,
    });

    try {
      // Load ALL existing URLs to detect duplicates
      const existingRes = await fetch("/api/linkedin/leads?pageSize=9999");
      const existingJson = await existingRes.json();
      const existingUrls = new Set<string>(
        (existingJson.data?.data ?? []).map((l: { linkedin_url: string }) => l.linkedin_url),
      );

      // eslint-disable-next-line no-constant-condition
      while (true) {
        if (abortRef.current) break;

        const pageRes: Response = await fetch("/api/linkedin/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: queryStr,
            location: locationStr || undefined,
            industry: values.industry?.trim() || undefined,
            cursor,
            api: apiType,
          }),
        });

        const json = await pageRes.json();

        if (!pageRes.ok) {
          if (pageNum === 0) {
            toast.error(json.error || "Suche fehlgeschlagen", { id: toastId, duration: 5000 });
          }
          break;
        }

        const items: UnipileSearchResult[] = json.data?.items ?? [];
        if (items.length === 0) break;

        if (pageNum === 0 && json.data?.paging?.total_count) {
          totalCount = json.data.paging.total_count;
        }

        totalResults += items.length;

        // Split into new vs duplicate
        const newItems: UnipileSearchResult[] = [];
        for (const item of items) {
          const url = item.profile_url || item.public_profile_url
            || `https://www.linkedin.com/in/${item.public_identifier || item.id}`;
          if (existingUrls.has(url)) {
            totalDuplicates++;
          } else {
            newItems.push(item);
            existingUrls.add(url);
          }
        }

        // Import new items
        if (newItems.length > 0) {
          const count = await importBatch(newItems, queryStr);
          totalImported += count;
        }

        // Update toast
        const progress = totalCount > 0
          ? ` (${Math.round((totalResults / totalCount) * 100)}%)`
          : "";
        toast.loading(`${totalResults.toLocaleString("de")} Ergebnisse geladen${progress}`, {
          id: toastId,
          description: `${totalImported} neu importiert · ${totalDuplicates} Duplikate übersprungen`,
        });

        cursor = json.data?.cursor ?? null;
        pageNum++;
        if (!cursor) break;
      }

      // Final toast (explicit duration to override Infinity from loading toast)
      if (totalResults === 0) {
        toast.info("Keine Ergebnisse gefunden", {
          id: toastId,
          description: "Versuche andere Suchbegriffe oder einen anderen Standort.",
          duration: 5000,
        });
      } else if (totalImported > 0) {
        toast.success(`${totalImported} neue Leads importiert`, {
          id: toastId,
          description: `${totalResults.toLocaleString("de")} Ergebnisse durchsucht · ${totalDuplicates} Duplikate übersprungen`,
          duration: 5000,
        });
        onImported();
      } else {
        toast.info("Alle Ergebnisse bereits vorhanden", {
          id: toastId,
          description: `${totalResults.toLocaleString("de")} Ergebnisse, ${totalDuplicates} Duplikate`,
          duration: 5000,
        });
        onImported();
      }
    } catch {
      toast.error("Netzwerkfehler bei der Suche", { id: toastId, duration: 5000 });
    } finally {
      setSearching(false);
    }
  }

  return (
    <Form {...form}>
      <Card>
        <CardContent className="pt-5">
          <div className="space-y-3">

            {/* Row 1: Suchbegriff + Land */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="query"
                render={({ field }) => (
                  <FormItem className="min-w-0">
                    <FormLabel>Suchbegriff *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                        <Input
                          placeholder="z.B. Rechtsanwalt, CEO, Steuerberater"
                          className="pl-9"
                          {...field}
                          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSearch(); } }}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormItem className="min-w-0">
                <FormLabel>Land</FormLabel>
                <Select value={selectedCountry} onValueChange={handleCountryChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DACH_COUNTRIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            </div>

            {/* Row 2: Region + Stadt */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem className="min-w-0">
                    <FormLabel>{regionLabel}</FormLabel>
                    <Select
                      onValueChange={(val) => { field.onChange(val === "all" ? "" : val); }}
                      value={field.value || "all"}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={`Alle ${regionLabel === "Kanton" ? "Kantone" : "Bundesländer"}`} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {regionOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem className="min-w-0">
                    <FormLabel>Stadt / Ort</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="z.B. Salzburg"
                        {...field}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSearch(); } }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Row 3: Branche + Button */}
            <div className="flex items-end gap-3">
              <FormField
                control={form.control}
                name="industry"
                render={({ field }) => (
                  <FormItem className="flex-1 min-w-0">
                    <FormLabel>Branche (optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="z.B. Automotive, Legal, Healthcare"
                        {...field}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSearch(); } }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <Button
                type="button"
                disabled={!ready || searching}
                className="gap-2 h-9"
                onClick={searching ? () => { abortRef.current = true; } : handleSearch}
              >
                {searching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                {searching ? "Suche läuft…" : "Suche starten"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </Form>
  );
}
