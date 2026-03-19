/* ── API Route: GET + POST /api/linkedin/leads ── */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getLinkedInLeads,
  upsertLinkedInLeads,
} from "@/lib/supabase/linkedin-leads";
import type { LinkedInLeadStatus, LinkedInLeadInsert } from "@/types/linkedin";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
    }

    const url = new URL(request.url);
    const status = url.searchParams.get("status") as LinkedInLeadStatus | null;
    const search = url.searchParams.get("search");
    const search_query = url.searchParams.get("search_query");
    const industry = url.searchParams.get("industry");
    const location = url.searchParams.get("location");
    const sort_by = url.searchParams.get("sort_by");
    const sort_dir = url.searchParams.get("sort_dir") as "asc" | "desc" | null;
    const page = parseInt(url.searchParams.get("page") ?? "1", 10);
    const pageSize = parseInt(url.searchParams.get("pageSize") ?? "25", 10);

    const result = await getLinkedInLeads(
      user.id,
      {
        status: status || undefined,
        search: search || undefined,
        search_query: search_query || undefined,
        industry: industry || undefined,
        location: location || undefined,
        sort_by: sort_by || undefined,
        sort_dir: sort_dir || undefined,
      },
      { page, pageSize },
    );

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("[API /api/linkedin/leads GET]", error);
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
    const { leads } = body as {
      leads: Array<{
        linkedin_url: string;
        linkedin_id?: string;
        full_name: string;
        first_name?: string;
        last_name?: string;
        headline?: string;
        company?: string;
        position?: string;
        location?: string;
        profile_picture_url?: string;
        industry?: string;
        search_query?: string;
      }>;
    };

    if (!leads || !Array.isArray(leads) || leads.length === 0) {
      return NextResponse.json({ error: "Keine Leads übergeben" }, { status: 400 });
    }

    const inserts: LinkedInLeadInsert[] = leads.map((l) => ({
      user_id: user.id,
      linkedin_url: l.linkedin_url,
      linkedin_id: l.linkedin_id || null,
      full_name: l.full_name,
      first_name: l.first_name || null,
      last_name: l.last_name || null,
      headline: l.headline || null,
      company: l.company || null,
      position: l.position || null,
      location: l.location || null,
      profile_picture_url: l.profile_picture_url || null,
      industry: l.industry || null,
      search_query: l.search_query || null,
      status: "new" as const,
    }));

    const saved = await upsertLinkedInLeads(inserts);

    return NextResponse.json({ data: saved, count: saved.length });
  } catch (error) {
    console.error("[API /api/linkedin/leads POST]", error);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}
