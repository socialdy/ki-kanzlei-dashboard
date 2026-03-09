"use client";

import Image from "next/image";
import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { z } from "zod";
import {
    Eye, EyeOff, AlertCircle, ArrowLeft, CheckCircle2, KeyRound,
    Search, Sparkles, BarChart3, Shield,
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { createClient } from "@/lib/supabase/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

/* ── Validation ── */
const schema = z.object({
    email: z.string().min(1, "E-Mail ist erforderlich").email("Keine gültige E-Mail"),
    password: z.string().min(1, "Passwort ist erforderlich"),
});

/* ── Features ── */
const features = [
    { icon: Search, label: "Leads automatisch finden" },
    { icon: Sparkles, label: "KI-gestützte Datenanreicherung" },
    { icon: BarChart3, label: "Pipeline & Statusverfolgung" },
    { icon: Shield, label: "DSGVO-konform & sicher" },
];

/* ── Error message mapper ── */
function mapAuthError(message: string): string {
    const m = message.toLowerCase();
    if (m.includes("invalid login credentials") || m.includes("invalid_credentials")) {
        return "E-Mail oder Passwort ist falsch.";
    }
    if (m.includes("email not confirmed")) {
        return "E-Mail-Adresse noch nicht bestätigt. Prüfe dein Postfach.";
    }
    if (m.includes("too many requests") || m.includes("rate limit")) {
        return "Zu viele Anmeldeversuche. Bitte warte kurz.";
    }
    if (m.includes("user not found")) {
        return "Kein Konto mit dieser E-Mail gefunden.";
    }
    return `Anmeldung fehlgeschlagen: ${message}`;
}

/* ══════════════════════════════════════════════
   Set New Password Form (after clicking reset link)
   ══════════════════════════════════════════════ */
function SetNewPasswordForm() {
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [done, setDone] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        if (newPassword.length < 6) {
            setError("Das Passwort muss mindestens 6 Zeichen lang sein.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setError("Die Passwörter stimmen nicht überein.");
            return;
        }

        setIsLoading(true);
        try {
            const supabase = createClient();
            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword,
            });

            if (updateError) {
                setError(updateError.message);
                setIsLoading(false);
                return;
            }

            setDone(true);
            // Redirect to dashboard after short delay
            setTimeout(() => {
                window.location.href = "/dashboard";
            }, 2000);
        } catch {
            setError("Verbindung fehlgeschlagen. Bitte versuche es erneut.");
            setIsLoading(false);
        }
    }

    if (done) {
        return (
            <div className="space-y-5 text-center py-4">
                <div className="h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                </div>
                <div className="space-y-1.5">
                    <p className="text-sm font-semibold text-foreground">Passwort geändert</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        Dein Passwort wurde erfolgreich zurückgesetzt. Du wirst zum Dashboard weitergeleitet.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <div className="space-y-2">
                <Label htmlFor="new-password">Neues Passwort</Label>
                <div className="relative">
                    <Input
                        id="new-password"
                        type={showPw ? "text" : "password"}
                        placeholder="Mindestens 6 Zeichen"
                        value={newPassword}
                        onChange={(e) => { setNewPassword(e.target.value); setError(null); }}
                        className="h-11 pr-10 bg-white/60 border-border/60 focus:bg-white transition-colors"
                        disabled={isLoading}
                        autoFocus
                        autoComplete="new-password"
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        tabIndex={-1}
                        onClick={() => setShowPw((v) => !v)}
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground"
                    >
                        {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="confirm-password">Passwort bestätigen</Label>
                <Input
                    id="confirm-password"
                    type={showPw ? "text" : "password"}
                    placeholder="Passwort wiederholen"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setError(null); }}
                    className="h-11 bg-white/60 border-border/60 focus:bg-white transition-colors"
                    disabled={isLoading}
                    autoComplete="new-password"
                />
            </div>

            {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-destructive flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Die Passwörter stimmen nicht überein
                </p>
            )}

            <Button
                type="submit"
                className="w-full h-11 font-semibold tracking-wide shadow-md shadow-primary/20 hover:shadow-primary/35 transition-shadow"
                disabled={isLoading || newPassword.length < 6 || newPassword !== confirmPassword}
            >
                {isLoading ? (
                    <span className="flex items-center gap-2">
                        <Spinner className="h-4 w-4" />
                        Wird gespeichert…
                    </span>
                ) : (
                    <span className="flex items-center gap-2">
                        <KeyRound className="h-4 w-4" />
                        Passwort speichern
                    </span>
                )}
            </Button>
        </form>
    );
}

