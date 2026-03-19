"use client";

import { Badge } from "@/components/ui/badge";
import { LINKEDIN_STATUS_CONFIG, type LinkedInLeadStatus } from "@/types/linkedin";

interface LinkedInStatusBadgeProps {
  status: LinkedInLeadStatus;
  className?: string;
}

export function LinkedInStatusBadge({ status, className }: LinkedInStatusBadgeProps) {
  const config = LINKEDIN_STATUS_CONFIG[status];

  return (
    <Badge
      variant="secondary"
      className={`text-[11px] font-medium px-2 py-0.5 gap-1.5 ${config.className} ${className ?? ""}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${config.dot}`} />
      {config.label}
    </Badge>
  );
}
