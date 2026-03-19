/* ── Salesforce CRM Push ── */

import type { Lead } from "@/types/leads";
import type { CrmExportResult } from "./types";
import { mapLeadToSalesforce } from "./field-mapping";

const BATCH_SIZE = 200;

export async function pushLeadsToSalesforce(
  leads: Lead[],
  instanceUrl: string,
  accessToken: string,
): Promise<CrmExportResult> {
  const result: CrmExportResult = {
    provider: "salesforce",
    total: leads.length,
    success: 0,
    failed: 0,
    errors: [],
  };

  // Salesforce Composite API: max 200 pro Request
  const baseUrl = instanceUrl.replace(/\/$/, "");

  for (let i = 0; i < leads.length; i += BATCH_SIZE) {
    const batch = leads.slice(i, i + BATCH_SIZE);
    const records = batch.map((lead, idx) => ({
      attributes: { type: "Lead" },
      referenceId: `ref_${i + idx}`,
      ...mapLeadToSalesforce(lead),
    }));

    try {
      const res = await fetch(
        `${baseUrl}/services/data/v59.0/composite/tree/Lead`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ records }),
        },
      );

      if (!res.ok) {
        const body = await res.text();
        result.failed += batch.length;
        result.errors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${res.status} — ${body.slice(0, 200)}`);
        continue;
      }

      const data = await res.json();
      if (data.hasErrors) {
        const errorCount = data.results?.filter((r: any) => !r.id)?.length ?? 0;
        result.failed += errorCount;
        result.success += batch.length - errorCount;
        result.errors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${errorCount} Fehler`);
      } else {
        result.success += batch.length;
      }
    } catch (err) {
      result.failed += batch.length;
      result.errors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${err instanceof Error ? err.message : "Netzwerkfehler"}`);
    }
  }

  return result;
}
