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
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/* ── Status Donut ── */

const statusDonutConfig: ChartConfig = {
  draft:     { label: "Entwurf",        color: "oklch(0.70 0.17 80)" },
  published: { label: "Veröffentlicht", color: "oklch(0.65 0.19 155)" },
  error:     { label: "Fehler",         color: "oklch(0.60 0.22 25)" },
};

interface StatusDonutProps {
  draft: number;
  published: number;
  error: number;
}

export function SeoStatusDonut({ draft, published, error }: StatusDonutProps) {
  const total = draft + published + error;
  const data = [
    { status: "draft", count: draft },
    { status: "published", count: published },
    { status: "error", count: error },
  ].filter((d) => d.count > 0);

  if (total === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Status-Verteilung</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
            Keine Posts vorhanden
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Status-Verteilung</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <ChartContainer config={statusDonutConfig} className="h-[200px] w-[200px] shrink-0">
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
                    fill={statusDonutConfig[entry.status]?.color ?? "oklch(0.80 0 0)"}
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
            {data.map((d) => (
              <div key={d.status} className="flex items-center gap-2 text-xs">
                <div
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ background: statusDonutConfig[d.status]?.color }}
                />
                <span className="text-muted-foreground truncate">
                  {(statusDonutConfig[d.status]?.label as string) ?? d.status}
                </span>
                <span className="ml-auto font-semibold tabular-nums">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Posts per Week (AreaChart) ── */

const postsPerWeekConfig: ChartConfig = {
  count: { label: "Posts", color: "oklch(0.546 0.244 263)" },
};

interface PostsPerWeekProps {
  data: { week: string; count: number }[];
}

export function SeoPostsPerWeekChart({ data }: PostsPerWeekProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Posts pro Woche</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
            Keine Daten vorhanden
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Posts pro Woche</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={postsPerWeekConfig} className="h-[200px] w-full">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="seoWeekGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-count)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="var(--color-count)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/50" />
            <XAxis
              dataKey="week"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
              width={28}
              allowDecimals={false}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              type="monotone"
              dataKey="count"
              stroke="var(--color-count)"
              strokeWidth={2}
              fill="url(#seoWeekGrad)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

/* ── Posts per Category (BarChart) ── */

const postsPerCategoryConfig: ChartConfig = {
  count: { label: "Posts", color: "oklch(0.546 0.244 263)" },
};

interface PostsPerCategoryProps {
  data: { category: string; count: number }[];
}

export function SeoPostsPerCategoryChart({ data }: PostsPerCategoryProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Posts pro Kategorie</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
            Keine Kategorien vorhanden
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Posts pro Kategorie</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={postsPerCategoryConfig} className="h-[200px] w-full">
          <BarChart data={data} layout="vertical" barGap={2}>
            <CartesianGrid horizontal={false} strokeDasharray="3 3" className="stroke-border/50" />
            <XAxis
              type="number"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
              allowDecimals={false}
            />
            <YAxis
              type="category"
              dataKey="category"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
              width={100}
              tickFormatter={(v: string) => v.length > 14 ? v.slice(0, 14) + "…" : v}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="count" fill="var(--color-count)" radius={[0, 4, 4, 0]} maxBarSize={24} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
