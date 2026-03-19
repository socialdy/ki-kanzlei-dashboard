/* ── API Route: GET /api/linkedin/stats ── */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getLinkedInLeadStats } from "@/lib/supabase/linkedin-leads";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
    }

    const stats = await getLinkedInLeadStats(user.id);
    return NextResponse.json({ data: stats });
  } catch (error) {
    console.error("[API /api/linkedin/stats]", error);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}
