/* ── Lead Typen ── */

export type LeadStatus = "new" | "enriched" | "contacted" | "qualified" | "converted" | "closed";

/** Anrede/Geschlecht des GF — Werte kommen 1:1 aus dem AI-Prompt */
export type CeoGender = "herr" | "frau" | "divers" | "unbekannt";

export interface Lead {
  id: string;
  created_at: string;
  updated_at: string;

  /* Basisdaten */
  name: string | null;
  /** Von Dashboard/API befüllt — n8n-Sync via DB-Trigger aus company_name */
  company: string;
  /** Von n8n AI-Extraktion befüllt — Sync via DB-Trigger nach company */
  company_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;

  /* Standort */
  address: string | null;
  /** Straße + Hausnummer aus AI-Extraktion (n8n-Feldname: street) */
  street: string | null;
  city: string | null;
  postal_code: string | null;
  country: string;
  category: string | null;
  industry: string | null;

  /* Firmendaten */
  legal_form: string | null;
  employee_count: number | null;

  /* Ansprechpartner */
  ceo_name: string | null;
  ceo_title: string | null;
  ceo_first_name: string | null;
  ceo_last_name: string | null;
  ceo_gender: CeoGender | null;
  ceo_source: string | null;

  /* Google Places Daten */
  google_place_id: string | null;
  google_rating: number | null;
  google_reviews_count: number | null;

  /* Social Media */
  social_linkedin: string | null;
  social_facebook: string | null;
  social_instagram: string | null;
  social_xing: string | null;
  social_twitter: string | null;
  social_youtube: string | null;
  social_tiktok: string | null;

  /* Suche & Status */
  status: LeadStatus;
  search_query: string | null;
  search_location: string | null;
  search_job_id: string | null;
  raw_data: Record<string, unknown> | null;

  /* Multi-Tenancy */
  user_id: string;
}

/* Felder für das Erstellen eines neuen Leads */
export type LeadInsert = Omit<Lead, "id" | "created_at" | "updated_at"> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

/* Felder für das Aktualisieren eines Leads (alle optional) */
export type LeadUpdate = Partial<Pick<Lead,
  | "company" | "company_name" | "name" | "email" | "phone" | "website"
  | "address" | "street" | "city" | "postal_code" | "country"
  | "category" | "industry" | "legal_form" | "employee_count"
  | "ceo_name" | "ceo_title" | "ceo_first_name" | "ceo_last_name" | "ceo_gender" | "ceo_source"
  | "status"
  | "social_linkedin" | "social_facebook" | "social_instagram"
  | "social_xing" | "social_twitter" | "social_youtube" | "social_tiktok"
>>;

