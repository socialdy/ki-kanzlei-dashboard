/* ── CRM Provider Metadaten ── */

import type { CrmProvider } from "./types";

export interface ProviderMeta {
  id: CrmProvider;
  name: string;
  logo: string;
  color: string;
  /** Keys in UserSettings, die konfiguriert sein müssen */
  requiredKeys: string[];
  docsUrl: string;
}

export const CRM_PROVIDERS: ProviderMeta[] = [
  {
    id: "hubspot",
    name: "HubSpot",
    logo: "/logos/hubspot.svg",
    color: "#ff7a59",
    requiredKeys: ["hubspot_api_key"],
    docsUrl: "https://developers.hubspot.com/docs/api/crm/contacts",
  },
  {
    id: "pipedrive",
    name: "Pipedrive",
    logo: "/logos/pipedrive.svg",
    color: "#017737",
    requiredKeys: ["pipedrive_api_key", "pipedrive_domain"],
    docsUrl: "https://developers.pipedrive.com/docs/api/v1/Persons",
  },
  {
    id: "salesforce",
    name: "Salesforce",
    logo: "/logos/salesforce.svg",
    color: "#00a1e0",
    requiredKeys: ["salesforce_instance_url", "salesforce_access_token"],
    docsUrl: "https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/",
  },
  {
    id: "zoho",
    name: "Zoho CRM",
    logo: "/logos/zoho.svg",
    color: "#e42527",
    requiredKeys: ["zoho_client_id", "zoho_client_secret", "zoho_refresh_token"],
    docsUrl: "https://www.zoho.com/crm/developer/docs/api/v6/",
  },
];

export const WEBHOOK_PROVIDER: ProviderMeta = {
  id: "webhook",
  name: "Webhook",
  logo: "/logos/zapier.svg",
  color: "#ff4a00",
  requiredKeys: ["webhook_url"],
  docsUrl: "",
};

export function getProviderMeta(id: CrmProvider): ProviderMeta | undefined {
  if (id === "webhook") return WEBHOOK_PROVIDER;
  return CRM_PROVIDERS.find((p) => p.id === id);
}
