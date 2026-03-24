/* ── API Route: POST /api/linkedin/search ── */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserSettings } from "@/lib/supabase/settings";
import { createUnipileClient } from "@/lib/unipile/client";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
    }

    const settings = await getUserSettings(user.id);
    if (!settings?.unipile_dsn || !settings?.unipile_api_key || !settings?.unipile_account_id) {
      return NextResponse.json(
        { error: "Unipile nicht konfiguriert. Bitte in den Einstellungen einrichten." },
        { status: 400 },
      );
    }

    const { query, location, cursor, api } = await request.json();
    if (!query?.trim()) {
      return NextResponse.json({ error: "Suchbegriff fehlt" }, { status: 400 });
    }

    const client = createUnipileClient(settings.unipile_dsn, settings.unipile_api_key);
    const accountId = settings.unipile_account_id!;

    // Resolve location text → numeric IDs
    let locationIds: string[] | undefined;
    if (location?.trim()) {
      try {
        const items = await client.searchParameters(
          accountId, "LOCATION", location.trim(), 5,
        );
        locationIds = items.length > 0 ? items.map((i) => String(i.id)) : undefined;
      } catch { /* ignore */ }
    }

    console.log("[API /api/linkedin/search] Resolved locationIds:", locationIds);

    let results;
    try {
      results = await client.searchLinkedIn(accountId, query.trim(), {
        locationIds,
        cursor: cursor || undefined,
        api: api || "classic",
      });
    } catch (unipileError) {
      console.error("[API /api/linkedin/search] Unipile error:", unipileError);
      const msg = unipileError instanceof Error ? unipileError.message : "Unipile-Fehler";
      const status = (unipileError as { status?: number }).status ?? 502;
      return NextResponse.json({ error: msg }, { status });
    }

    return NextResponse.json({
      data: {
        items: results.items ?? [],
        cursor: results.cursor ?? null,
        paging: results.paging ?? null,
      },
    });
  } catch (error) {
    console.error("[API /api/linkedin/search] Internal error:", error);
    const message = error instanceof Error ? error.message : "Interner Serverfehler";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
