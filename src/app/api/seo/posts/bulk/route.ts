/* ── API Route: PATCH/DELETE /api/seo/posts/bulk ── */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { bulkUpdateSeoPostStatus, bulkDeleteSeoPosts } from "@/lib/supabase/seo";
import type { SeoPostStatus } from "@/types/seo";

const VALID_STATUSES: SeoPostStatus[] = ["draft", "published", "error"];

async function getAuthUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
    }

    const body = await req.json();
    const { ids, status } = body as { ids?: string[]; status?: SeoPostStatus };

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "ids[] erforderlich" }, { status: 400 });
    }
    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Ungültiger Status" }, { status: 400 });
    }

    await bulkUpdateSeoPostStatus(ids, status);
    return NextResponse.json({ updated: ids.length });
  } catch (error) {
    console.error("[API /api/seo/posts/bulk PATCH]", error);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
    }

    const body = await req.json();
    const { ids } = body as { ids?: string[] };

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "ids[] erforderlich" }, { status: 400 });
    }

    await bulkDeleteSeoPosts(ids);
    return NextResponse.json({ deleted: ids.length });
  } catch (error) {
    console.error("[API /api/seo/posts/bulk DELETE]", error);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}
