/* ── API Route: GET + PATCH + DELETE /api/linkedin/leads/[id] ── */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getLinkedInLead,
  updateLinkedInLead,
  updateLinkedInLeadStatus,
  deleteLinkedInLead,
} from "@/lib/supabase/linkedin-leads";
import type { LinkedInLeadStatus } from "@/types/linkedin";

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
    const lead = await getLinkedInLead(id);
    if (!lead) {
      return NextResponse.json({ error: "Lead nicht gefunden" }, { status: 404 });
    }

    return NextResponse.json({ data: lead });
  } catch (error) {
    console.error("[API /api/linkedin/leads/[id] GET]", error);
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

    if (body.status) {
      const { status, ...extra } = body;
      const lead = await updateLinkedInLeadStatus(id, status as LinkedInLeadStatus, extra);
      return NextResponse.json({ data: lead });
    }

    const lead = await updateLinkedInLead(id, body);
    return NextResponse.json({ data: lead });
  } catch (error) {
    console.error("[API /api/linkedin/leads/[id] PATCH]", error);
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
    await deleteLinkedInLead(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API /api/linkedin/leads/[id] DELETE]", error);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}
