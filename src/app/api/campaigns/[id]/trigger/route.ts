/* ── API Route: POST /api/campaigns/[id]/trigger ──
 * Löst den n8n Webhook aus, um die Kampagne zu starten.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCampaignById, updateCampaign } from "@/lib/supabase/campaigns";
import { getUserSettings } from "@/lib/supabase/settings";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
    }

    const { id } = await params;
    const campaign = await getCampaignById(id, user.id);
    if (!campaign) {
      return NextResponse.json({ error: "Kampagne nicht gefunden" }, { status: 404 });
    }

    if (campaign.status !== "draft" && campaign.status !== "paused") {
      return NextResponse.json(
        { error: "Kampagne kann nur aus dem Status 'Entwurf' oder 'Pausiert' gestartet werden" },
        { status: 400 },
      );
    }

    const settings = await getUserSettings(user.id);
    const webhookUrl = settings?.n8n_webhook_url || process.env.N8N_WEBHOOK_URL;
    if (!webhookUrl) {
      return NextResponse.json(
        { error: "n8n Webhook URL nicht konfiguriert. Bitte unter Einstellungen eintragen." },
        { status: 400 },
      );
    }

    // n8n Webhook triggern
    const webhookRes = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        campaign_id: campaign.id,
        user_id: user.id,
      }),
    });

    if (!webhookRes.ok) {
      const errorText = await webhookRes.text().catch(() => "Unbekannter Fehler");
      return NextResponse.json(
        { error: `n8n Webhook fehlgeschlagen: ${errorText}` },
        { status: 502 },
      );
    }

    // Status auf active setzen + etwaige Fehlermeldung zurücksetzen
    const updated = await updateCampaign(id, { status: "active", error_message: null }, user.id);

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("[API /api/campaigns/[id]/trigger]", error);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}
