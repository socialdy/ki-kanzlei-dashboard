"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import Image from "next/image";
import {
  Save, Webhook, Sparkles, EyeIcon, EyeOffIcon, CheckCircle2,
  Loader2, Globe, ExternalLink, Settings2,
  Zap, XCircle, Linkedin, Check, X, Search,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { CrmProvider } from "@/lib/crm/types";

/* ── Sanitization ── */
function sanitize(v: string): string {
  return v.replace(/[<>]/g, "").replace(/javascript:/gi, "").replace(/on\w+\s*=/gi, "").trim();
}
function sanitizeUrl(v: string): string {
  const c = sanitize(v);
  if (!c) return "";
  try { const u = new URL(c); if (!["http:", "https:"].includes(u.protocol)) return ""; return c; }
  catch { return c.startsWith("http://") || c.startsWith("https://") || !c.includes("://") ? c : ""; }
}
const ML = 512;
const MU = 2048;

/* ── Types ── */
interface SenderProfile { name?: string; position?: string; company?: string; specialization?: string; tone?: string; }
interface Settings {
  n8n_webhook_url: string | null; gemini_api_key: string | null;
  hubspot_api_key: string | null; pipedrive_api_key: string | null; pipedrive_domain: string | null;
  salesforce_instance_url: string | null; salesforce_access_token: string | null;
  zoho_client_id: string | null; zoho_client_secret: string | null; zoho_refresh_token: string | null;
  webhook_url: string | null; unipile_api_key: string | null; unipile_dsn: string | null; unipile_account_id: string | null;
  linkedin_daily_limit: number | null; linkedin_auto_outreach: boolean | null;
  linkedin_follow_up_days: number | null; linkedin_sender_profile: SenderProfile | null;
  linkedin_outreach_template: string | null;
}
type ConnStatus = "idle" | "testing" | "success" | "error";

interface ToolCfg {
  id: string; name: string; description: string; icon: React.ReactNode;
  logo?: string; docsUrl?: string;
  fields: { key: keyof Settings; label: string; placeholder: string; type: "secret" | "text" | "url" }[];
  isConnected: (s: Settings) => boolean;
  getCredentials?: (s: Settings) => Record<string, string>;
  testProvider?: CrmProvider | "unipile" | "webhook";
}

const TOOLS: ToolCfg[] = [
  { id: "n8n", name: "n8n Webhook", description: "Workflow-Automation & Lead-Verarbeitung.", icon: <Webhook className="size-8" />,
    fields: [{ key: "n8n_webhook_url", label: "Webhook URL", placeholder: "https://n8n.deine-domain.de/webhook/...", type: "url" }],
    isConnected: (s) => !!s.n8n_webhook_url?.trim() },
  { id: "gemini", name: "Google Gemini", description: "KI-gestützte Lead-Analyse & Bewertung.", icon: <Sparkles className="size-8" />,
    fields: [{ key: "gemini_api_key", label: "API Key", placeholder: "AIza...", type: "secret" }],
    isConnected: (s) => !!s.gemini_api_key?.trim() },
  { id: "unipile", name: "LinkedIn (Unipile)", description: "Outreach, Einladungen & Nachrichten.", icon: <Linkedin className="size-8" />,
    fields: [
      { key: "unipile_dsn", label: "DSN", placeholder: "https://api1.unipile.com:13337", type: "url" },
      { key: "unipile_api_key", label: "API Key", placeholder: "unipi_...", type: "secret" },
      { key: "unipile_account_id", label: "Account ID", placeholder: "Automatisch erkannt", type: "text" },
    ],
    isConnected: (s) => !!s.unipile_api_key?.trim() && !!s.unipile_dsn?.trim(), testProvider: "unipile" },
  { id: "hubspot", name: "HubSpot", description: "Kontakte & Deals synchronisieren.", logo: "/logos/hubspot.svg", icon: null,
    docsUrl: "https://developers.hubspot.com/docs/api/crm/contacts",
    fields: [{ key: "hubspot_api_key", label: "Private App Token", placeholder: "pat-na1-...", type: "secret" }],
    isConnected: (s) => !!s.hubspot_api_key?.trim(),
    getCredentials: (s) => ({ hubspot_api_key: s.hubspot_api_key ?? "" }), testProvider: "hubspot" as CrmProvider },
  { id: "pipedrive", name: "Pipedrive", description: "Deals & Personen exportieren.", logo: "/logos/pipedrive.svg", icon: null,
    docsUrl: "https://developers.pipedrive.com/docs/api/v1/Persons",
    fields: [
      { key: "pipedrive_api_key", label: "API Token", placeholder: "xxxxxxxx...", type: "secret" },
      { key: "pipedrive_domain", label: "Subdomain", placeholder: "meinefirma", type: "text" },
    ],
    isConnected: (s) => !!s.pipedrive_api_key?.trim() && !!s.pipedrive_domain?.trim(),
    getCredentials: (s) => ({ pipedrive_api_key: s.pipedrive_api_key ?? "", pipedrive_domain: s.pipedrive_domain ?? "" }), testProvider: "pipedrive" as CrmProvider },
  { id: "salesforce", name: "Salesforce", description: "Leads in Salesforce CRM exportieren.", logo: "/logos/salesforce.svg", icon: null,
    docsUrl: "https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/",
    fields: [
      { key: "salesforce_instance_url", label: "Instance URL", placeholder: "https://meinefirma.my.salesforce.com", type: "url" },
      { key: "salesforce_access_token", label: "Access Token", placeholder: "00Dxx...", type: "secret" },
    ],
    isConnected: (s) => !!s.salesforce_instance_url?.trim() && !!s.salesforce_access_token?.trim(),
    getCredentials: (s) => ({ salesforce_instance_url: s.salesforce_instance_url ?? "", salesforce_access_token: s.salesforce_access_token ?? "" }), testProvider: "salesforce" as CrmProvider },
  { id: "zoho", name: "Zoho CRM", description: "Kontakte in Zoho CRM exportieren.", logo: "/logos/zoho.svg", icon: null,
    docsUrl: "https://www.zoho.com/crm/developer/docs/api/v6/",
    fields: [
      { key: "zoho_client_id", label: "Client ID", placeholder: "1000.XXXX...", type: "text" },
      { key: "zoho_client_secret", label: "Client Secret", placeholder: "xxxxxxxx...", type: "secret" },
      { key: "zoho_refresh_token", label: "Refresh Token", placeholder: "1000.xxxx...", type: "secret" },
    ],
    isConnected: (s) => !!s.zoho_client_id?.trim() && !!s.zoho_client_secret?.trim() && !!s.zoho_refresh_token?.trim(),
    getCredentials: (s) => ({ zoho_client_id: s.zoho_client_id ?? "", zoho_client_secret: s.zoho_client_secret ?? "", zoho_refresh_token: s.zoho_refresh_token ?? "" }), testProvider: "zoho" as CrmProvider },
  { id: "webhook", name: "Webhook", description: "Zapier, Make oder n8n Webhook.", icon: <Globe className="size-8" />,
    fields: [{ key: "webhook_url", label: "Webhook URL", placeholder: "https://hooks.zapier.com/hooks/catch/...", type: "url" }],
    isConnected: (s) => !!s.webhook_url?.trim(), testProvider: "webhook" },
];

const pwReqs = [
  { regex: /.{6,}/, text: "Mind. 6 Zeichen" }, { regex: /[a-z]/, text: "Kleinbuchstabe" },
  { regex: /[A-Z]/, text: "Großbuchstabe" }, { regex: /[0-9]/, text: "Zahl" },
  { regex: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, text: "Sonderzeichen" },
];
const sColor = (s: number) => s === 0 ? "bg-border" : s <= 2 ? "bg-destructive" : s <= 3 ? "bg-amber-500" : s === 4 ? "bg-yellow-400" : "bg-green-500";

interface NotifPrefs { email_new_lead: boolean; email_campaign_done: boolean; email_linkedin_reply: boolean; push_new_lead: boolean; push_campaign_error: boolean; }

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabs = ["company", "profile", "integrations", "outreach", "notifications"];
  const paramTab = searchParams.get("tab") ?? "";
  const initialTab = tabs.includes(paramTab) ? paramTab : "company";

  const [activeTab, setActiveTab] = useState(initialTab);
  const [settings, setSettings] = useState<Settings>({
    n8n_webhook_url: null, gemini_api_key: null, hubspot_api_key: null, pipedrive_api_key: null,
    pipedrive_domain: null, salesforce_instance_url: null, salesforce_access_token: null,
    zoho_client_id: null, zoho_client_secret: null, zoho_refresh_token: null, webhook_url: null,
    unipile_api_key: null, unipile_dsn: null, unipile_account_id: null, linkedin_daily_limit: 25,
    linkedin_auto_outreach: false, linkedin_follow_up_days: 3, linkedin_sender_profile: null, linkedin_outreach_template: null,
  });
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [connStatus, setConnStatus] = useState<Record<string, ConnStatus>>({});
  const [connError, setConnError] = useState<Record<string, string>>({});
  const [openDialog, setOpenDialog] = useState<string | null>(null);
  const [toolFilter, setToolFilter] = useState<"all" | "active" | "inactive">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [companyName, setCompanyName] = useState("");
  const [companyPosition, setCompanyPosition] = useState("");
  const [companySpec, setCompanySpec] = useState("");
  const [companyTone, setCompanyTone] = useState("professionell");
  const [companyWebsite, setCompanyWebsite] = useState("");

  const [displayName, setDisplayName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [curPw, setCurPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwVisible, setPwVisible] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [savingName, setSavingName] = useState(false);

  const [outreachTpl, setOutreachTpl] = useState("");
  const [campLimit, setCampLimit] = useState(200);
  const [campDelay, setCampDelay] = useState(8);
  const [campReply, setCampReply] = useState("info@ki-kanzlei.at");
  const [notifs, setNotifs] = useState<NotifPrefs>({ email_new_lead: true, email_campaign_done: true, email_linkedin_reply: true, push_new_lead: false, push_campaign_error: true });

  const toggleKey = (k: string) => setShowKeys((v) => ({ ...v, [k]: !v[k] }));
  const strength = pwReqs.map((r) => ({ met: r.regex.test(newPw), text: r.text }));
  const strengthScore = useMemo(() => strength.filter((r) => r.met).length, [strength]);

  function setSetting(key: keyof Settings, value: string, type: "text" | "secret" | "url" = "text") {
    const max = type === "url" ? MU : ML;
    setSettings((s) => ({ ...s, [key]: type === "url" ? sanitizeUrl(value.slice(0, max)) : sanitize(value.slice(0, max)) }));
  }

  const filteredTools = useMemo(() => {
    let t = TOOLS;
    if (toolFilter === "active") t = t.filter((x) => x.isConnected(settings));
    if (toolFilter === "inactive") t = t.filter((x) => !x.isConnected(settings));
    if (searchQuery.trim()) { const q = searchQuery.toLowerCase(); t = t.filter((x) => x.name.toLowerCase().includes(q) || x.description.toLowerCase().includes(q)); }
    return t;
  }, [toolFilter, settings, searchQuery]);

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();
        const { data: { user }, error: ue } = await supabase.auth.getUser();
        if (ue || !user) { toast.error("Sitzung abgelaufen"); router.replace("/login"); return; }
        const { data: profile } = await supabase.from("user_profiles").select("role, display_name").eq("id", user.id).single();
        if (profile?.role !== "admin") { router.replace("/dashboard"); return; }
        if (profile?.display_name) setDisplayName(profile.display_name);

        const res = await fetch("/api/settings");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const { data: d } = await res.json();
        if (d) {
          setSettings({
            n8n_webhook_url: d.n8n_webhook_url ?? "", gemini_api_key: d.gemini_api_key ?? "",
            hubspot_api_key: d.hubspot_api_key ?? "", pipedrive_api_key: d.pipedrive_api_key ?? "",
            pipedrive_domain: d.pipedrive_domain ?? "", salesforce_instance_url: d.salesforce_instance_url ?? "",
            salesforce_access_token: d.salesforce_access_token ?? "", zoho_client_id: d.zoho_client_id ?? "",
            zoho_client_secret: d.zoho_client_secret ?? "", zoho_refresh_token: d.zoho_refresh_token ?? "",
            webhook_url: d.webhook_url ?? "", unipile_api_key: d.unipile_api_key ?? "",
            unipile_dsn: d.unipile_dsn ?? "", unipile_account_id: d.unipile_account_id ?? "",
            linkedin_daily_limit: d.linkedin_daily_limit ?? 25, linkedin_auto_outreach: d.linkedin_auto_outreach ?? false,
            linkedin_follow_up_days: d.linkedin_follow_up_days ?? 3,
            linkedin_sender_profile: d.linkedin_sender_profile ?? null, linkedin_outreach_template: d.linkedin_outreach_template ?? null,
          });
          const sp = d.linkedin_sender_profile;
          if (sp) { setCompanyName(sp.company ?? ""); setCompanyPosition(sp.position ?? ""); setCompanySpec(sp.specialization ?? ""); setCompanyTone(sp.tone ?? "professionell"); }
          if (d.linkedin_outreach_template) setOutreachTpl(d.linkedin_outreach_template);
        }
        if (user.email) { setUserEmail(user.email); setNewEmail(user.email); }
      } catch { toast.error("Einstellungen konnten nicht geladen werden"); }
      finally { setLoading(false); }
    }
    load();
  }, [router]);

  function handleTabChange(tab: string) {
    setActiveTab(tab);
    router.replace(tab === "company" ? "/dashboard/settings" : `/dashboard/settings?tab=${tab}`, { scroll: false });
  }

  async function handleSaveSettings() {
    setSaving(true);
    try {
      const sp: SenderProfile = { name: sanitize(displayName), position: sanitize(companyPosition), company: sanitize(companyName), specialization: sanitize(companySpec), tone: sanitize(companyTone) };
      const payload: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(settings)) {
        if (k === "linkedin_sender_profile" || k === "linkedin_outreach_template") continue;
        payload[k] = typeof v === "string" ? (k.includes("url") || k.includes("dsn") ? sanitizeUrl(v) : sanitize(v)) : v;
      }
      payload.linkedin_sender_profile = sp;
      payload.linkedin_outreach_template = sanitize(outreachTpl).slice(0, 4096);
      const res = await fetch("/api/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) { const j = await res.json().catch(() => null); throw new Error(j?.error ?? `HTTP ${res.status}`); }
      toast.success("Einstellungen gespeichert");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Fehler beim Speichern"); }
    finally { setSaving(false); }
  }

  const handleTestConnection = useCallback(async (provider: string) => {
    setConnStatus((s) => ({ ...s, [provider]: "testing" }));
    setConnError((s) => ({ ...s, [provider]: "" }));
    try {
      const tool = TOOLS.find((t) => t.id === provider);
      let creds: Record<string, string> = {};
      if (tool?.getCredentials) creds = tool.getCredentials(settings);
      else if (provider === "webhook") creds = { webhook_url: settings.webhook_url ?? "" };
      else if (provider === "unipile") creds = { unipile_dsn: settings.unipile_dsn ?? "", unipile_api_key: settings.unipile_api_key ?? "" };
      const res = await fetch("/api/settings/test-connection", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ provider: tool?.testProvider ?? provider, credentials: creds }) });
      let json; try { json = await res.json(); } catch { throw new Error("Ungültige Antwort"); }
      if (!res.ok) { setConnStatus((s) => ({ ...s, [provider]: "error" })); setConnError((s) => ({ ...s, [provider]: sanitize(json?.error ?? "Fehler") })); return; }
      if (json.data?.ok) { setConnStatus((s) => ({ ...s, [provider]: "success" })); if (provider === "unipile" && json.data.accountId) setSettings((s) => ({ ...s, unipile_account_id: sanitize(String(json.data.accountId)) })); }
      else { setConnStatus((s) => ({ ...s, [provider]: "error" })); setConnError((s) => ({ ...s, [provider]: sanitize(json.data?.error ?? "Fehler") })); }
    } catch (err) { setConnStatus((s) => ({ ...s, [provider]: "error" })); setConnError((s) => ({ ...s, [provider]: err instanceof Error ? err.message : "Netzwerkfehler" })); }
  }, [settings]);

  async function handleSaveName() {
    if (!sanitize(displayName)) return;
    setSavingName(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Nicht angemeldet");
      const { error } = await supabase.from("user_profiles").update({ display_name: sanitize(displayName) }).eq("id", user.id);
      if (error) throw error;
      toast.success("Name gespeichert");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Fehler"); }
    finally { setSavingName(false); }
  }

  async function handleSaveEmail() {
    const e = sanitize(newEmail);
    if (!e || e === userEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) { toast.error("Ungültige E-Mail"); return; }
    setSavingEmail(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ email: e });
      if (error) throw error;
      toast.success("Bestätigungslink gesendet");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Fehler"); }
    finally { setSavingEmail(false); }
  }

  async function handleSavePw() {
    if (!curPw) { toast.error("Aktuelles Passwort eingeben"); return; }
    if (newPw.length < 6) { toast.error("Mind. 6 Zeichen"); return; }
    if (newPw !== confirmPw) { toast.error("Passwörter stimmen nicht überein"); return; }
    setSavingPw(true);
    try {
      const supabase = createClient();
      const { error: se } = await supabase.auth.signInWithPassword({ email: userEmail, password: curPw });
      if (se) { toast.error("Aktuelles Passwort falsch"); setSavingPw(false); return; }
      const { error } = await supabase.auth.updateUser({ password: newPw });
      if (error) throw error;
      toast.success("Passwort geändert"); setCurPw(""); setNewPw(""); setConfirmPw("");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Fehler"); }
    finally { setSavingPw(false); }
  }

  function SecretInput({ id, value, placeholder, onChange }: { id: string; value: string; placeholder: string; onChange: (v: string) => void }) {
    return (
      <div className="relative">
        <Input type={showKeys[id] ? "text" : "password"} placeholder={placeholder} value={value}
          onChange={(e) => onChange(e.target.value)} maxLength={ML}
          className="font-mono text-xs pr-9" autoComplete="off" spellCheck={false} />
        <Button type="button" variant="ghost" size="icon" onClick={() => toggleKey(id)}
          className="text-muted-foreground absolute inset-y-0 right-0 rounded-l-none hover:bg-transparent">
          {showKeys[id] ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
        </Button>
      </div>
    );
  }

  if (loading) return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-10 w-96" />
      <div className="grid gap-4 sm:grid-cols-2"><Skeleton className="h-48" /><Skeleton className="h-48" /></div>
    </div>
  );

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="company">Unternehmen</TabsTrigger>
            <TabsTrigger value="profile">Profil</TabsTrigger>
            <TabsTrigger value="integrations">Integrationen</TabsTrigger>
            <TabsTrigger value="outreach">Outreach</TabsTrigger>
            <TabsTrigger value="notifications">Benachrichtigungen</TabsTrigger>
          </TabsList>

          {/* ═══ UNTERNEHMEN ═══ */}
          <TabsContent value="company">
            <Card className="shadow-xs bg-gradient-to-t from-primary/5 to-card">
              <CardHeader>
                <CardTitle>Unternehmen</CardTitle>
                <CardDescription>Diese Angaben werden für Outreach, Kampagnen und KI-Nachrichten verwendet.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="c-name">Firmenname</Label>
                  <Input id="c-name" placeholder="KI Kanzlei" value={companyName}
                    onChange={(e) => setCompanyName(e.target.value.slice(0, 256))} maxLength={256} />
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="grid gap-3">
                    <Label htmlFor="c-pos">Deine Position</Label>
                    <Input id="c-pos" placeholder="Geschäftsführer" value={companyPosition}
                      onChange={(e) => setCompanyPosition(e.target.value.slice(0, 256))} maxLength={256} />
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="c-spec">Spezialisierung</Label>
                    <Input id="c-spec" placeholder="KI-Lösungen für Kanzleien" value={companySpec}
                      onChange={(e) => setCompanySpec(e.target.value.slice(0, 256))} maxLength={256} />
                  </div>
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="grid gap-3">
                    <Label htmlFor="c-tone">Kommunikationston</Label>
                    <Select value={companyTone} onValueChange={setCompanyTone}>
                      <SelectTrigger id="c-tone"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professionell">Professionell</SelectItem>
                        <SelectItem value="freundlich">Freundlich</SelectItem>
                        <SelectItem value="direkt">Direkt</SelectItem>
                        <SelectItem value="locker">Locker</SelectItem>
                        <SelectItem value="formell">Formell</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="c-web">Website</Label>
                    <Input id="c-web" type="url" placeholder="https://ki-kanzlei.at" value={companyWebsite}
                      onChange={(e) => setCompanyWebsite(e.target.value.slice(0, MU))} maxLength={MU} />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveSettings} disabled={saving}>
                  {saving && <Loader2 className="mr-2 size-4 animate-spin" />}Speichern
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* ═══ PROFIL ═══ */}
          <TabsContent value="profile" className="space-y-4">
            <Card className="shadow-xs bg-gradient-to-t from-primary/5 to-card">
              <CardHeader>
                <CardTitle>Anzeigename</CardTitle>
                <CardDescription>Dein Name im Dashboard.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <Label htmlFor="d-name">Name</Label>
                <Input id="d-name" placeholder="Dein Name" value={displayName}
                  onChange={(e) => setDisplayName(e.target.value.slice(0, 100))} maxLength={100} />
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveName} disabled={savingName || !displayName.trim()}>
                  {savingName && <Loader2 className="mr-2 size-4 animate-spin" />}Speichern
                </Button>
              </CardFooter>
            </Card>

            <Card className="shadow-xs bg-gradient-to-t from-primary/5 to-card">
              <CardHeader>
                <CardTitle>E-Mail-Adresse</CardTitle>
                <CardDescription>Ändere deine Login-E-Mail.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <Label htmlFor="email">E-Mail</Label>
                <Input id="email" type="email" value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value.slice(0, 254))} maxLength={254} autoComplete="email" />
                {newEmail !== userEmail && newEmail.trim() && (
                  <p className="text-sm text-muted-foreground">Bestätigungslink wird gesendet.</p>
                )}
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveEmail} disabled={savingEmail || !newEmail.trim() || newEmail === userEmail}>
                  {savingEmail && <Loader2 className="mr-2 size-4 animate-spin" />}Speichern
                </Button>
              </CardFooter>
            </Card>

            <Card className="shadow-xs bg-gradient-to-t from-primary/5 to-card">
              <CardHeader>
                <CardTitle>Passwort</CardTitle>
                <CardDescription>Passwort ändern.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="cur-pw">Aktuelles Passwort</Label>
                  <div className="relative">
                    <Input id="cur-pw" type={pwVisible ? "text" : "password"} value={curPw}
                      onChange={(e) => setCurPw(e.target.value.slice(0, 128))} maxLength={128} className="pr-9" autoComplete="current-password" />
                    <Button type="button" variant="ghost" size="icon" onClick={() => setPwVisible((v) => !v)}
                      className="text-muted-foreground absolute inset-y-0 right-0 rounded-l-none hover:bg-transparent">
                      {pwVisible ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
                    </Button>
                  </div>
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="new-pw">Neues Passwort</Label>
                  <Input id="new-pw" type={pwVisible ? "text" : "password"} value={newPw}
                    onChange={(e) => setNewPw(e.target.value.slice(0, 128))} maxLength={128} autoComplete="new-password" />
                  <div className="flex h-1 w-full gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className={`h-full flex-1 rounded-full transition-all duration-500 ${i < strengthScore ? sColor(strengthScore) : "bg-border"}`} />
                    ))}
                  </div>
                  <ul className="space-y-1">
                    {strength.map((r, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs">
                        {r.met ? <Check className="size-3.5 text-primary" /> : <X className="size-3.5 text-muted-foreground/40" />}
                        <span className={r.met ? "text-foreground" : "text-muted-foreground"}>{r.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="cfm-pw">Passwort bestätigen</Label>
                  <Input id="cfm-pw" type={pwVisible ? "text" : "password"} value={confirmPw}
                    onChange={(e) => setConfirmPw(e.target.value.slice(0, 128))} maxLength={128} autoComplete="new-password" />
                  {newPw && confirmPw && newPw !== confirmPw && (
                    <p className="text-sm text-destructive">Passwörter stimmen nicht überein</p>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSavePw} disabled={savingPw || !curPw || !newPw || !confirmPw || newPw !== confirmPw || newPw.length < 6}>
                  {savingPw && <Loader2 className="mr-2 size-4 animate-spin" />}Passwort ändern
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* ═══ INTEGRATIONEN ═══ */}
          <TabsContent value="integrations" className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="inline-flex items-center gap-1">
                {(["all", "active", "inactive"] as const).map((f) => (
                  <Button key={f} variant={toolFilter === f ? "secondary" : "ghost"} size="sm" onClick={() => setToolFilter(f)}>
                    {{ all: "Alle", active: "Aktiv", inactive: "Inaktiv" }[f]}
                  </Button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <div className="relative w-full sm:w-56">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input placeholder="Suchen..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
                </div>
                <Button onClick={handleSaveSettings} disabled={saving} size="sm">
                  {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}Speichern
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredTools.map((tool) => {
                const connected = tool.isConnected(settings);
                const status = connStatus[tool.id];
                return (
                  <Card key={tool.id} className={cn("shadow-xs bg-gradient-to-t from-primary/5 to-card transition-all hover:shadow-sm", connected && "border-primary/20")}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex size-14 items-center justify-center rounded-2xl border bg-muted/40">
                          {tool.logo ? <Image src={tool.logo} alt={tool.name} width={32} height={32} /> : tool.icon}
                        </div>
                        {tool.docsUrl && (
                          <a href={tool.docsUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground/40 hover:text-muted-foreground transition-colors">
                            <ExternalLink className="size-4" />
                          </a>
                        )}
                      </div>
                      <h3 className="font-medium mb-1">{tool.name}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-2">{tool.description}</p>
                      {status === "success" && <Badge variant="outline" className="mb-3 gap-1 text-xs text-emerald-600 border-emerald-200 bg-emerald-50"><CheckCircle2 className="size-3" /> Verbunden</Badge>}
                      {status === "error" && connError[tool.id] && <p className="mb-3 text-xs text-destructive flex items-center gap-1.5"><XCircle className="size-3.5 shrink-0" />{connError[tool.id]}</p>}
                      <Separator className="mb-4" />
                      <div className="flex items-center justify-between">
                        <Button variant="outline" size="sm" className="gap-2" onClick={() => setOpenDialog(tool.id)}>
                          <Settings2 className="size-4" /> Einstellungen
                        </Button>
                        <Switch checked={connected} onCheckedChange={() => {
                          if (connected) { const u: Partial<Settings> = {}; tool.fields.forEach((f) => { (u as Record<string, string>)[f.key] = ""; }); setSettings((s) => ({ ...s, ...u })); }
                          else setOpenDialog(tool.id);
                        }} />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            {filteredTools.length === 0 && <p className="text-center py-12 text-muted-foreground">Keine Integrationen gefunden.</p>}

            {TOOLS.map((tool) => (
              <Dialog key={tool.id} open={openDialog === tool.id} onOpenChange={(o) => setOpenDialog(o ? tool.id : null)}>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <div className="flex items-center gap-3">
                      <div className="flex size-12 items-center justify-center rounded-xl border bg-muted/40">
                        {tool.logo ? <Image src={tool.logo} alt={tool.name} width={26} height={26} /> : tool.icon}
                      </div>
                      <div><DialogTitle>{tool.name}</DialogTitle><DialogDescription>{tool.description}</DialogDescription></div>
                    </div>
                  </DialogHeader>
                  <div className="grid gap-4 py-2">
                    {tool.fields.map((field) => (
                      <div key={field.key} className="grid gap-2">
                        <Label>{field.label}</Label>
                        {field.type === "secret"
                          ? <SecretInput id={field.key} value={(settings[field.key] ?? "").toString()} placeholder={field.placeholder} onChange={(v) => setSetting(field.key, v, "secret")} />
                          : <Input type={field.type} placeholder={field.placeholder} value={(settings[field.key] ?? "").toString()}
                              onChange={(e) => setSetting(field.key, e.target.value, field.type)} maxLength={field.type === "url" ? MU : ML}
                              className="font-mono text-xs" autoComplete="off" spellCheck={false} />}
                      </div>
                    ))}
                    {connStatus[tool.id] === "error" && connError[tool.id] && <p className="text-sm text-destructive flex items-center gap-1.5"><XCircle className="size-3.5 shrink-0" />{connError[tool.id]}</p>}
                    {connStatus[tool.id] === "success" && <p className="text-sm text-primary flex items-center gap-1.5"><CheckCircle2 className="size-3.5" />Verbindung erfolgreich</p>}
                  </div>
                  <DialogFooter className="gap-2 sm:gap-0">
                    {tool.testProvider && (
                      <Button variant="outline" size="sm" className="gap-1.5"
                        disabled={!tool.fields.every((f) => (settings[f.key] ?? "").toString().trim()) || connStatus[tool.id] === "testing"}
                        onClick={() => handleTestConnection(tool.id)}>
                        {connStatus[tool.id] === "testing" ? <Loader2 className="size-3.5 animate-spin" /> : <Zap className="size-3.5" />}Testen
                      </Button>
                    )}
                    <Button size="sm" onClick={() => { handleSaveSettings(); setOpenDialog(null); }}>
                      {saving ? <Loader2 className="mr-2 size-3.5 animate-spin" /> : <Save className="mr-2 size-3.5" />}Speichern
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            ))}
          </TabsContent>

          {/* ═══ OUTREACH ═══ */}
          <TabsContent value="outreach" className="space-y-4">
            <Card className="shadow-xs bg-gradient-to-t from-primary/5 to-card">
              <CardHeader>
                <CardTitle>LinkedIn Outreach</CardTitle>
                <CardDescription>Automatisierung für Einladungen und Follow-Ups.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="text-sm font-medium">Auto-Outreach</p>
                    <p className="text-sm text-muted-foreground">Automatisch Einladungen senden.</p>
                  </div>
                  <Switch checked={settings.linkedin_auto_outreach ?? false}
                    onCheckedChange={(v) => setSettings((s) => ({ ...s, linkedin_auto_outreach: v }))} />
                </div>
                <div className="grid gap-3">
                  <div className="flex items-center justify-between">
                    <Label>Tageslimit</Label>
                    <span className="text-sm tabular-nums text-muted-foreground">{settings.linkedin_daily_limit ?? 25} / Tag</span>
                  </div>
                  <Slider value={[Number(settings.linkedin_daily_limit ?? 25)]}
                    onValueChange={([v]) => setSettings((s) => ({ ...s, linkedin_daily_limit: Math.min(50, Math.max(5, v)) }))}
                    min={5} max={50} step={5} />
                </div>
                <div className="grid gap-3">
                  <div className="flex items-center justify-between">
                    <Label>Follow-Up nach</Label>
                    <span className="text-sm tabular-nums text-muted-foreground">{settings.linkedin_follow_up_days ?? 3} Tage</span>
                  </div>
                  <Slider value={[Number(settings.linkedin_follow_up_days ?? 3)]}
                    onValueChange={([v]) => setSettings((s) => ({ ...s, linkedin_follow_up_days: Math.min(30, Math.max(1, v)) }))}
                    min={1} max={30} step={1} />
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveSettings} disabled={saving}>
                  {saving && <Loader2 className="mr-2 size-4 animate-spin" />}Speichern
                </Button>
              </CardFooter>
            </Card>

            <Card className="shadow-xs bg-gradient-to-t from-primary/5 to-card">
              <CardHeader>
                <CardTitle>Nachrichtenvorlage</CardTitle>
                <CardDescription>Template für LinkedIn-Einladungen. Variablen: {"{name}"}, {"{company}"}, {"{position}"}.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <Label htmlFor="tpl">Vorlage</Label>
                <textarea id="tpl" rows={6}
                  placeholder={"Hallo {name},\n\nich habe gesehen, dass Sie bei {company} als {position} tätig sind..."}
                  value={outreachTpl} onChange={(e) => setOutreachTpl(e.target.value.slice(0, 4096))} maxLength={4096}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none" />
                <p className="text-sm text-muted-foreground text-right tabular-nums">{outreachTpl.length} / 4.096</p>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveSettings} disabled={saving}>
                  {saving && <Loader2 className="mr-2 size-4 animate-spin" />}Speichern
                </Button>
              </CardFooter>
            </Card>

            <Card className="shadow-xs bg-gradient-to-t from-primary/5 to-card">
              <CardHeader>
                <CardTitle>E-Mail-Kampagnen</CardTitle>
                <CardDescription>Standard-Werte für neue Kampagnen.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6">
                <div className="grid gap-3">
                  <div className="flex items-center justify-between">
                    <Label>Tägliches Sendelimit</Label>
                    <span className="text-sm tabular-nums text-muted-foreground">{campLimit} / Tag</span>
                  </div>
                  <Slider value={[campLimit]} onValueChange={([v]) => setCampLimit(Math.min(500, Math.max(10, v)))} min={10} max={500} step={10} />
                </div>
                <div className="grid gap-3">
                  <div className="flex items-center justify-between">
                    <Label>Verzögerung</Label>
                    <span className="text-sm tabular-nums text-muted-foreground">{campDelay} Min.</span>
                  </div>
                  <Slider value={[campDelay]} onValueChange={([v]) => setCampDelay(Math.min(60, Math.max(1, v)))} min={1} max={60} step={1} />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="reply-to">Reply-To</Label>
                  <Input id="reply-to" type="email" placeholder="info@ki-kanzlei.at" value={campReply}
                    onChange={(e) => setCampReply(e.target.value.slice(0, 254))} maxLength={254} />
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={() => toast.success("Kampagnen-Defaults gespeichert")}>Speichern</Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* ═══ BENACHRICHTIGUNGEN ═══ */}
          <TabsContent value="notifications" className="space-y-4">
            <Card className="shadow-xs bg-gradient-to-t from-primary/5 to-card">
              <CardHeader>
                <CardTitle>E-Mail-Benachrichtigungen</CardTitle>
                <CardDescription>Wähle, worüber du per E-Mail informiert wirst.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-1">
                {([
                  { key: "email_new_lead" as const, label: "Neuer Lead", desc: "Bei neuem Lead." },
                  { key: "email_campaign_done" as const, label: "Kampagne fertig", desc: "Wenn eine Kampagne abgeschlossen ist." },
                  { key: "email_linkedin_reply" as const, label: "LinkedIn-Antwort", desc: "Bei Antwort auf LinkedIn." },
                ]).map((item) => (
                  <div key={item.key} className="flex items-center justify-between rounded-lg border p-4">
                    <div><p className="text-sm font-medium">{item.label}</p><p className="text-sm text-muted-foreground">{item.desc}</p></div>
                    <Switch checked={notifs[item.key]} onCheckedChange={(v) => setNotifs((s) => ({ ...s, [item.key]: v }))} />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="shadow-xs bg-gradient-to-t from-primary/5 to-card">
              <CardHeader>
                <CardTitle>Push-Benachrichtigungen</CardTitle>
                <CardDescription>In-App Benachrichtigungen.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-1">
                {([
                  { key: "push_new_lead" as const, label: "Neuer Lead", desc: "Benachrichtigung im Dashboard." },
                  { key: "push_campaign_error" as const, label: "Kampagnen-Fehler", desc: "Sofortige Benachrichtigung bei Fehlern." },
                ]).map((item) => (
                  <div key={item.key} className="flex items-center justify-between rounded-lg border p-4">
                    <div><p className="text-sm font-medium">{item.label}</p><p className="text-sm text-muted-foreground">{item.desc}</p></div>
                    <Switch checked={notifs[item.key]} onCheckedChange={(v) => setNotifs((s) => ({ ...s, [item.key]: v }))} />
                  </div>
                ))}
              </CardContent>
              <CardFooter>
                <Button onClick={() => toast.success("Benachrichtigungen gespeichert")}>Speichern</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
