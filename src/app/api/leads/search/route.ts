/* ── API Route: POST /api/leads/search ──
 * Neue Lead-Suche starten: Erstellt einen SearchJob und startet die Enrichment Pipeline.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createSearchJob, getSearchJobs } from "@/lib/supabase/leads";
import { runEnrichmentPipeline } from "@/lib/enrichment/pipeline";

/* ── GET: Alle Search Jobs des Users abrufen ── */
export async function GET() {
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

    const jobs = await getSearchJobs();
    return NextResponse.json({ data: jobs });
  } catch (error) {
    console.error("[API GET /api/leads/search] Fehler:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 },
    );
  }
}

/* ── POST: Neue Suche starten ── */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Authentifizierung prüfen
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

    // Request-Body parsen und validieren
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

    // SearchJob in der Datenbank erstellen
    const searchJob = await createSearchJob({
      user_id: user.id,
      query: query.trim(),
      location: location.trim(),
      country,
    });

    // Enrichment Pipeline starten (fire-and-forget)
    runEnrichmentPipeline({
      jobId: searchJob.id,
      userId: user.id,
      query: query.trim(),
      location: location.trim(),
      country,
      companyType: company_type,
    }).catch((err) => {
      console.error(`[API] Pipeline-Fehler für Job ${searchJob.id}:`, err);
    });

    return NextResponse.json(
      { data: searchJob },
      { status: 201 },
    );
  } catch (error) {
    console.error("[API /api/leads/search] Fehler:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 },
    );
  }
}
