/* ── API Route: DELETE /api/leads/search/bulk ──
 * Mehrere SearchJobs auf einmal löschen (Bulk Delete).
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function DELETE(request: NextRequest) {
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

    const body = await request.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "Keine IDs angegeben" },
        { status: 400 },
      );
    }

    // Validate all IDs are UUIDs
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!ids.every((id: string) => uuidRegex.test(id))) {
      return NextResponse.json(
        { error: "Ungültige Job-IDs" },
        { status: 400 },
      );
    }

    // Admin-Client für DELETE (RLS-bypass, Auth + user_id-Filter oben geprüft)
    const { error } = await getSupabaseAdmin()
      .from("search_jobs")
      .delete()
      .in("id", ids)
      .eq("user_id", user.id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, deleted: ids.length });
  } catch (error) {
    console.error("[API DELETE /api/leads/search/bulk] Fehler:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 },
    );
  }
}
