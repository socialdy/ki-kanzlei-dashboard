"use client";

import { Share2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function SocialMediaPage() {
  return (
    <div className="px-4 lg:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Share2 className="h-6 w-6" />
            Social Media
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Social-Media-Kampagnen und Posts verwalten
          </p>
        </div>
        <Badge variant="secondary" className="text-[10px] font-semibold uppercase tracking-wide">
          Coming Soon
        </Badge>
      </div>

      {/* Placeholder */}
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 py-24">
        <Share2 className="h-12 w-12 text-muted-foreground/40 mb-4" />
        <h2 className="text-lg font-semibold text-muted-foreground">
          Modul in Entwicklung
        </h2>
        <p className="text-sm text-muted-foreground/70 mt-1 max-w-md text-center">
          Hier werden bald Social-Media-Posts, Kampagnen und Analytics verwaltet.
        </p>
      </div>
    </div>
  );
}
