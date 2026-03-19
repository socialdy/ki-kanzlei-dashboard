/* ── HubSpot CRM Push (Upsert) ── */

import type { Lead } from "@/types/leads";
import type { CrmExportResult } from "./types";
import { mapLeadToHubSpot } from "./field-mapping";

const BATCH_SIZE = 100;

export async function pushLeadsToHubSpot(
  leads: Lead[],
  apiKey: string,
): Promise<CrmExportResult> {
  const result: CrmExportResult = {
    provider: "hubspot",
    total: leads.length,
    success: 0,
    failed: 0,
    errors: [],
  };

  // HubSpot Batch Upsert: max 100 pro Request
  // Creates new contacts OR updates existing ones based on email
  for (let i = 0; i < leads.length; i += BATCH_SIZE) {
    const batch = leads.slice(i, i + BATCH_SIZE);
    const inputs = batch.map(mapLeadToHubSpot);

    try {
      const res = await fetch(
        "https://api.hubapi.com/crm/v3/objects/contacts/batch/upsert",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            inputs: inputs.map((contact) => ({
              // idProperty tells HubSpot to match on email
              idProperty: "email",
              id: contact.properties.email ?? "",
              properties: contact.properties,
            })),
          }),
        },
      );

      if (!res.ok) {
        const body = await res.text();
        console.error(`[HubSpot] Batch ${Math.floor(i / BATCH_SIZE) + 1} upsert failed: ${res.status} — ${body.slice(0, 500)}`);

        // Fallback: try contacts without email individually
        const singleResults = await pushBatchSingle(batch, apiKey);
        result.success += singleResults.success;
        result.failed += singleResults.failed;
        result.errors.push(...singleResults.errors);
        continue;
      }

      const data = await res.json();
      const upserted = data.results?.length ?? 0;
      result.success += upserted;
      result.failed += batch.length - upserted;
    } catch (err) {
      result.failed += batch.length;
      result.errors.push(
        `Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${err instanceof Error ? err.message : "Netzwerkfehler"}`,
      );
    }
  }

  return result;
}

/** Fallback: create/update contacts one-by-one when batch upsert fails */
async function pushBatchSingle(
  leads: Lead[],
  apiKey: string,
): Promise<{ success: number; failed: number; errors: string[] }> {
  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const lead of leads) {
    const contact = mapLeadToHubSpot(lead);

    // Skip leads without email — can't upsert without identifier
    if (!contact.properties.email) {
      // Try plain create without email
      try {
        const res = await fetch("https://api.hubapi.com/crm/v3/objects/contacts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(contact),
        });
        if (res.ok || res.status === 409) {
          success++;
        } else {
          const body = await res.json().catch(() => null);
          failed++;
          errors.push(`${lead.company}: ${body?.message || `HTTP ${res.status}`}`);
        }
      } catch {
        failed++;
        errors.push(`${lead.company}: Netzwerkfehler`);
      }
      continue;
    }

    // Search for existing contact by email, then create or update
    try {
      const searchRes = await fetch("https://api.hubapi.com/crm/v3/objects/contacts/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          filterGroups: [{
            filters: [{ propertyName: "email", operator: "EQ", value: contact.properties.email }],
          }],
          limit: 1,
        }),
      });

      const searchData = await searchRes.json();
      const existingId = searchData.results?.[0]?.id;

      let res: Response;
      if (existingId) {
        // Update existing
        res = await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${existingId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(contact),
        });
      } else {
        // Create new
        res = await fetch("https://api.hubapi.com/crm/v3/objects/contacts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(contact),
        });
      }

      if (res.ok) {
        success++;
      } else {
        const body = await res.json().catch(() => null);
        failed++;
        errors.push(`${lead.company}: ${body?.message || `HTTP ${res.status}`}`);
      }
    } catch {
      failed++;
      errors.push(`${lead.company}: Netzwerkfehler`);
    }
  }

  return { success, failed, errors };
}

/** Test HubSpot connection by fetching contacts list */
export async function testHubSpotConnection(
  apiKey: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("https://api.hubapi.com/crm/v3/objects/contacts?limit=1", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (res.ok) return { ok: true };
    const body = await res.json().catch(() => null);
    return { ok: false, error: body?.message || `HTTP ${res.status}` };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Netzwerkfehler" };
  }
}
