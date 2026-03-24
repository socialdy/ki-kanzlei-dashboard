/* ── Cron Route: GET /api/cron/linkedin-invitations ── */
/* Vercel Cron: Mo-Fr 8:00 UTC — sends LinkedIn invitations for all auto_outreach users */

import { NextRequest, NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/cron-auth";
import { getAllAutoOutreachUsers } from "@/lib/supabase/settings";
import {
  adminGetLinkedInLeadsForOutreach,
  adminUpdateLinkedInLeadStatus,
} from "@/lib/supabase/linkedin-leads";
import { createUnipileClient } from "@/lib/unipile/client";

function randomDelay(min: number, max: number) {
  return new Promise((resolve) =>
    setTimeout(resolve, min + Math.random() * (max - min)),
  );
}

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const users = await getAllAutoOutreachUsers();
    const results: { userId: string; sent: number; errors: string[] }[] = [];

    for (const settings of users) {
      const userId = settings.user_id;
      const dailyLimit = settings.linkedin_daily_limit ?? 25;
      let sent = 0;
      const errors: string[] = [];

      try {
        const leads = await adminGetLinkedInLeadsForOutreach(userId, dailyLimit);
        if (leads.length === 0) {
          results.push({ userId, sent: 0, errors: [] });
          continue;
        }

        const client = createUnipileClient(settings.unipile_dsn!, settings.unipile_api_key!);

        for (const lead of leads) {
          try {
            const identifier = lead.linkedin_id || lead.linkedin_url;
            await client.sendInvitation(
              settings.unipile_account_id!,
              identifier,
              lead.invite_message || undefined,
            );

            await adminUpdateLinkedInLeadStatus(lead.id, "invited", {
              connection_sent_at: new Date().toISOString(),
            });
            sent++;

            if (sent < leads.length) {
              await randomDelay(2000, 5000);
            }
          } catch (err) {
            const message = err instanceof Error ? err.message : "Unbekannter Fehler";
            const status = (err as { status?: number }).status;

            if (status === 422) {
              await adminUpdateLinkedInLeadStatus(lead.id, "error", {
                error_message: "LinkedIn-Einladungslimit erreicht",
              });
              errors.push(`${lead.full_name}: LinkedIn-Limit erreicht`);
              break;
            }

            await adminUpdateLinkedInLeadStatus(lead.id, "error", {
              error_message: message,
            });
            errors.push(`${lead.full_name}: ${message}`);
          }
        }
      } catch (err) {
        errors.push(err instanceof Error ? err.message : "Unbekannter Fehler");
      }

      results.push({ userId, sent, errors });
    }

    console.log("[Cron linkedin-invitations]", JSON.stringify(results));
    return NextResponse.json({ ok: true, results });
  } catch (error) {
    console.error("[Cron linkedin-invitations]", error);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}
