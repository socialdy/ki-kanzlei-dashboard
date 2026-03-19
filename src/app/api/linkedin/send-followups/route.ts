/* ── API Route: POST /api/linkedin/send-followups ── */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserSettings } from "@/lib/supabase/settings";
import { createUnipileClient } from "@/lib/unipile/client";
import {
  getLinkedInLeadsForFollowUp,
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

    const followUpDays = settings.linkedin_follow_up_days ?? 3;
    const leads = await getLinkedInLeadsForFollowUp(user.id, followUpDays);

    if (leads.length === 0) {
      return NextResponse.json({ data: { sent: 0, message: "Keine Follow-Ups fällig" } });
    }

    const client = createUnipileClient(settings.unipile_dsn, settings.unipile_api_key);
    let sent = 0;
    const errors: string[] = [];

    for (const lead of leads) {
      try {
        const identifier = lead.linkedin_id || lead.linkedin_url;
        const message = lead.follow_up_message || "Vielen Dank für die Vernetzung! Ich freue mich auf den Austausch.";

        await client.sendNewMessage(
          settings.unipile_account_id,
          identifier,
          message,
        );

        await updateLinkedInLeadStatus(lead.id, "messaged", {
          follow_up_sent_at: new Date().toISOString(),
        });
        sent++;

        if (sent < leads.length) {
          await randomDelay(3000, 6000);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unbekannter Fehler";
        await updateLinkedInLeadStatus(lead.id, "error", {
          error_message: msg,
        });
        errors.push(`${lead.full_name}: ${msg}`);
      }
    }

    return NextResponse.json({
      data: { sent, total: leads.length, errors },
    });
  } catch (error) {
    console.error("[API /api/linkedin/send-followups]", error);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}
