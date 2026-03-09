/* ── Tracking-Pixel: GET /api/track/open/[token] ──
 * Kein Auth — verwendet Admin Client.
 * Gibt ein 1x1 transparentes GIF zurück.
 */

import { NextRequest, NextResponse } from "next/server";
import { trackOpen } from "@/lib/supabase/campaigns";

// 1x1 transparent GIF (43 bytes)
const PIXEL_GIF = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64",
);

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  // Fire-and-forget tracking — don't block the response
  trackOpen(token).catch((err) => {
    console.error("[Track Open]", err);
  });

  return new NextResponse(PIXEL_GIF, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Content-Length": String(PIXEL_GIF.length),
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}
