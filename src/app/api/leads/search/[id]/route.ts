/* ── API Route: GET /api/leads/search/[id] ──
 * Status eines SearchJobs abrufen (für Client-seitiges Polling).
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSearchJobById, updateSearchJobStatus } from "@/lib/supabase/leads";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
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

    // UUID-Format validieren
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: "Ungültige Job-ID" },
        { status: 400 },
      );
    }

    // SearchJob aus der Datenbank abrufen
    const searchJob = await getSearchJobById(id);

    if (!searchJob) {
      return NextResponse.json(
        { error: "SearchJob nicht gefunden" },
        { status: 404 },
      );
    }

    // Sicherstellen, dass der Job dem User gehört
    if (searchJob.user_id !== user.id) {
      return NextResponse.json(
        { error: "Zugriff verweigert" },
        { status: 403 },
      );
    }

    return NextResponse.json({ data: searchJob });
  } catch (error) {
    console.error("[API /api/leads/search/[id]] Fehler:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 },
    );
  }
}

/* ── PATCH: SearchJob-Status aktualisieren (z.B. Timeout) ── */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
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

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: "Ungültige Job-ID" },
        { status: 400 },
      );
    }

    const searchJob = await getSearchJobById(id);
    if (!searchJob) {
      return NextResponse.json(
        { error: "SearchJob nicht gefunden" },
        { status: 404 },
      );
    }

    if (searchJob.user_id !== user.id) {
      return NextResponse.json(
        { error: "Zugriff verweigert" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { status, error_message } = body;

    if (!status || !["failed", "completed"].includes(status)) {
      return NextResponse.json(
        { error: "Ungültiger Status" },
        { status: 400 },
      );
    }

    const updated = await updateSearchJobStatus(id, status, {
      error_message: error_message ?? null,
      completed_at: new Date().toISOString(),
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("[API PATCH /api/leads/search/[id]] Fehler:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 },
    );
  }
}
