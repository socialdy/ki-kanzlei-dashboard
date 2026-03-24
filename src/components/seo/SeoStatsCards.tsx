"use client";

import { FileText, CheckCircle, AlertCircle, LetterText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { SeoPostStats } from "@/types/seo";

interface SeoStatsCardsProps {
  stats: SeoPostStats;
  loading?: boolean;
}

export function SeoStatsCards({ stats, loading }: SeoStatsCardsProps) {
  const cards = [
    {
      label: "Gesamt",
      value: stats.total,
      sub: `${stats.categories.length} Kategorien`,
      icon: FileText,
      color: "text-zinc-600",
      bg: "bg-zinc-100",
    },
    {
      label: "Veröffentlicht",
      value: stats.published,
      sub: stats.total > 0 ? `${((stats.published / stats.total) * 100).toFixed(0)}%` : "0%",
      icon: CheckCircle,
      color: "text-emerald-600",
      bg: "bg-emerald-100",
    },
    {
      label: "Entwürfe",
      value: stats.draft,
      sub: stats.total > 0 ? `${((stats.draft / stats.total) * 100).toFixed(0)}%` : "0%",
      icon: AlertCircle,
      color: "text-amber-600",
      bg: "bg-amber-100",
    },
    {
      label: "Wörter gesamt",
      value: stats.total_words.toLocaleString("de-DE"),
      sub: stats.total > 0 ? `Ø ${Math.round(stats.total_words / stats.total).toLocaleString("de-DE")}` : "—",
      icon: LetterText,
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map((card) => (
        <Card key={card.label} className="shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`h-9 w-9 rounded-lg ${card.bg} flex items-center justify-center`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{card.label}</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-bold tabular-nums">
                    {loading ? "—" : card.value}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {loading ? "" : card.sub}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
