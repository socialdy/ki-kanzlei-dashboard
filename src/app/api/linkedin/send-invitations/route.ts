/* ── API Route: POST /api/linkedin/send-invitations ── */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserSettings } from "@/lib/supabase/settings";
import { createUnipileClient } from "@/lib/unipile/client";
import {
  getLinkedInLeadsForOutreach,
  updateLinkedInLeadStatus,
} from "@/lib/supabase/linkedin-leads";

function randomDelay(min: number, max: number) {
  return new Promise((resolve) =>
    setTimeout(resolve, min + Math.random() * (max - min)),
  );
}

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
    }

    const settings = await getUserSettings(user.id);
    if (!settings?.unipile_dsn || !settings?.unipile_api_key || !settings?.unipile_account_id) {
      return NextResponse.json(
        { error: "Unipile nicht konfiguriert" },
        { status: 400 },
      );
    }

    const dailyLimit = settings.linkedin_daily_limit ?? 25;
    const leads = await getLinkedInLeadsForOutreach(user.id, dailyLimit);

    if (leads.length === 0) {
      return NextResponse.json({ data: { sent: 0, message: "Keine Leads in der Queue" } });
    }

    const client = createUnipileClient(settings.unipile_dsn, settings.unipile_api_key);
    let sent = 0;
    const errors: string[] = [];

    for (const lead of leads) {
      try {
        const identifier = lead.linkedin_id || lead.linkedin_url;
        await client.sendInvitation(
          settings.unipile_account_id,
          identifier,
          lead.invite_message || undefined,
        );

        await updateLinkedInLeadStatus(lead.id, "invited", {
          connection_sent_at: new Date().toISOString(),
        });
        sent++;

        // Random delay 2-5 seconds between invitations
        if (sent < leads.length) {
          await randomDelay(2000, 5000);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unbekannter Fehler";
        const status = (err as { status?: number }).status;

        // 422 = LinkedIn weekly limit reached → stop immediately
        if (status === 422) {
          await updateLinkedInLeadStatus(lead.id, "error", {
            error_message: "LinkedIn-Einladungslimit erreicht",
          });
          errors.push(`${lead.full_name}: LinkedIn-Limit erreicht`);
          break;
        }

        await updateLinkedInLeadStatus(lead.id, "error", {
          error_message: message,
        });
        errors.push(`${lead.full_name}: ${message}`);
      }
    }

    return NextResponse.json({
      data: { sent, total: leads.length, errors },
    });
  } catch (error) {
    console.error("[API /api/linkedin/send-invitations]", error);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}
