import Link from "next/link";
import {
  Users, Send, TrendingUp,
  ArrowUpRight, MailOpen, Reply,
  CheckCircle2, Circle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DashboardGreeting } from "@/components/DashboardGreeting";
import {
  LeadStatusChart,
  CampaignBarChart,
  LeadsOverTimeChart,
} from "@/components/DashboardCharts";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";

const systemStatus = [
  { name: "Automatisierung", ok: true },
  { name: "E-Mail Server",   ok: true },
  { name: "Datenbank",       ok: true },
];

export default async function DashboardOverview() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  /* ── Lead Stats ── */
  const { count: totalLeads } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true });

  const { count: newLeads } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true })
    .eq("status", "new");

  const { count: enrichedLeads } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true })
    .eq("status", "enriched");

  const { count: contactedLeads } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true })
    .eq("status", "contacted");

  const { count: convertedLeads } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true })
    .eq("status", "converted");

  const { count: closedLeads } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true })
    .eq("status", "closed");

  /* ── Campaign Stats ── */
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id, name, status, total_count, sent_count, open_count, reply_count, bounce_count, failed_count")
    .order("created_at", { ascending: false })
    .limit(5);

  const allCampaigns = campaigns ?? [];

  const totalSent = allCampaigns.reduce((s, c) => s + (c.sent_count ?? 0), 0);
  const totalOpened = allCampaigns.reduce((s, c) => s + (c.open_count ?? 0), 0);
  const totalReplied = allCampaigns.reduce((s, c) => s + (c.reply_count ?? 0), 0);
  const totalBounced = allCampaigns.reduce((s, c) => s + (c.bounce_count ?? 0), 0);
  const activeCampaigns = allCampaigns.filter(c => c.status === "active").length;

  const openRate = totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : "0";
  const replyRate = totalSent > 0 ? ((totalReplied / totalSent) * 100).toFixed(1) : "0";

  /* ── Search Jobs ── */
  const { count: totalJobs } = await supabase
    .from("search_jobs")
    .select("*", { count: "exact", head: true });

  /* ── Leads over time (last 7 days) ── */
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const { data: recentLeads } = await supabase
    .from("leads")
    .select("created_at")
    .gte("created_at", sevenDaysAgo.toISOString())
    .order("created_at", { ascending: true });

  const leadsOverTime: { date: string; leads: number }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - 6 + i);
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("de-AT", { day: "2-digit", month: "2-digit" });
    const count = (recentLeads ?? []).filter(
      (l) => l.created_at?.slice(0, 10) === key
    ).length;
    leadsOverTime.push({ date: label, leads: count });
  }

  /* ── Display name ── */
  const displayName = (user?.user_metadata?.full_name as string | null)
    ?? (user?.user_metadata?.name as string | null)
    ?? user?.email?.split("@")[0]
    ?? "Willkommen";

  /* ── Lead Status data for donut ── */
  const leadStatusData = [
    { status: "new",        count: newLeads ?? 0 },
    { status: "enriched",   count: enrichedLeads ?? 0 },
    { status: "contacted",  count: contactedLeads ?? 0 },
    { status: "converted",  count: convertedLeads ?? 0 },
    { status: "closed",     count: closedLeads ?? 0 },
  ].filter(d => d.count > 0);

  /* ── Campaign bar data ── */
  const campaignBarData = allCampaigns
    .filter(c => c.sent_count > 0)
    .slice(0, 5)
    .map(c => ({
      name: c.name,
      sent: c.sent_count ?? 0,
      opened: c.open_count ?? 0,
      replied: c.reply_count ?? 0,
      bounced: c.bounce_count ?? 0,
    }));

  /* ── KPI cards ── */
  const kpis = [
    {
      label: "Leads gesamt",
      value: (totalLeads ?? 0).toLocaleString("de-DE"),
      change: `+${newLeads ?? 0} neu`,
      changePositive: true,
      Icon: Users,
      color: "text-primary",
      accent: "bg-primary",
    },
    {
      label: "E-Mails gesendet",
      value: totalSent.toLocaleString("de-DE"),
      change: `${activeCampaigns} aktiv`,
      changePositive: true,
      Icon: Send,
      color: "text-violet-600",
      accent: "bg-violet-500",
    },
    {
      label: "Open Rate",
      value: `${openRate}%`,
      change: `${totalOpened} geöffnet`,
      changePositive: Number(openRate) > 0,
      Icon: MailOpen,
      color: "text-amber-600",
      accent: "bg-amber-500",
    },
    {
      label: "Reply Rate",
      value: `${replyRate}%`,
      change: `${totalReplied} Antworten`,
      changePositive: Number(replyRate) > 0,
      Icon: Reply,
      color: "text-emerald-600",
      accent: "bg-emerald-500",
    },
  ];

  return (
    <div className="space-y-8">

      {/* ── Header ── */}
      <div className="space-y-1.5">
        <DashboardGreeting name={displayName} />
        <p className="text-sm text-muted-foreground pl-9">
          KI Kanzlei Lead Dashboard — Finde, qualifiziere und kontaktiere potenzielle Kunden vollautomatisch.
        </p>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, value, change, changePositive, Icon, color, accent }) => (
          <Card key={label} className="relative overflow-hidden">
            <div className={cn("absolute top-0 left-0 w-1 h-full rounded-r-full", accent)} />
            <CardContent className="p-5 pl-6">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">{label}</p>
                <Icon className={cn("h-4 w-4", color)} />
              </div>
              <div className="mt-2">
                <span className="text-2xl font-bold tabular-nums">{value}</span>
              </div>
              <p className={cn(
                "text-[11px] font-medium mt-1",
                changePositive ? "text-emerald-600" : "text-muted-foreground"
              )}>
                {change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Neue Leads (letzte 7 Tage)</CardTitle>
            <CardDescription className="text-xs">
              {(recentLeads ?? []).length} Leads in der letzten Woche
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LeadsOverTimeChart data={leadsOverTime} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Lead-Status Verteilung</CardTitle>
            <CardDescription className="text-xs">
              Aktuelle Aufteilung aller {totalLeads ?? 0} Leads
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LeadStatusChart data={leadStatusData} />
          </CardContent>
        </Card>
      </div>

      {/* ── Campaign Performance + System ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">Kampagnen-Performance</CardTitle>
                <CardDescription className="text-xs">
                  Letzte {campaignBarData.length} Kampagnen im Vergleich
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="text-xs gap-1.5" asChild>
                <Link href="/dashboard/campaigns">
                  Alle anzeigen
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <CampaignBarChart data={campaignBarData} />
          </CardContent>
        </Card>

        {/* System Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">System Status</CardTitle>
            <CardDescription className="text-xs">
              Dienste und Infrastruktur
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {systemStatus.map(({ name, ok }) => (
              <div key={name} className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{name}</span>
                <div className="flex items-center gap-1.5">
                  {ok
                    ? <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    : <Circle className="h-3 w-3 text-destructive" />
                  }
                  <span className={cn("text-[10px] font-medium", ok ? "text-emerald-600" : "text-destructive")}>
                    {ok ? "Online" : "Offline"}
                  </span>
                </div>
              </div>
            ))}

            <Separator className="my-2" />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Leads</span>
                <Badge variant="secondary" className="text-[10px] font-semibold">{totalLeads ?? 0}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Kampagnen</span>
                <Badge variant="secondary" className="text-[10px] font-semibold">{allCampaigns.length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Suchaufträge</span>
                <Badge variant="secondary" className="text-[10px] font-semibold">{totalJobs ?? 0}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Recent Campaigns ── */}
      {allCampaigns.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">Letzte Kampagnen</CardTitle>
                <CardDescription className="text-xs">
                  Deine neuesten Kampagnen auf einen Blick
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="text-xs gap-1.5" asChild>
                <Link href="/dashboard/campaigns">
                  Alle anzeigen
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="p-0">
            <div className="divide-y">
              {allCampaigns.slice(0, 5).map((c) => {
                const cOpenRate = c.sent_count > 0 ? ((c.open_count / c.sent_count) * 100).toFixed(1) : "0";
                const cReplyRate = c.sent_count > 0 ? ((c.reply_count / c.sent_count) * 100).toFixed(1) : "0";
                const statusCfg: Record<string, { label: string; cls: string }> = {
                  draft:     { label: "Entwurf",  cls: "bg-zinc-100 text-zinc-600" },
                  active:    { label: "Aktiv",    cls: "bg-emerald-50 text-emerald-700" },
                  paused:    { label: "Pausiert", cls: "bg-amber-50 text-amber-700" },
                  completed: { label: "Fertig",   cls: "bg-blue-50 text-blue-700" },
                };
                const st = statusCfg[c.status] ?? statusCfg.draft;

                return (
                  <Link
                    key={c.id}
                    href={`/dashboard/campaigns/${c.id}`}
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Badge variant="secondary" className={cn("text-[10px] font-medium px-2 py-0.5 shrink-0", st.cls)}>
                        {st.label}
                      </Badge>
                      <span className="text-sm font-medium truncate">{c.name}</span>
                    </div>
                    <div className="flex items-center gap-5 shrink-0">
                      <div className="text-right">
                        <p className="text-xs font-medium tabular-nums">{c.sent_count}/{c.total_count}</p>
                        <p className="text-[10px] text-muted-foreground">Gesendet</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium tabular-nums text-amber-600">{cOpenRate}%</p>
                        <p className="text-[10px] text-muted-foreground">Open</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium tabular-nums text-emerald-600">{cReplyRate}%</p>
                        <p className="text-[10px] text-muted-foreground">Reply</p>
                      </div>
                      <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/50" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
