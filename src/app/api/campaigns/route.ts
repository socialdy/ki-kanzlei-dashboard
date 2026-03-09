/* ── API Route: GET /api/campaigns + POST /api/campaigns ── */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCampaigns, createCampaign } from "@/lib/supabase/campaigns";
import type { CampaignStatus } from "@/types/campaigns";

const VALID_STATUSES: CampaignStatus[] = ["draft", "active", "paused", "completed"];

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const status = searchParams.get("status") as CampaignStatus | null;
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = parseInt(searchParams.get("limit") ?? "25", 10);

    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Ungültiger Status" }, { status: 400 });
    }

    const result = await getCampaigns(
      user.id,
      { status: status ?? undefined, search: search ?? undefined },
      { page, pageSize: limit },
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("[API /api/campaigns GET]", error);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
    }

    const body = await request.json();
    const { name, daily_limit, delay_minutes, reply_to, lead_ids } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Name ist erforderlich" }, { status: 400 });
    }
    if (!Array.isArray(lead_ids) || lead_ids.length === 0) {
      return NextResponse.json({ error: "Mindestens ein Lead muss ausgewählt werden" }, { status: 400 });
    }

    const campaign = await createCampaign(
      {
        name: name.trim(),
        daily_limit: daily_limit ?? 200,
        delay_minutes: delay_minutes ?? 8,
        reply_to: reply_to ?? "info@ki-kanzlei.at",
        lead_ids,
      },
      user.id,
    );

    return NextResponse.json({ data: campaign }, { status: 201 });
  } catch (error) {
    console.error("[API /api/campaigns POST]", error);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}
