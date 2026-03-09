/* ── API Route: GET/PATCH/DELETE /api/campaigns/[id] ── */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCampaignById, updateCampaign, deleteCampaign } from "@/lib/supabase/campaigns";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
    }

    const { id } = await params;
    const campaign = await getCampaignById(id, user.id);
    if (!campaign) {
      return NextResponse.json({ error: "Kampagne nicht gefunden" }, { status: 404 });
    }

    return NextResponse.json({ data: campaign });
  } catch (error) {
    console.error("[API /api/campaigns/[id] GET]", error);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}

export async function PATCH(
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
    const body = await request.json();
    const campaign = await updateCampaign(id, body, user.id);

    return NextResponse.json({ data: campaign });
  } catch (error) {
    console.error("[API /api/campaigns/[id] PATCH]", error);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
    }

    const { id } = await params;
    await deleteCampaign(id, user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API /api/campaigns/[id] DELETE]", error);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}
