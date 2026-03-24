/* ── API Route: /api/seo/posts/[id] ── */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSeoPost, deleteSeoPost } from "@/lib/supabase/seo";

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
    const post = await getSeoPost(id);
    if (!post || post.user_id !== user.id) {
      return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
    }

    return NextResponse.json({ data: post });
  } catch (error) {
    console.error("[API /api/seo/posts/[id] GET]", error);
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
    const post = await getSeoPost(id);
    if (!post || post.user_id !== user.id) {
      return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
    }

    await deleteSeoPost(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[API /api/seo/posts/[id] DELETE]", error);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}
