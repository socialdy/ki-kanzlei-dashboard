/* ── Tracking: POST /api/track/bounce ──
 * Aufgerufen von n8n mit shared secret.
 * Body: { email: string, bounce_type?: "hard" | "soft" }
 */

import { NextRequest, NextResponse } from "next/server";
import { trackBounce } from "@/lib/supabase/campaigns";

export async function POST(request: NextRequest) {
  try {
    // Shared secret prüfen
    const secret = request.headers.get("x-n8n-secret");
    if (!secret || secret !== process.env.N8N_WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { email, bounce_type } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "email ist erforderlich" }, { status: 400 });
    }

    const found = await trackBounce(email, bounce_type);

    return NextResponse.json({ success: true, matched: found });
  } catch (error) {
    console.error("[Track Bounce]", error);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}
