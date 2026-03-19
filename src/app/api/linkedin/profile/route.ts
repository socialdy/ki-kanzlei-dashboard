/* ── API Route: POST /api/linkedin/profile ── */

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
        { error: "Unipile nicht konfiguriert" },
        { status: 400 },
      );
    }

    const { identifier } = await request.json();
    if (!identifier?.trim()) {
      return NextResponse.json({ error: "Profil-Identifier fehlt" }, { status: 400 });
    }

    const client = createUnipileClient(settings.unipile_dsn, settings.unipile_api_key);
    const profile = await client.getProfile(settings.unipile_account_id, identifier.trim());

    return NextResponse.json({ data: profile });
  } catch (error) {
    console.error("[API /api/linkedin/profile]", error);
    const message = error instanceof Error ? error.message : "Interner Serverfehler";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
