"use client";

import { Users, UserPlus, MessageSquare, Reply } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { LinkedInLeadStats } from "@/types/linkedin";

interface LinkedInStatsCardsProps {
  stats: LinkedInLeadStats;
  loading?: boolean;
}

function pct(count: number, total: number): string {
  if (total === 0) return "0%";
  return `${((count / total) * 100).toFixed(1)}%`;
}

export function LinkedInStatsCards({ stats, loading }: LinkedInStatsCardsProps) {
  const cards = [
    {
      label: "Gesamt",
      value: stats.total,
      sub: `${stats.new + stats.analyzed} neu`,
      icon: Users,
      color: "text-zinc-600",
      bg: "bg-zinc-100",
    },
    {
      label: "Eingeladen",
      value: stats.invited + stats.accepted + stats.messaged + stats.replied,
      sub: pct(stats.invited + stats.accepted + stats.messaged + stats.replied, stats.total),
      icon: UserPlus,
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      label: "Akzeptiert",
      value: stats.accepted + stats.messaged + stats.replied,
      sub: pct(stats.accepted + stats.messaged + stats.replied, stats.invited + stats.accepted + stats.messaged + stats.replied || 1),
      icon: MessageSquare,
      color: "text-emerald-600",
      bg: "bg-emerald-100",
    },
    {
      label: "Antworten",
      value: stats.replied,
      sub: pct(stats.replied, stats.messaged + stats.replied || 1),
      icon: Reply,
      color: "text-green-600",
      bg: "bg-green-100",
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
