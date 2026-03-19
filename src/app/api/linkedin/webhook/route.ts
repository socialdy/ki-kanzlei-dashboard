/* ── API Route: POST /api/linkedin/webhook ── */
/* Unipile Webhook receiver for new_message / new_relation events */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, data } = body;

    if (!event || !data) {
      return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
    }

    const admin = getSupabaseAdmin();

    if (event === "new_relation" || event === "connection_accepted") {
      // A connection was accepted — find matching lead by linkedin_id
      const providerId = data.provider_id || data.user_provider_id;
      if (!providerId) {
        return NextResponse.json({ ok: true, skipped: "no provider_id" });
      }

      const { data: leads } = await admin
        .from("linkedin_leads")
        .select("id")
        .eq("linkedin_id", providerId)
        .eq("status", "invited");

      if (leads && leads.length > 0) {
        await admin
          .from("linkedin_leads")
          .update({
            status: "accepted",
            connection_accepted_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", leads[0].id);
      }

      return NextResponse.json({ ok: true, matched: leads?.length ?? 0 });
    }

    if (event === "new_message") {
      // A message was received — check if sender is an invited/accepted lead
      const senderProviderId = data.sender_provider_id || data.from_provider_id;
      if (!senderProviderId) {
        return NextResponse.json({ ok: true, skipped: "no sender_id" });
      }

      const { data: leads } = await admin
        .from("linkedin_leads")
        .select("id, status")
        .eq("linkedin_id", senderProviderId)
        .in("status", ["invited", "accepted", "messaged"]);

      if (leads && leads.length > 0) {
        const lead = leads[0];
        const updates: Record<string, unknown> = {
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        if (lead.status === "invited") {
          updates.status = "accepted";
          updates.connection_accepted_at = new Date().toISOString();
        } else if (lead.status === "messaged" || lead.status === "accepted") {
          updates.status = "replied";
        }

        await admin
          .from("linkedin_leads")
          .update(updates)
          .eq("id", lead.id);
      }

      return NextResponse.json({ ok: true, matched: leads?.length ?? 0 });
    }

    return NextResponse.json({ ok: true, skipped: `unknown event: ${event}` });
  } catch (error) {
    console.error("[API /api/linkedin/webhook]", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
