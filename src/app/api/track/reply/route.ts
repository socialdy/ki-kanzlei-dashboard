/* ── Tracking: POST /api/track/reply ──
 * Aufgerufen von n8n mit shared secret.
 * Body: { email: string, reply_preview?: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { trackReply } from "@/lib/supabase/campaigns";

export async function POST(request: NextRequest) {
  try {
    // Shared secret prüfen
    const secret = request.headers.get("x-n8n-secret");
    if (!secret || secret !== process.env.N8N_WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { email, reply_preview } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "email ist erforderlich" }, { status: 400 });
    }

    const found = await trackReply(email, reply_preview);

    return NextResponse.json({ success: true, matched: found });
  } catch (error) {
    console.error("[Track Reply]", error);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}
