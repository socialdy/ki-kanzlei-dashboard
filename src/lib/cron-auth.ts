/* ── Cron Job Authentication ── */

import { NextRequest } from "next/server";

export function verifyCronSecret(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("[Cron Auth] CRON_SECRET env variable not set");
    return false;
  }

  // Vercel sends this header for cron jobs
  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${secret}`) return true;

  return false;
}