/* ══════════════════════════════════════════════
   Request Password Reset Form (enter email)
   ══════════════════════════════════════════════ */
function PasswordResetForm({ onBack }: { onBack: () => void }) {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        if (!email.trim()) {
            setError("Bitte gib deine E-Mail-Adresse ein.");
            return;
        }

        setIsLoading(true);
        try {
            const supabase = createClient();
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(
                email.trim(),
                { redirectTo: `${window.location.origin}/auth/callback?next=/login?recovery=true` }
            );

            if (resetError) {
                setError("Fehler beim Senden. Bitte versuche es erneut.");
                setIsLoading(false);
                return;
            }

            setSent(true);
        } catch {
            setError("Verbindung fehlgeschlagen. Bitte prüfe deine Internetverbindung.");
        } finally {
            setIsLoading(false);
        }
    }

    if (sent) {
        return (
            <div className="space-y-5 text-center py-4">
                <div className="h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                </div>
                <div className="space-y-1.5">
                    <p className="text-sm font-semibold text-foreground">E-Mail gesendet</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        Wir haben einen Link zum Zurücksetzen deines Passworts an{" "}
                        <span className="font-medium text-foreground">{email}</span> gesendet.
                    </p>
                </div>
                <Button
                    variant="outline"
                    className="w-full h-10"
                    onClick={onBack}
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Zurück zur Anmeldung
                </Button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <div className="space-y-2">
                <Label htmlFor="reset-email">E-Mail Adresse</Label>
                <Input
                    id="reset-email"
                    type="email"
                    placeholder="max@mustermann.at"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(null); }}
                    className="h-11 bg-white/60 border-border/60 focus:bg-white transition-colors"
                    disabled={isLoading}
                    autoFocus
                />
                <p className="text-[11px] text-muted-foreground">
                    Du erhältst einen Link zum Zurücksetzen deines Passworts.
                </p>
            </div>

            <Button
                type="submit"
                className="w-full h-11 font-semibold tracking-wide shadow-md shadow-primary/20 hover:shadow-primary/35 transition-shadow"
                disabled={isLoading}
            >
                {isLoading ? (
                    <span className="flex items-center gap-2">
                        <Spinner className="h-4 w-4" />
                        Wird gesendet…
                    </span>
                ) : "Link senden"}
            </Button>

            <Button
                type="button"
                variant="ghost"
                className="w-full h-9 text-xs text-muted-foreground"
                onClick={onBack}
            >
                <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                Zurück zur Anmeldung
            </Button>
        </form>
    );
}

/* ══════════════════════════════════════════════
   Login Form
   ══════════════════════════════════════════════ */
