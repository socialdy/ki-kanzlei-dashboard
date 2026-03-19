/* ── API Route: GET /api/linkedin/accounts ── */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserSettings } from "@/lib/supabase/settings";
import { createUnipileClient } from "@/lib/unipile/client";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
    }

    const settings = await getUserSettings(user.id);
    if (!settings?.unipile_dsn || !settings?.unipile_api_key) {
      return NextResponse.json(
        { error: "Unipile nicht konfiguriert" },
        { status: 400 },
      );
    }

    const client = createUnipileClient(settings.unipile_dsn, settings.unipile_api_key);
    const accounts = await client.getAccounts();

    // Map accounts (fast — no profile fetch)
    const mapped = accounts.map((acc) => {
      const premiumFeatures = acc.connection_params?.im?.premiumFeatures ?? [];
      const isSalesNav = premiumFeatures.includes("sales_navigator");
      const isPremium = premiumFeatures.length > 0;

      return {
        id: acc.id,
        name: acc.name ?? acc.connection_params?.im?.username ?? acc.id,
        type: isSalesNav ? "sales_navigator" : isPremium ? "premium" : "classic",
        premiumFeatures,
        status: acc.status ?? "OK",
        publicIdentifier: acc.connection_params?.im?.publicIdentifier ?? null,
      };
    });

    return NextResponse.json({ data: mapped });
  } catch (error) {
    console.error("[API /api/linkedin/accounts]", error);
    return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
  }
}
