/* ── Cron Route: GET /api/cron/linkedin-followups ── */
/* Vercel Cron: Mo-Fr 10:00 UTC — sends follow-up messages for all auto_outreach users */

import { NextRequest, NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/cron-auth";
import { getAllAutoOutreachUsers } from "@/lib/supabase/settings";
import {
  adminGetLinkedInLeadsForFollowUp,
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
      const followUpDays = settings.linkedin_follow_up_days ?? 3;
      let sent = 0;
      const errors: string[] = [];

      try {
        const leads = await adminGetLinkedInLeadsForFollowUp(userId, followUpDays);
        if (leads.length === 0) {
          results.push({ userId, sent: 0, errors: [] });
          continue;
        }

        const client = createUnipileClient(settings.unipile_dsn!, settings.unipile_api_key!);

        for (const lead of leads) {
          try {
            const identifier = lead.linkedin_id || lead.linkedin_url;
            const message = lead.follow_up_message || "Vielen Dank für die Vernetzung! Ich freue mich auf den Austausch.";

            await client.sendNewMessage(
              settings.unipile_account_id!,
              identifier,
              message,
            );

            await adminUpdateLinkedInLeadStatus(lead.id, "messaged", {
              follow_up_sent_at: new Date().toISOString(),
            });
            sent++;

            if (sent < leads.length) {
              await randomDelay(3000, 6000);
            }
          } catch (err) {
            const msg = err instanceof Error ? err.message : "Unbekannter Fehler";
            await adminUpdateLinkedInLeadStatus(lead.id, "error", {
              error_message: msg,
            });
            errors.push(`${lead.full_name}: ${msg}`);
          }
        }
      } catch (err) {
        errors.push(err instanceof Error ? err.message : "Unbekannter Fehler");
      }

      results.push({ userId, sent, errors });
    }

    console.log("[Cron linkedin-followups]", JSON.stringify(results));
    return NextResponse.json({ ok: true, results });
  } catch (error) {
    console.error("[Cron linkedin-followups]", error);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}
