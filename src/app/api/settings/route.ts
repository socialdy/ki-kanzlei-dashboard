/* ── API Route: GET + PATCH /api/settings ── */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserSettings, upsertUserSettings } from "@/lib/supabase/settings";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
    }

    const settings = await getUserSettings(user.id);
    return NextResponse.json({ data: settings });
  } catch (error) {
    console.error("[API /api/settings GET]", error);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
    }

    const body = await request.json();
    const { n8n_webhook_url, gemini_api_key } = body;

    const settings = await upsertUserSettings(user.id, {
      n8n_webhook_url: n8n_webhook_url ?? undefined,
      gemini_api_key: gemini_api_key ?? undefined,
    });

    return NextResponse.json({ data: settings });
  } catch (error) {
    console.error("[API /api/settings PATCH]", error);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}