function LoginForm({ onForgotPassword }: { onForgotPassword: () => void }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setFieldErrors({});

        const result = schema.safeParse({ email, password });
        if (!result.success) {
            const errs: { email?: string; password?: string } = {};
            for (const issue of result.error.issues) {
                if (issue.path[0] === "email") errs.email = issue.message;
                if (issue.path[0] === "password") errs.password = issue.message;
            }
            setFieldErrors(errs);
            return;
        }

        setIsLoading(true);
        try {
            const supabase = createClient();
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email: result.data.email,
                password: result.data.password,
            });

            if (authError) {
                setIsLoading(false);
                setError(mapAuthError(authError.message));
                return;
            }

            if (!data.session) {
                setIsLoading(false);
                setError("Keine Session erhalten. Bitte versuche es erneut.");
                return;
            }

            window.location.href = "/dashboard";
        } catch {
            setIsLoading(false);
            setError("Verbindung fehlgeschlagen. Bitte prüfe deine Internetverbindung.");
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <div className="space-y-2">
                <Label htmlFor="email">E-Mail Adresse</Label>
                <Input
                    id="email"
                    type="email"
                    placeholder="max@mustermann.at"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setFieldErrors({}); setError(null); }}
                    className={`h-11 bg-white/60 border-border/60 focus:bg-white transition-colors ${fieldErrors.email ? "border-destructive focus-visible:ring-destructive" : ""}`}
                    disabled={isLoading}
                />
                {fieldErrors.email && (
                    <p className="text-xs text-destructive">{fieldErrors.email}</p>
                )}
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label htmlFor="password">Passwort</Label>
                    <button
                        type="button"
                        onClick={onForgotPassword}
                        className="text-[11px] text-primary hover:text-primary/80 font-medium transition-colors"
                    >
                        Passwort vergessen?
                    </button>
                </div>
                <div className="relative">
                    <Input
                        id="password"
                        type={showPw ? "text" : "password"}
                        placeholder="Dein Passwort"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setFieldErrors({}); setError(null); }}
                        className={`h-11 pr-10 bg-white/60 border-border/60 focus:bg-white transition-colors ${fieldErrors.password ? "border-destructive focus-visible:ring-destructive" : ""}`}
                        disabled={isLoading}
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        tabIndex={-1}
                        onClick={() => setShowPw((v) => !v)}
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground"
                    >
                        {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                </div>
                {fieldErrors.password && (
                    <p className="text-xs text-destructive">{fieldErrors.password}</p>
                )}
            </div>

            <Button
                type="submit"
                className="w-full h-11 font-semibold tracking-wide shadow-md shadow-primary/20 hover:shadow-primary/35 transition-shadow"
                disabled={isLoading}
            >
                {isLoading ? (
                    <span className="flex items-center gap-2">
                        <Spinner className="h-4 w-4" />
                        Anmeldung läuft…
                    </span>
                ) : "Zum Dashboard"}
            </Button>
        </form>
    );
}

/* ══════════════════════════════════════════════
   Page
   ══════════════════════════════════════════════ */
type ViewState = "login" | "request-reset" | "set-password";

function getTitle(view: ViewState): string {
    switch (view) {
        case "login":         return "Willkommen zurück";
        case "request-reset": return "Passwort zurücksetzen";
        case "set-password":  return "Neues Passwort wählen";
    }
}

function getDescription(view: ViewState): string {
    switch (view) {
        case "login":         return "Melde dich an, um fortzufahren";
        case "request-reset": return "Gib deine E-Mail ein, um einen Reset-Link zu erhalten";
        case "set-password":  return "Wähle ein neues, sicheres Passwort für dein Konto";
    }
}

