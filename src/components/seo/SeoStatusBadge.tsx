"use client";

import { Badge } from "@/components/ui/badge";
import { SEO_STATUS_CONFIG, type SeoPostStatus } from "@/types/seo";

interface SeoStatusBadgeProps {
  status: SeoPostStatus;
}

export function SeoStatusBadge({ status }: SeoStatusBadgeProps) {
  const config = SEO_STATUS_CONFIG[status];
  return (
    <Badge variant="outline" className={`text-[11px] font-medium gap-1.5 ${config.className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </Badge>
  );
}
