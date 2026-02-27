import {
    Users, Mail, Clock, TrendingUp,
    ArrowUpRight, FileText,
    CheckCircle2, Circle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DashboardGreeting } from "@/components/DashboardGreeting";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";

const systemStatus = [
    { name: "n8n Backend",   ok: true },
    { name: "E-Mail Server", ok: true },
    { name: "Supabase DB",   ok: true },
];

export default async function DashboardOverview() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    // Echte Lead-Statistiken
    const { count: totalLeads } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true });

    const { count: newLeads } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("status", "new");

    const { count: totalJobs } = await supabase
        .from("search_jobs")
        .select("*", { count: "exact", head: true });

    const { count: completedJobs } = await supabase
        .from("search_jobs")
        .select("*", { count: "exact", head: true })
        .eq("status", "completed");

    const displayName = (user?.user_metadata?.full_name as string | null)
        ?? (user?.user_metadata?.name as string | null)
        ?? user?.email?.split("@")[0]
        ?? "Willkommen";

    const stats = [
        {
            name: "Leads gesamt",
            value: (totalLeads ?? 0).toLocaleString("de-DE"),
            sub: `${newLeads ?? 0} neu`,
            Icon: Users,
            iconBg: "bg-primary/8",
            iconColor: "text-primary",
        },
        {
            name: "Suchaufträge",
            value: (totalJobs ?? 0).toLocaleString("de-DE"),
            sub: `${completedJobs ?? 0} abgeschlossen`,
            Icon: TrendingUp,
            iconBg: "bg-emerald-50",
            iconColor: "text-emerald-600",
        },
        {
            name: "E-Mails",
            value: "--",
            sub: "Noch nicht konfiguriert",
            Icon: Mail,
            iconBg: "bg-violet-50",
            iconColor: "text-violet-600",
        },
        {
            name: "Aut. Stunden",
            value: "--",
            sub: "Noch nicht konfiguriert",
            Icon: Clock,
            iconBg: "bg-amber-50",
            iconColor: "text-amber-600",
        },
    ];

    return (
        <div className="space-y-7">

            {/* ── Greeting ── */}
            <DashboardGreeting name={displayName} />

            {/* ── Stats ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map(({ name, value, sub, Icon, iconBg, iconColor }) => (
                    <Card
                        key={name}
                        className="glass-panel border-white/80 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 cursor-default"
                    >
                        <CardContent className="p-5">
                            <div className="flex items-start justify-between mb-4">
                                <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center", iconBg)}>
                                    <Icon className={cn("h-5 w-5", iconColor)} />
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-foreground mb-0.5">{value}</div>
                            <div className="text-xs font-medium text-muted-foreground">{name}</div>
                            <div className="text-[10px] text-muted-foreground/55 mt-0.5">{sub}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* ── Bottom row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                {/* Schnellaktionen */}
                <Card className="lg:col-span-3 glass-panel border-white/80">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-sm font-bold">Schnellstart</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <div className="h-12 w-12 rounded-xl bg-primary/8 flex items-center justify-center mb-3">
                                <Users className="h-6 w-6 text-primary" />
                            </div>
                            <p className="text-sm font-semibold text-foreground mb-1">Starte deine erste Suche</p>
                            <p className="text-xs text-muted-foreground max-w-xs">
                                Gehe zu <span className="font-medium text-primary">Leads</span> und suche nach Unternehmen in deiner Zielbranche.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* System Status */}
                <Card className="lg:col-span-2 glass-panel border-white/80">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-sm font-bold">System Status</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="space-y-2.5">
                            {systemStatus.map(({ name, ok }) => (
                                <div key={name} className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">{name}</span>
                                    <div className="flex items-center gap-1.5">
                                        {ok
                                            ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                            : <Circle className="h-3.5 w-3.5 text-destructive" />
                                        }
                                        <span className={cn("text-[10px] font-semibold", ok ? "text-emerald-600" : "text-destructive")}>
                                            {ok ? "Online" : "Offline"}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <Separator className="my-4 bg-border/50" />

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">Leads gesamt</span>
                                <Badge variant="secondary" className="text-[10px] font-semibold">{totalLeads ?? 0}</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">Neue Leads</span>
                                <Badge variant="secondary" className="text-[10px] font-semibold">{newLeads ?? 0}</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">Suchaufträge</span>
                                <Badge variant="secondary" className="text-[10px] font-semibold">{totalJobs ?? 0}</Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
