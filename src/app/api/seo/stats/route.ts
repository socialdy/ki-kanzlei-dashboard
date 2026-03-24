/* ── API Route: GET /api/seo/stats ── */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSeoPostStats } from "@/lib/supabase/seo";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
    }

    const stats = await getSeoPostStats(user.id);
    return NextResponse.json(stats);
  } catch (error) {
    console.error("[API /api/seo/stats]", error);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}
