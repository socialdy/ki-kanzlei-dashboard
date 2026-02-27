"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { z } from "zod";
import { Eye, EyeOff, Bot, Zap, BarChart3, ShieldCheck, Loader2, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

/* ── Validation ── */
const schema = z.object({
    email: z.string().min(1, "E-Mail ist erforderlich").email("Keine gültige E-Mail"),
    password: z.string().min(1, "Passwort ist erforderlich"),
});

/* ── Feature bullets ── */
const features = [
    { icon: Bot, label: "KI-gestützte Lead-Generierung" },
    { icon: Zap, label: "Vollautomatische n8n-Workflows" },
    { icon: BarChart3, label: "Echtzeit Performance-Tracking" },
    { icon: ShieldCheck, label: "DSGVO-konform & sicher" },
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

/* ── Login Form ── */
function LoginForm() {
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
                    placeholder="deine@email.at"
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
                <Label htmlFor="password">Passwort</Label>
                <div className="relative">
                    <Input
                        id="password"
                        type={showPw ? "text" : "password"}
                        placeholder="Passwort eingeben"
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
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Anmeldung läuft…
                    </span>
                ) : "Anmelden"}
            </Button>
        </form>
    );
}

/* ── Page ── */
export default function LoginPage() {
    return (
        <div className="min-h-screen w-full flex relative">

            {/* ── Logo oben links ── */}
            <div className="absolute top-8 left-8 z-50">
                <Link href="/">
                    <Image
                        src="/images/KI-Kanzlei_Logo_2026.png"
                        alt="KI Kanzlei"
                        width={130}
                        height={34}
                        className="h-9 w-auto object-contain brightness-0 invert drop-shadow-lg"
                        priority
                    />
                </Link>
            </div>

            {/* Left: brand panel */}
            <div
                className="hidden lg:flex lg:w-[46%] xl:w-[50%] flex-col justify-between p-14 relative overflow-hidden"
                style={{
                    background: "linear-gradient(140deg, oklch(0.38 0.18 263) 0%, oklch(0.48 0.22 263) 50%, oklch(0.54 0.24 258) 100%)",
                }}
            >
                <div className="pointer-events-none absolute top-0 right-0 w-[600px] h-[600px] opacity-30 rounded-full"
                    style={{ background: "radial-gradient(circle, oklch(0.70 0.18 263) 0%, transparent 65%)", transform: "translate(25%,-25%)" }} />
                <div className="pointer-events-none absolute bottom-0 left-0 w-[400px] h-[400px] opacity-20 rounded-full"
                    style={{ background: "radial-gradient(circle, oklch(0.42 0.20 280) 0%, transparent 70%)", transform: "translate(-30%,30%)" }} />

                <div className="relative z-10 mt-4 space-y-8">
                    <div className="space-y-4">
                        <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight tracking-tight">
                            Dein KI-Dashboard.<br />
                            <span className="text-white/50">Alles automatisiert.</span>
                        </h1>
                        <p className="text-white/45 text-base leading-relaxed max-w-sm">
                            Verwalte KI-Workflows, generiere Leads und tracke
                            deine Performance — alles an einem Ort.
                        </p>
                    </div>

                    <div className="space-y-3">
                        {features.map(({ icon: Icon, label }) => (
                            <div key={label} className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-white/8 border border-white/12 flex items-center justify-center flex-shrink-0">
                                    <Icon className="h-4 w-4 text-white/75" />
                                </div>
                                <span className="text-sm text-white/65 font-medium">{label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <p className="relative z-10 text-white/25 text-xs">
                    &copy; {new Date().getFullYear()} KI Kanzlei. Alle Rechte vorbehalten.
                </p>
            </div>

            {/* Right: form */}
            <div className="flex-1 flex items-center justify-center p-6 bg-background relative overflow-hidden">
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full opacity-25"
                        style={{ background: "radial-gradient(circle, oklch(0.546 0.244 263 / 0.18) 0%, transparent 70%)" }} />
                </div>

                <div className="relative z-10 w-full max-w-sm">
                    <Card className="glass-panel border-white/60 shadow-2xl shadow-black/8 overflow-hidden">
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

                        <CardHeader className="pt-8 pb-5 px-7">
                            <CardTitle className="text-xl font-bold text-foreground">
                                Anmelden
                            </CardTitle>
                            <CardDescription className="text-muted-foreground">
                                Melde dich mit deinem KI-Kanzlei-Konto an
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="px-7 pb-5">
                            <LoginForm />
                        </CardContent>

                        <CardFooter className="flex flex-col gap-4 px-7 pb-7 pt-0">
                            <div className="flex items-center gap-3 w-full">
                                <Separator className="flex-1" />
                                <span className="text-xs text-muted-foreground/55 font-medium">Sicherer Login</span>
                                <Separator className="flex-1" />
                            </div>
                            <p className="text-center text-[11px] text-muted-foreground/50 leading-relaxed">
                                Nur für autorisierte Nutzer der KI Kanzlei.<br />
                                Probleme? Wende dich an deinen Administrator.
                            </p>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
}
