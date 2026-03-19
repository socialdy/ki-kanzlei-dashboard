/* ── CRM Export Types ── */

export type CrmProvider = "hubspot" | "pipedrive" | "salesforce" | "zoho" | "webhook";

export interface CrmExportRequest {
  provider: CrmProvider;
  /** IDs der ausgewählten Leads */
  ids?: string[];
  /** "ids" = nur ausgewählte, "all" = alle gefilterten */
  selectionMode: "ids" | "all";
  /** Filter für selectionMode "all" */
  filters?: {
    search?: string;
    status?: string;
    industry?: string;
    legal_form?: string;
  };
  /** Optionale Webhook-URL (überschreibt Settings) */
  webhook_url?: string;
}

export interface CrmExportResult {
  provider: CrmProvider;
  total: number;
  success: number;
  failed: number;
  errors: string[];
}

/* ── Provider-spezifische Contact-Formate ── */

export interface HubSpotContact {
  properties: Record<string, string>;
}

export interface PipedriveContact {
  name: string;
  email?: { value: string; primary: boolean }[];
  phone?: { value: string; primary: boolean }[];
  org_id?: number;
  visible_to?: number;
}

export interface SalesforceContact {
  FirstName?: string;
  LastName: string;
  Email?: string;
  Phone?: string;
  Title?: string;
  Company?: string;
  MailingStreet?: string;
  MailingCity?: string;
  MailingPostalCode?: string;
  MailingCountry?: string;
  Website?: string;
  Industry?: string;
}

export interface ZohoContact {
  First_Name?: string;
  Last_Name: string;
  Email?: string;
  Phone?: string;
  Company?: string;
  Title?: string;
  Mailing_Street?: string;
  Mailing_City?: string;
  Mailing_Zip?: string;
  Mailing_Country?: string;
  Website?: string;
  Industry?: string;
}