/* Normalisierte Branchenliste (exakter n8n AI-Output als value, Anzeige als label) */
export const INDUSTRY_OPTIONS = [
  { value: "Rechtsanwalt",          label: "Rechtsanwalt" },
  { value: "Kanzlei",               label: "Kanzlei" },
  { value: "Steuerberater",         label: "Steuerberater" },
  { value: "Wirtschaftspruefer",    label: "Wirtschaftsprüfer" },
  { value: "Notar",                 label: "Notar" },
  { value: "Arzt",                  label: "Arzt" },
  { value: "Facharzt",              label: "Facharzt" },
  { value: "Zahnarzt",              label: "Zahnarzt" },
  { value: "Tierarzt",              label: "Tierarzt" },
  { value: "Apotheke",              label: "Apotheke" },
  { value: "Physiotherapie",        label: "Physiotherapie" },
  { value: "Heilpraktiker",         label: "Heilpraktiker" },
  { value: "Psychotherapie",        label: "Psychotherapie" },
  { value: "Psychologie",           label: "Psychologie" },
  { value: "Krankenhaus",           label: "Krankenhaus" },
  { value: "Pflegeheim",            label: "Pflegeheim" },
  { value: "Labor",                 label: "Labor" },
  { value: "Immobilienmakler",      label: "Immobilienmakler" },
  { value: "Hausverwaltung",        label: "Hausverwaltung" },
  { value: "Bautraeger",            label: "Bauträger" },
  { value: "Architekt",             label: "Architekt" },
  { value: "Ingenieurbuero",        label: "Ingenieurbüro" },
  { value: "Vermessungsbuero",      label: "Vermessungsbüro" },
  { value: "Bauunternehmen",        label: "Bauunternehmen" },
  { value: "Handwerksbetrieb",      label: "Handwerksbetrieb" },
  { value: "Elektrotechnik",        label: "Elektrotechnik" },
  { value: "Sanitaer",              label: "Sanitär" },
  { value: "Heizung",               label: "Heizung" },
  { value: "Klimatechnik",          label: "Klimatechnik" },
  { value: "Malerbetrieb",          label: "Malerbetrieb" },
  { value: "Bodenleger",            label: "Bodenleger" },
  { value: "Tischlerei",            label: "Tischlerei" },
  { value: "Schreinerei",           label: "Schreinerei" },
  { value: "Schlosserei",           label: "Schlosserei" },
  { value: "Dachdeckerei",          label: "Dachdeckerei" },
  { value: "Zimmerei",              label: "Zimmerei" },
  { value: "Glaserei",              label: "Glaserei" },
  { value: "KFZ-Werkstatt",         label: "KFZ-Werkstatt" },
  { value: "Autohandel",            label: "Autohandel" },
  { value: "Autohaus",              label: "Autohaus" },
  { value: "Tankstelle",            label: "Tankstelle" },
  { value: "Hotel",                 label: "Hotel" },
  { value: "Pension",               label: "Pension" },
  { value: "Restaurant",            label: "Restaurant" },
  { value: "Cafe",                  label: "Café" },
  { value: "Baeckerei",             label: "Bäckerei" },
  { value: "Metzgerei",             label: "Metzgerei" },
  { value: "Catering",              label: "Catering" },
  { value: "Einzelhandel",          label: "Einzelhandel" },
  { value: "Supermarkt",            label: "Supermarkt" },
  { value: "Modegeschaeft",         label: "Modegeschäft" },
  { value: "Juwelier",              label: "Juwelier" },
  { value: "Buchhandlung",          label: "Buchhandlung" },
  { value: "Grosshandel",           label: "Großhandel" },
  { value: "Vertrieb",              label: "Vertrieb" },
  { value: "Import-Export",         label: "Import-Export" },
  { value: "E-Commerce",            label: "E-Commerce" },
  { value: "IT-Dienstleister",      label: "IT-Dienstleister" },
  { value: "Softwareentwicklung",   label: "Softwareentwicklung" },
  { value: "Webdesign",             label: "Webdesign" },
  { value: "Webagentur",            label: "Webagentur" },
  { value: "Marketingagentur",      label: "Marketingagentur" },
  { value: "Werbeagentur",          label: "Werbeagentur" },
  { value: "PR-Agentur",            label: "PR-Agentur" },
  { value: "Unternehmensberatung",  label: "Unternehmensberatung" },
  { value: "Wirtschaftsberatung",   label: "Wirtschaftsberatung" },
  { value: "Versicherungsmakler",   label: "Versicherungsmakler" },
  { value: "Finanzberater",         label: "Finanzberater" },
  { value: "Bank",                  label: "Bank" },
  { value: "Vermoegensverwaltung",  label: "Vermögensverwaltung" },
  { value: "Fitnessstudio",         label: "Fitnessstudio" },
  { value: "Sportverein",           label: "Sportverein" },
  { value: "Wellnesscenter",        label: "Wellnesscenter" },
  { value: "Friseur",               label: "Friseur" },
  { value: "Kosmetikstudio",        label: "Kosmetikstudio" },
  { value: "Beautysalon",           label: "Beautysalon" },
  { value: "Nagelstudio",           label: "Nagelstudio" },
  { value: "Tattoo-Studio",         label: "Tattoo-Studio" },
  { value: "Fahrschule",            label: "Fahrschule" },
  { value: "Nachhilfe",             label: "Nachhilfe" },
  { value: "Sprachschule",          label: "Sprachschule" },
  { value: "Musikschule",           label: "Musikschule" },
  { value: "Kindergarten",          label: "Kindergarten" },
  { value: "Tanzschule",            label: "Tanzschule" },
  { value: "Coaching",              label: "Coaching" },
  { value: "Fotograf",              label: "Fotograf" },
  { value: "Videoproduktion",       label: "Videoproduktion" },
  { value: "Grafikdesign",          label: "Grafikdesign" },
  { value: "Tonstudio",             label: "Tonstudio" },
  { value: "Druckerei",             label: "Druckerei" },
  { value: "Werbetechnik",          label: "Werbetechnik" },
  { value: "Reinigungsfirma",       label: "Reinigungsfirma" },
  { value: "Facility Management",   label: "Facility Management" },
  { value: "Gebaeudeservice",       label: "Gebäudeservice" },
  { value: "Spedition",             label: "Spedition" },
  { value: "Logistik",              label: "Logistik" },
  { value: "Transportunternehmen",  label: "Transportunternehmen" },
  { value: "Kurierdienst",          label: "Kurierdienst" },
  { value: "Umzugsunternehmen",     label: "Umzugsunternehmen" },
  { value: "Gartenbau",             label: "Gartenbau" },
  { value: "Landschaftspflege",     label: "Landschaftspflege" },
  { value: "Floristik",             label: "Floristik" },
  { value: "Landwirtschaft",        label: "Landwirtschaft" },
  { value: "Bestattung",            label: "Bestattung" },
  { value: "Optiker",               label: "Optiker" },
  { value: "Hoergeraeteakustiker",  label: "Hörgeräteakustiker" },
  { value: "Personalvermittlung",   label: "Personalvermittlung" },
  { value: "Zeitarbeit",            label: "Zeitarbeit" },
  { value: "Personalberatung",      label: "Personalberatung" },
  { value: "Sicherheitsdienst",     label: "Sicherheitsdienst" },
  { value: "Detektei",              label: "Detektei" },
  { value: "Eventmanagement",       label: "Eventmanagement" },
  { value: "Veranstaltungstechnik", label: "Veranstaltungstechnik" },
  { value: "Reisebuero",            label: "Reisebüro" },
  { value: "Tierhandlung",          label: "Tierhandlung" },
  { value: "Hundeschule",           label: "Hundeschule" },
  { value: "Rechenzentrum",         label: "Rechenzentrum" },
  { value: "Hosting",               label: "Hosting" },
  { value: "Telekommunikation",     label: "Telekommunikation" },
  { value: "Energieversorger",      label: "Energieversorger" },
  { value: "Abfallentsorgung",      label: "Abfallentsorgung" },
  { value: "Recycling",             label: "Recycling" },
  { value: "Sonstige",              label: "Sonstige" },
] as const;

