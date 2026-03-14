"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Save, Webhook, BrainCircuit, Eye, EyeOff, CheckCircle2,
  User, KeyRound, Mail, AlertCircle, Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createClient } from "@/lib/supabase/client";

interface Settings {
  n8n_webhook_url: string | null;
  gemini_api_key: string | null;
}

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = searchParams.get("tab") === "profile" ? "profile" : "integrations";

  const [activeTab, setActiveTab] = useState(initialTab);
  const [settings, setSettings] = useState<Settings>({ n8n_webhook_url: null, gemini_api_key: null });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showKey, setShowKey] = useState(false);

  // Profile state
  const [userEmail, setUserEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        // Check admin role
        if (user) {
          const { data: profile } = await supabase
            .from("user_profiles")
            .select("role")
            .eq("id", user.id)
            .single();

          if (profile?.role !== "admin") {
            router.replace("/dashboard");
            return;
          }
        }

        const settingsRes = await fetch("/api/settings");

        if (settingsRes.ok) {
          const json = await settingsRes.json();
          setSettings({
            n8n_webhook_url: json.data?.n8n_webhook_url ?? "",
            gemini_api_key: json.data?.gemini_api_key ?? "",
          });
        }

        if (user?.email) {
          setUserEmail(user.email);
          setNewEmail(user.email);
        }
      } catch {
        toast.error("Einstellungen konnten nicht geladen werden");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  function handleTabChange(tab: string) {
    setActiveTab(tab);
    const url = tab === "profile" ? "/dashboard/settings?tab=profile" : "/dashboard/settings";
    router.replace(url, { scroll: false });
  }

  async function handleSaveSettings() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error();
      toast.success("Einstellungen gespeichert");
    } catch {
      toast.error("Fehler beim Speichern");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateEmail() {
    if (!newEmail.trim() || newEmail === userEmail) return;

    setSavingEmail(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
      if (error) throw error;
      toast.success("Bestätigungslink wurde an die neue E-Mail gesendet");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Fehler beim Ändern der E-Mail");
    } finally {
      setSavingEmail(false);
    }
  }

  async function handleUpdatePassword() {
    if (!currentPassword) {
      toast.error("Bitte gib dein aktuelles Passwort ein");
      return;
    }
    if (!newPassword || !confirmPassword) {
      toast.error("Bitte alle Felder ausfüllen");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Das neue Passwort muss mindestens 6 Zeichen lang sein");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Die Passwörter stimmen nicht überein");
      return;
    }

    setSavingPassword(true);
    try {
      const supabase = createClient();

      // Re-authenticate with current password first
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: currentPassword,
      });
      if (signInError) {
        toast.error("Aktuelles Passwort ist falsch");
        setSavingPassword(false);
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      toast.success("Passwort erfolgreich geändert");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Fehler beim Ändern des Passworts");
    } finally {
      setSavingPassword(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6 max-w-2xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6 max-w-2xl">
      {/* Header */}
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight">Einstellungen</h1>
        <p className="text-sm text-muted-foreground">
          Verwalte dein Profil und konfiguriere Integrationen.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            Mein Profil
          </TabsTrigger>
          <TabsTrigger value="integrations" className="gap-2">
            <Webhook className="h-4 w-4" />
            Integrationen
          </TabsTrigger>
        </TabsList>

        {/* ── Profile Tab ── */}
        <TabsContent value="profile" className="space-y-6 mt-6">

          {/* Email */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                E-Mail-Adresse
              </CardTitle>
              <CardDescription>
                Ändere die E-Mail-Adresse, mit der du dich anmeldest.
              </CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="pt-5 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  E-Mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="h-10"
                />
                {newEmail !== userEmail && newEmail.trim() && (
                  <Alert className="bg-amber-50 border-amber-200">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-xs text-amber-700">
                      Nach dem Speichern erhältst du einen Bestätigungslink an die neue Adresse.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={handleUpdateEmail}
                  disabled={savingEmail || !newEmail.trim() || newEmail === userEmail}
                  size="sm"
                >
                  {savingEmail ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  E-Mail ändern
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Password */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-muted-foreground" />
                Passwort ändern
              </CardTitle>
              <CardDescription>
                Wähle ein sicheres Passwort mit mindestens 6 Zeichen.
              </CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="pt-5 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password" className="text-sm font-medium">
                  Aktuelles Passwort
                </Label>
                <div className="relative">
                  <Input
                    id="current-password"
                    type={showCurrentPw ? "text" : "password"}
                    placeholder="Dein aktuelles Passwort"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="h-10 pr-10"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password" className="text-sm font-medium">
                    Neues Passwort
                  </Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showNewPw ? "text" : "password"}
                      placeholder="Neues Passwort"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="h-10 pr-10"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPw((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-sm font-medium">
                    Passwort bestätigen
                  </Label>
                  <Input
                    id="confirm-password"
                    type={showNewPw ? "text" : "password"}
                    placeholder="Passwort wiederholen"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-10"
                    autoComplete="new-password"
                  />
                </div>
              </div>

              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-destructive flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Die Passwörter stimmen nicht überein
                </p>
              )}

              {newPassword && newPassword.length > 0 && newPassword.length < 6 && (
                <p className="text-xs text-destructive flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Mindestens 6 Zeichen erforderlich
                </p>
              )}

              <div className="flex justify-end">
                <Button
                  onClick={handleUpdatePassword}
                  disabled={
                    savingPassword ||
                    !currentPassword ||
                    !newPassword ||
                    !confirmPassword ||
                    newPassword !== confirmPassword ||
                    newPassword.length < 6
                  }
                  size="sm"
                >
                  {savingPassword ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <KeyRound className="h-4 w-4 mr-2" />
                  )}
                  Passwort ändern
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Integrations Tab ── */}
        <TabsContent value="integrations" className="space-y-6 mt-6">

          {/* n8n */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Webhook className="h-4 w-4 text-muted-foreground" />
                n8n Konfiguration
              </CardTitle>
              <CardDescription>
                Webhook-URL deiner n8n-Instanz. Wird beim Starten einer Kampagne aufgerufen.
              </CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="pt-5 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="webhook-url" className="text-sm font-medium">
                  Webhook URL
                </Label>
                <Input
                  id="webhook-url"
                  type="url"
                  placeholder="https://n8n.deine-domain.de/webhook/ki-kanzlei-outreach"
                  value={settings.n8n_webhook_url ?? ""}
                  onChange={(e) => setSettings((s) => ({ ...s, n8n_webhook_url: e.target.value }))}
                  className="h-10 font-mono text-sm"
                />
                {settings.n8n_webhook_url && (
                  <p className="text-xs text-emerald-600 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    URL konfiguriert
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  In n8n findest du die URL beim Webhook-Trigger-Node unter &quot;Webhook URL&quot;.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Gemini */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <BrainCircuit className="h-4 w-4 text-muted-foreground" />
                KI-Konfiguration
              </CardTitle>
              <CardDescription>
                Google Gemini API Key für die E-Mail-Generierung in n8n.
              </CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="pt-5 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gemini-key" className="text-sm font-medium">
                  Gemini API Key
                </Label>
                <div className="relative">
                  <Input
                    id="gemini-key"
                    type={showKey ? "text" : "password"}
                    placeholder="AIza..."
                    value={settings.gemini_api_key ?? ""}
                    onChange={(e) => setSettings((s) => ({ ...s, gemini_api_key: e.target.value }))}
                    className="h-10 font-mono text-sm pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {settings.gemini_api_key && (
                  <p className="text-xs text-emerald-600 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    API Key konfiguriert
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Zu finden unter{" "}
                  <span className="font-mono">aistudio.google.com</span> → API Keys.
                  Dieser Key wird in deiner n8n-Instanz als Gemini-Credential eingetragen.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Save */}
          <div className="flex justify-end">
            <Button onClick={handleSaveSettings} disabled={saving} className="h-10 px-6">
              {saving ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Speichern...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Speichern
                </span>
              )}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
