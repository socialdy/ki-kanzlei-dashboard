/* ── API Route: GET /api/linkedin/filters ── */
/* Returns distinct industries and locations for filter dropdowns */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getDistinctLinkedInIndustries,
  getDistinctLinkedInLocations,
} from "@/lib/supabase/linkedin-leads";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
    }

    const [industries, locations] = await Promise.all([
      getDistinctLinkedInIndustries(user.id),
      getDistinctLinkedInLocations(user.id),
    ]);

    return NextResponse.json({ data: { industries, locations } });
  } catch (error) {
    console.error("[API /api/linkedin/filters]", error);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}
