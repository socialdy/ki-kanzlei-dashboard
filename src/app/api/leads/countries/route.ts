import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDistinctCountries } from "@/lib/supabase/leads";

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

    const countries = await getDistinctCountries();

    return NextResponse.json({ data: countries });
  } catch (error) {
    console.error("[API /api/leads/countries] Fehler:", error);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}
