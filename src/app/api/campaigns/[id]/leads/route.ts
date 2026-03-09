/* ── API Route: GET /api/campaigns/[id]/leads ── */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCampaignLeads } from "@/lib/supabase/campaigns";
import type { CampaignLeadStatus } from "@/types/campaigns";

const VALID_STATUSES: CampaignLeadStatus[] = [
  "pending", "sent", "failed", "opened", "bounced", "replied",
];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = request.nextUrl;
    const status = searchParams.get("status") as CampaignLeadStatus | null;
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = parseInt(searchParams.get("limit") ?? "25", 10);

    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Ungültiger Status" }, { status: 400 });
    }

    const result = await getCampaignLeads(
      id,
      user.id,
      { page, pageSize: limit },
      { status: status ?? undefined, search: search ?? undefined },
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("[API /api/campaigns/[id]/leads]", error);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}
