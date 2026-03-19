/* ── Pipedrive CRM Push ── */

import type { Lead } from "@/types/leads";
import type { CrmExportResult } from "./types";
import { mapLeadToPipedrive } from "./field-mapping";

const CONCURRENCY = 5;

export async function pushLeadsToPipedrive(
  leads: Lead[],
  apiKey: string,
  domain: string,
): Promise<CrmExportResult> {
  const result: CrmExportResult = {
    provider: "pipedrive",
    total: leads.length,
    success: 0,
    failed: 0,
    errors: [],
  };

  // Pipedrive v2 API: sequenziell mit Concurrency-Limit
  const baseUrl = `https://${domain}.pipedrive.com/api/v2/persons`;

  async function pushOne(lead: Lead): Promise<void> {
    const contact = mapLeadToPipedrive(lead);
    try {
      const res = await fetch(baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-token": apiKey,
        },
        body: JSON.stringify(contact),
      });

      if (!res.ok) {
        const body = await res.text();
        result.failed++;
        result.errors.push(`${lead.company}: ${res.status} — ${body.slice(0, 150)}`);
        return;
      }
      result.success++;
    } catch (err) {
      result.failed++;
      result.errors.push(`${lead.company}: ${err instanceof Error ? err.message : "Netzwerkfehler"}`);
    }
  }

  // Process with concurrency limit
  const queue = [...leads];
  const workers = Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
    while (queue.length > 0) {
      const lead = queue.shift()!;
      await pushOne(lead);
    }
  });

  await Promise.all(workers);
  return result;
}
