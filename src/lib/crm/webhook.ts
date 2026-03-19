/* ── Webhook Push ── */

import type { Lead } from "@/types/leads";
import type { CrmExportResult } from "./types";
import { mapLeadToWebhook } from "./field-mapping";

export async function pushLeadsToWebhook(
  leads: Lead[],
  webhookUrl: string,
): Promise<CrmExportResult> {
  const result: CrmExportResult = {
    provider: "webhook",
    total: leads.length,
    success: 0,
    failed: 0,
    errors: [],
  };

  const payload = leads.map(mapLeadToWebhook);

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leads: payload, count: leads.length }),
    });

    if (!res.ok) {
      const body = await res.text();
      result.failed = leads.length;
      result.errors.push(`${res.status} — ${body.slice(0, 200)}`);
    } else {
      result.success = leads.length;
    }
  } catch (err) {
    result.failed = leads.length;
    result.errors.push(err instanceof Error ? err.message : "Netzwerkfehler");
  }

  return result;
}