function LoginContent() {
    const searchParams = useSearchParams();
    const isRecovery = searchParams.get("recovery") === "true";

    const [view, setView] = useState<ViewState>(isRecovery ? "set-password" : "login");

    // Also detect if Supabase sends the recovery event via hash (fallback)
    useEffect(() => {
        const hash = window.location.hash;
        if (hash.includes("type=recovery")) {
            setView("set-password");
        }
    }, []);

    return (
        <div className="min-h-screen w-full flex relative">

            {/* ── Left: Brand panel ── */}
            <div
                className="hidden lg:flex lg:w-[46%] xl:w-[50%] flex-col justify-between p-12 xl:p-14 relative overflow-hidden"
                style={{
                    background: "linear-gradient(150deg, oklch(0.32 0.16 263) 0%, oklch(0.44 0.22 263) 40%, oklch(0.50 0.24 258) 100%)",
                }}
            >
                {/* Decorative orbs */}
                <div className="pointer-events-none absolute top-0 right-0 w-[600px] h-[600px] opacity-25 rounded-full"
                    style={{ background: "radial-gradient(circle, oklch(0.65 0.20 263) 0%, transparent 60%)", transform: "translate(25%,-25%)" }} />
                <div className="pointer-events-none absolute bottom-0 left-0 w-[450px] h-[450px] opacity-15 rounded-full"
                    style={{ background: "radial-gradient(circle, oklch(0.50 0.22 280) 0%, transparent 65%)", transform: "translate(-30%,30%)" }} />

                {/* Logo */}
                <div className="relative z-10 flex items-center gap-3">
                    <Image
                        src="/images/KI-Kanzlei_Logo_2026.png"
                        alt="KI Kanzlei"
                        width={88}
                        height={88}
                        quality={100}
                        className="h-11 w-11 rounded-lg shadow-lg shadow-black/20"
                        priority
                    />
                    <span className="text-lg font-bold text-white tracking-tight">KI Kanzlei</span>
                </div>

                {/* Headline + Features */}
                <div className="relative z-10 space-y-8">
                    <h1 className="text-3xl xl:text-4xl font-bold text-white leading-tight tracking-tight">
                        Dein Vertrieb.<br />
                        <span className="text-white/40">Voll automatisiert.</span>
                    </h1>

                    <div className="space-y-3">
                        {features.map(({ icon: Icon, label }) => (
                            <div key={label} className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center flex-shrink-0">
                                    <Icon className="h-4 w-4 text-white/70" />
                                </div>
                                <span className="text-sm text-white/60 font-medium">{label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <p className="relative z-10 text-white/20 text-xs">
                    &copy; {new Date().getFullYear()} KI Kanzlei. Alle Rechte vorbehalten.
                </p>
            </div>

            {/* ── Right: Form ── */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 bg-background relative overflow-hidden">
                {/* Decorative gradient */}
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full opacity-20"
                        style={{ background: "radial-gradient(circle, oklch(0.546 0.244 263 / 0.2) 0%, transparent 70%)" }} />
                </div>

                {/* Mobile logo */}
                <div className="lg:hidden mb-8 flex items-center gap-2.5">
                    <Image
                        src="/images/KI-Kanzlei_Logo_2026.png"
                        alt="KI Kanzlei"
                        width={72}
                        height={72}
                        quality={100}
                        className="h-9 w-9 rounded-lg shadow-md"
                        priority
                    />
                    <span className="text-lg font-bold text-foreground tracking-tight">KI Kanzlei</span>
                </div>

                <div className="relative z-10 w-full max-w-sm">
                    <Card className="glass-panel border-white/60 shadow-2xl shadow-black/8 overflow-hidden">
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

                        <CardHeader className="pt-8 pb-5 px-7">
                            <CardTitle className="text-xl font-bold text-foreground">
                                {getTitle(view)}
                            </CardTitle>
                            <CardDescription>
                                {getDescription(view)}
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="px-7 pb-5">
                            {view === "login" && (
                                <LoginForm onForgotPassword={() => setView("request-reset")} />
                            )}
                            {view === "request-reset" && (
                                <PasswordResetForm onBack={() => setView("login")} />
                            )}
                            {view === "set-password" && (
                                <SetNewPasswordForm />
                            )}
                        </CardContent>

                        <CardFooter className="flex flex-col gap-4 px-7 pb-7 pt-0">
                            <div className="flex items-center gap-3 w-full">
                                <Separator className="flex-1" />
                                <span className="text-xs text-muted-foreground/50 font-medium">Verschlüsselte Verbindung</span>
                                <Separator className="flex-1" />
                            </div>
                            <p className="text-center text-[11px] text-muted-foreground/45 leading-relaxed">
                                Zugang nur für autorisierte Nutzer.<br />
                                Probleme? Kontaktiere deinen Administrator.
                            </p>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense>
            <LoginContent />
        </Suspense>
    );
}
