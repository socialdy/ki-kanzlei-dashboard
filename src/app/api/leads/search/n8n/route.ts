/* ── API Route: POST /api/leads/search/n8n ──
 * Startet eine Lead-Suche über den n8n Workflow (Webhook).
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createSearchJob } from "@/lib/supabase/leads";
import { getUserSettings } from "@/lib/supabase/settings";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Nicht authentifiziert" },
        { status: 401 },
      );
    }

    let body: { query?: string; location?: string; country?: string; company_type?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Ungültiger JSON-Body" },
        { status: 400 },
      );
    }

    const { query, location, country = "AT", company_type = "all" } = body;

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return NextResponse.json(
        { error: "Suchbegriff (query) ist erforderlich" },
        { status: 400 },
      );
    }

    if (!location || typeof location !== "string" || location.trim().length === 0) {
      return NextResponse.json(
        { error: "Standort (location) ist erforderlich" },
        { status: 400 },
      );
    }

    // n8n Webhook URL aus Settings oder ENV laden
    const settings = await getUserSettings(user.id);
    const baseWebhookUrl = settings?.n8n_webhook_url || process.env.N8N_WEBHOOK_URL;
    if (!baseWebhookUrl) {
      return NextResponse.json(
        { error: "n8n Webhook URL nicht konfiguriert. Bitte unter Einstellungen eintragen." },
        { status: 400 },
      );
    }

    // Lead-Search Webhook URL ableiten (gleiche Basis, anderer Pfad)
    // Outreach: .../webhook/ki-kanzlei-outreach
    // Search:   .../webhook/lead-search
    const searchWebhookUrl = baseWebhookUrl.replace(/\/webhook\/.*$/, "/webhook/lead-search");

    // SearchJob in der Datenbank erstellen
    const searchJob = await createSearchJob({
      user_id: user.id,
      query: query.trim(),
      location: location.trim(),
      country,
    });

    // n8n Webhook triggern
    const webhookRes = await fetch(searchWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        job_id: searchJob.id,
        user_id: user.id,
        query: query.trim(),
        location: location.trim(),
        country,
        company_type,
        supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabase_anon_key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        langsearch_api_key: process.env.LANGSEARCH_API_KEY,
      }),
    });

    if (!webhookRes.ok) {
      const errorText = await webhookRes.text().catch(() => "Unbekannter Fehler");

      // Job als fehlgeschlagen markieren
      await supabase
        .from("search_jobs")
        .update({ status: "failed", error_message: `n8n Webhook fehlgeschlagen: ${errorText}` })
        .eq("id", searchJob.id);

      return NextResponse.json(
        { error: `n8n Webhook fehlgeschlagen: ${errorText}` },
        { status: 502 },
      );
    }

    return NextResponse.json(
      { data: searchJob },
      { status: 201 },
    );
  } catch (error) {
    console.error("[API /api/leads/search/n8n] Fehler:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 },
    );
  }
}
