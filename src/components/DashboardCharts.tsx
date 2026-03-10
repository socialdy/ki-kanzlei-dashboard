"use client";

import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  Area,
  AreaChart,
  Pie,
  PieChart,
  Cell,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

/* ── Lead Status Donut ── */
const leadStatusConfig: ChartConfig = {
  new:        { label: "Neu",          color: "oklch(0.65 0.20 250)" },
  enriched:   { label: "Angereichert", color: "oklch(0.65 0.17 160)" },
  contacted:  { label: "Kontaktiert",  color: "oklch(0.70 0.15 55)" },
  converted:  { label: "Konvertiert",  color: "oklch(0.60 0.19 145)" },
  closed:     { label: "Geschlossen",  color: "oklch(0.55 0.02 250)" },
};

interface LeadStatusChartProps {
  data: { status: string; count: number }[];
}

export function LeadStatusChart({ data }: LeadStatusChartProps) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
        Keine Leads vorhanden
      </div>
    );
  }

  return (
    <div className="flex items-center gap-6">
      <ChartContainer config={leadStatusConfig} className="h-[200px] w-[200px] shrink-0">
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent />} />
          <Pie
            data={data}
            dataKey="count"
            nameKey="status"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={2}
            strokeWidth={0}
          >
            {data.map((entry) => (
              <Cell
                key={entry.status}
                fill={leadStatusConfig[entry.status]?.color ?? "oklch(0.80 0 0)"}
              />
            ))}
          </Pie>
          <text x="50%" y="48%" textAnchor="middle" className="fill-foreground text-2xl font-bold">
            {total}
          </text>
          <text x="50%" y="60%" textAnchor="middle" className="fill-muted-foreground text-[11px]">
            Gesamt
          </text>
        </PieChart>
      </ChartContainer>
      <div className="flex flex-col gap-1.5 min-w-0">
        {data.filter(d => d.count > 0).map((d) => (
          <div key={d.status} className="flex items-center gap-2 text-xs">
            <div
              className="h-2.5 w-2.5 rounded-full shrink-0"
              style={{ background: leadStatusConfig[d.status]?.color }}
            />
            <span className="text-muted-foreground truncate">
              {(leadStatusConfig[d.status]?.label as string) ?? d.status}
            </span>
            <span className="ml-auto font-semibold tabular-nums">{d.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Campaign Performance Bar Chart ── */
const campaignBarConfig: ChartConfig = {
  sent:    { label: "Gesendet", color: "oklch(0.55 0.20 263)" },
  opened:  { label: "Geöffnet", color: "oklch(0.70 0.15 55)" },
  replied: { label: "Antwort",  color: "oklch(0.60 0.19 145)" },
  bounced: { label: "Bounce",   color: "oklch(0.65 0.15 25)" },
};

interface CampaignBarData {
  name: string;
  sent: number;
  opened: number;
  replied: number;
  bounced: number;
}

export function CampaignBarChart({ data }: { data: CampaignBarData[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[240px] text-sm text-muted-foreground">
        Keine Kampagnen vorhanden
      </div>
    );
  }

  return (
    <ChartContainer config={campaignBarConfig} className="h-[240px] w-full">
      <BarChart data={data} barGap={2}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/50" />
        <XAxis
          dataKey="name"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
          interval={0}
          tickFormatter={(v: string) => v.length > 12 ? v.slice(0, 12) + "…" : v}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
          width={32}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="sent" fill="var(--color-sent)" radius={[4, 4, 0, 0]} maxBarSize={32} />
        <Bar dataKey="opened" fill="var(--color-opened)" radius={[4, 4, 0, 0]} maxBarSize={32} />
        <Bar dataKey="replied" fill="var(--color-replied)" radius={[4, 4, 0, 0]} maxBarSize={32} />
        <Bar dataKey="bounced" fill="var(--color-bounced)" radius={[4, 4, 0, 0]} maxBarSize={32} />
      </BarChart>
    </ChartContainer>
  );
}

/* ── Leads over time Area Chart ── */
const leadsOverTimeConfig: ChartConfig = {
  leads: { label: "Neue Leads", color: "oklch(0.546 0.244 263)" },
};

interface LeadsOverTimeData {
  date: string;
  leads: number;
}

export function LeadsOverTimeChart({ data }: { data: LeadsOverTimeData[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
        Keine Daten vorhanden
      </div>
    );
  }

  return (
    <ChartContainer config={leadsOverTimeConfig} className="h-[200px] w-full">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="leadsGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-leads)" stopOpacity={0.3} />
            <stop offset="100%" stopColor="var(--color-leads)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/50" />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
          width={28}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area
          type="monotone"
          dataKey="leads"
          stroke="var(--color-leads)"
          strokeWidth={2}
          fill="url(#leadsGrad)"
        />
      </AreaChart>
    </ChartContainer>
  );
}
