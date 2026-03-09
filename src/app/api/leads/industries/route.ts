import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDistinctIndustries } from "@/lib/supabase/leads";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
    }

    const industries = await getDistinctIndustries();

    return NextResponse.json({ data: industries });
  } catch (error) {
    console.error("[API /api/leads/industries] Fehler:", error);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}
