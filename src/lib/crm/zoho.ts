/* ── Zoho CRM Push ── */

import type { Lead } from "@/types/leads";
import type { CrmExportResult } from "./types";
import { mapLeadToZoho } from "./field-mapping";

const BATCH_SIZE = 100;

async function refreshAccessToken(
  clientId: string,
  clientSecret: string,
  refreshToken: string,
): Promise<string> {
  const params = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
  });

  const res = await fetch(`https://accounts.zoho.eu/oauth/v2/token?${params.toString()}`, {
    method: "POST",
  });

  if (!res.ok) {
    throw new Error(`Zoho OAuth fehlgeschlagen: ${res.status}`);
  }

  const data = await res.json();
  if (!data.access_token) {
    throw new Error("Kein Access Token von Zoho erhalten");
  }

  return data.access_token;
}

export async function pushLeadsToZoho(
  leads: Lead[],
  clientId: string,
  clientSecret: string,
  refreshToken: string,
): Promise<CrmExportResult> {
  const result: CrmExportResult = {
    provider: "zoho",
    total: leads.length,
    success: 0,
    failed: 0,
    errors: [],
  };

  // OAuth Token refresh
  let accessToken: string;
  try {
    accessToken = await refreshAccessToken(clientId, clientSecret, refreshToken);
  } catch (err) {
    result.failed = leads.length;
    result.errors.push(err instanceof Error ? err.message : "OAuth-Fehler");
    return result;
  }

  // Zoho Bulk Insert: max 100 pro Request
  for (let i = 0; i < leads.length; i += BATCH_SIZE) {
    const batch = leads.slice(i, i + BATCH_SIZE);
    const data = batch.map(mapLeadToZoho);

    try {
      const res = await fetch(
        "https://www.zohoapis.eu/crm/v6/Leads",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Zoho-oauthtoken ${accessToken}`,
          },
          body: JSON.stringify({ data }),
        },
      );

      if (!res.ok) {
        const body = await res.text();
        result.failed += batch.length;
        result.errors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${res.status} — ${body.slice(0, 200)}`);
        continue;
      }

      const responseData = await res.json();
      const records = responseData.data ?? [];
      const successCount = records.filter((r: any) => r.status === "success").length;
      result.success += successCount;
      result.failed += batch.length - successCount;

      if (successCount < batch.length) {
        const failedRecords = records.filter((r: any) => r.status !== "success");
        failedRecords.forEach((r: any) => {
          result.errors.push(`${r.details?.api_name ?? "Unbekannt"}: ${r.message ?? "Fehler"}`);
        });
      }
    } catch (err) {
      result.failed += batch.length;
      result.errors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${err instanceof Error ? err.message : "Netzwerkfehler"}`);
    }
  }

  return result;
}
