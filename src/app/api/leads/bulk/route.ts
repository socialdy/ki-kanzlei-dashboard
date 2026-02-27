import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { bulkDeleteLeads, bulkUpdateLeadStatus } from "@/lib/supabase/leads";
import type { LeadStatus } from "@/types/leads";

const VALID_STATUSES: LeadStatus[] = ["new", "enriched", "contacted", "qualified", "converted", "closed"];

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
      status?: LeadStatus;
    };

    if (!action || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "action und ids[] sind erforderlich" }, { status: 400 });
    }

    if (ids.length > 100) {
      return NextResponse.json({ error: "Maximal 100 Einträge pro Bulk-Operation" }, { status: 400 });
    }

    switch (action) {
      case "delete":
        await bulkDeleteLeads(ids);
        return NextResponse.json({ success: true, deleted: ids.length });

      case "status":
        if (!status || !VALID_STATUSES.includes(status)) {
          return NextResponse.json({ error: "Gültiger Status ist erforderlich" }, { status: 400 });
        }
        await bulkUpdateLeadStatus(ids, status);
        return NextResponse.json({ success: true, updated: ids.length });

      default:
        return NextResponse.json({ error: `Unbekannte Aktion: ${action}` }, { status: 400 });
    }
  } catch (error) {
    console.error("[API /api/leads/bulk] Fehler:", error);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}