export type Industry = (typeof INDUSTRY_OPTIONS)[number]["value"];

/* ── Search Job Typen ── */

export type SearchJobStatus = "pending" | "running" | "completed" | "failed";

export interface SearchJob {
  id: string;
  user_id: string;
  query: string;
  location: string;
  country: string;
  status: SearchJobStatus;
  results_count: number;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type SearchJobInsert = Omit<SearchJob, "id" | "created_at" | "updated_at" | "started_at" | "completed_at" | "results_count" | "error_message" | "status"> & {
  id?: string;
  status?: SearchJobStatus;
  radius_km?: number;
};

/* ── Länder-Mapping (n8n liefert ISO-Codes, Frontend zeigt ausgeschrieben) ── */
export const COUNTRY_MAP: Record<string, string> = {
  AT: "Österreich",
  DE: "Deutschland",
  CH: "Schweiz",
  LI: "Liechtenstein",
  IT: "Italien",
  HU: "Ungarn",
  CZ: "Tschechien",
  SK: "Slowakei",
  SI: "Slowenien",
  PL: "Polen",
  NL: "Niederlande",
  BE: "Belgien",
  FR: "Frankreich",
  LU: "Luxemburg",
};

/** ISO-Code → Anzeigename */
export function countryLabel(code: string | null | undefined): string {
  if (!code) return "—";
  return COUNTRY_MAP[code.toUpperCase()] ?? code;
}

/** Anzeigename → ISO-Code (für Select-Dropdown) */
export const COUNTRY_OPTIONS = Object.entries(COUNTRY_MAP).map(([value, label]) => ({
  value,
  label,
}));

/* Rechtsform-Filter */
export const COMPANY_TYPE_OPTIONS = [
  { value: "all", label: "Alle Rechtsformen" },
  { value: "gmbh", label: "GmbH" },
  { value: "eu", label: "Einzelunternehmen (e.U.)" },
  { value: "ag", label: "AG" },
  { value: "og", label: "OG" },
  { value: "kg", label: "KG" },
  { value: "gmbh_cokg", label: "GmbH & Co KG" },
] as const;

export type CompanyTypeFilter = (typeof COMPANY_TYPE_OPTIONS)[number]["value"];

/* Suchanfrage-Typ */
export interface SearchQuery {
  query: string;
  location: string;
  country?: string;
  radius_km?: number;
  company_types?: CompanyTypeFilter[];
}
