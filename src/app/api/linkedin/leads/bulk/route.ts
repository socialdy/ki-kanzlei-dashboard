/* ── API Route: POST /api/linkedin/leads/bulk ── */
/* Bulk delete or status change for LinkedIn leads */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  bulkDeleteLinkedInLeads,
  bulkUpdateLinkedInLeadStatus,
} from "@/lib/supabase/linkedin-leads";
import type { LinkedInLeadStatus } from "@/types/linkedin";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
    }

    const body = await request.json();
    const { action, ids, status } = body as {
      action: "delete" | "status";
      ids: string[];
      status?: LinkedInLeadStatus;
    };

    if (!action || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "action und ids erforderlich" }, { status: 400 });
    }

    if (action === "delete") {
      await bulkDeleteLinkedInLeads(ids);
      return NextResponse.json({ success: true, count: ids.length });
    }

    if (action === "status") {
      if (!status) {
        return NextResponse.json({ error: "status erforderlich" }, { status: 400 });
      }
      await bulkUpdateLinkedInLeadStatus(ids, status);
      return NextResponse.json({ success: true, count: ids.length });
    }

    return NextResponse.json({ error: "Ungültige Aktion" }, { status: 400 });
  } catch (error) {
    console.error("[API /api/linkedin/leads/bulk]", error);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}
