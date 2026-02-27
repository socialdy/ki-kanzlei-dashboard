/* ── Scraper Service ──
 * Modulare Architektur: Provider-Pattern ermöglicht einfaches Austauschen
 * des Providers gegen echte APIs (Google Places + LangSearch).
 */

/* ── Interfaces ── */

export interface ScraperResult {
  company: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  street: string | null;
  city: string | null;
  postal_code: string | null;
  country: string;
  industry: string | null;
  ceo_name: string | null;
  google_place_id: string | null;
  google_rating: number | null;
  google_reviews_count: number | null;
  social_linkedin: string | null;
  social_facebook: string | null;
  social_instagram: string | null;
  social_xing: string | null;
  social_twitter: string | null;
  social_youtube: string | null;
  social_tiktok: string | null;
  raw_data: Record<string, unknown> | null;
}

export interface ScraperProvider {
  name: string;
  search(
    query: string,
    location: string,
    country: string,
  ): Promise<ScraperResult[]>;
}

/* ══════════════════════════════════════════════════════════════
   Google Places + LangSearch Provider
   ══════════════════════════════════════════════════════════════ */

interface GooglePlace {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  businessStatus?: string;
  types?: string[];
}

interface WebsiteData {
  emails: string[];
  phones: string[];
  websiteContent: string;
  pagesLoaded: string[];
  socialLinkedin: string | null;
  socialFacebook: string | null;
  socialInstagram: string | null;
  socialXing: string | null;
  socialTwitter: string | null;
  socialYoutube: string | null;
  socialTiktok: string | null;
}

interface LangSearchResult {
  name: string;
  url: string;
  snippet: string;
  summary?: string;
}

export class GooglePlacesLangSearchProvider implements ScraperProvider {
  name = "google-langsearch";

  private googleApiKey: string;
  private langSearchApiKey: string;

  constructor() {
    this.googleApiKey = process.env.GOOGLE_PLACES_API_KEY ?? "";
    this.langSearchApiKey = process.env.LANGSEARCH_API_KEY ?? "";

    if (!this.googleApiKey) {
      throw new Error("GOOGLE_PLACES_API_KEY ist nicht gesetzt");
    }
    if (!this.langSearchApiKey) {
      throw new Error("LANGSEARCH_API_KEY ist nicht gesetzt");
    }
  }

  async search(
    query: string,
    location: string,
    country: string,
  ): Promise<ScraperResult[]> {
    /* ── Step 1: Google Places Text Search ── */
    console.log(`[Scraper] Google Places Suche: "${query} in ${location}"`);
    const places = await this.searchGooglePlaces(query, location);

    if (places.length === 0) {
      console.log("[Scraper] Keine Ergebnisse von Google Places");
      return [];
    }

    console.log(`[Scraper] ${places.length} Places gefunden, verarbeite...`);

    /* ── Step 2: Für jede Firma enrichen ── */
    const results: ScraperResult[] = [];

    for (const place of places) {
      try {
        const result = await this.enrichPlace(place, query, location, country);
        if (result) {
          results.push(result);
        }
      } catch (err) {
        console.error(`[Scraper] Fehler bei "${place.displayName?.text}":`, err);
        // Basis-Daten trotzdem aufnehmen
        results.push(this.placeToBasicResult(place, query, location, country));
      }
    }

    return results;
  }

  /* ── Google Places API ── */
  private async searchGooglePlaces(query: string, location: string): Promise<GooglePlace[]> {
    const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "X-Goog-Api-Key": this.googleApiKey,
        "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.googleMapsUri,places.businessStatus,places.types,places.id",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        textQuery: `${query} in ${location}`,
        languageCode: "de",
        maxResultCount: 20,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Google Places API Fehler (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const allPlaces: GooglePlace[] = data.places || [];

    // Nur aktive Unternehmen mit Website
    return allPlaces.filter(
      (p) => p.websiteUri && p.businessStatus === "OPERATIONAL"
    );
  }

  /* ── Website Pages scrapen ── */
  private async fetchWebsiteData(baseUrl: string): Promise<WebsiteData> {
    const cleanBase = baseUrl.replace(/\/$/, "");

    const urls = [
      { url: cleanBase, type: "homepage" },
      { url: cleanBase + "/impressum", type: "impressum" },
      { url: cleanBase + "/imprint", type: "impressum" },
      { url: cleanBase + "/ueber-uns", type: "about" },
      { url: cleanBase + "/about", type: "about" },
      { url: cleanBase + "/about-us", type: "about" },
      { url: cleanBase + "/unternehmen", type: "about" },
      { url: cleanBase + "/team", type: "team" },
      { url: cleanBase + "/unser-team", type: "team" },
      { url: cleanBase + "/partner", type: "team" },
      { url: cleanBase + "/geschaeftsfuehrung", type: "team" },
      { url: cleanBase + "/management", type: "team" },
      { url: cleanBase + "/kontakt", type: "kontakt" },
      { url: cleanBase + "/contact", type: "kontakt" },
    ];

    // Max 3 pro Typ (außer homepage)
    const seenTypes: Record<string, number> = {};
    const filteredUrls = urls.filter((u) => {
      seenTypes[u.type] = (seenTypes[u.type] || 0) + 1;
      return u.type === "homepage" || seenTypes[u.type] <= 2;
    });

    let combinedText = "";
    const pagesLoaded: string[] = [];
    const emailsFound: string[] = [];
    const phonesFound: string[] = [];
    let socialLinkedin: string | null = null;
    let socialFacebook: string | null = null;
    let socialInstagram: string | null = null;
    let socialXing: string | null = null;
    let socialTwitter: string | null = null;
    let socialYoutube: string | null = null;
    let socialTiktok: string | null = null;

    for (const entry of filteredUrls) {
      try {
        const response = await fetch(entry.url, {
          signal: AbortSignal.timeout(8000),
          headers: { "User-Agent": "Mozilla/5.0 (compatible; LeadBot/1.0)" },
          redirect: "follow",
        });

        if (!response.ok) continue;

        const ct = response.headers.get("content-type") || "";
        if (!ct.includes("text/html")) continue;

        const html = await response.text();

        // HTML zu Text
        const text = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
          .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
          .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/&nbsp;/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .substring(0, 2000);

        combinedText += `\n\n=== ${entry.type.toUpperCase()} ===\n${text}\n`;
        pagesLoaded.push(entry.type);

        // Emails extrahieren
        const emails = html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
        emailsFound.push(
          ...emails.filter((e) => {
            const lower = e.toLowerCase();
            return (
              !lower.includes("example") &&
              !lower.includes("noreply") &&
              !lower.includes("wixpress") &&
              !lower.includes("sentry") &&
              !lower.includes("@2x") &&
              !lower.includes(".png") &&
              !lower.includes(".jpg")
            );
          })
        );

        // Telefone extrahieren
        const phones = html.match(/(?:\+[1-9]\d{0,2}|0)[\s\d\-\/()]{7,20}/g) || [];
        phonesFound.push(...phones.map((p) => p.replace(/[\s\-\/()]/g, "")));

        // Social Links
        if (!socialLinkedin) {
          const li = html.match(/https?:\/\/([a-z]{2,3}\.)?linkedin\.com\/(?:company|in)\/[^\s"'<>]+/i);
          if (li) socialLinkedin = li[0];
        }
        if (!socialFacebook) {
          const fb = html.match(/https?:\/\/([a-z]{2,3}\.)?facebook\.com\/(?!sharer)[^\s"'<>]+/i);
          if (fb) socialFacebook = fb[0].split('"')[0].split("'")[0].split("?")[0];
        }
        if (!socialInstagram) {
          const ig = html.match(/https?:\/\/([a-z]{2,3}\.)?instagram\.com\/(?!p\/)[^\s"'<>]+/i);
          if (ig) socialInstagram = ig[0].split('"')[0].split("'")[0].split("?")[0];
        }
        if (!socialXing) {
          const xi = html.match(/https?:\/\/([a-z]{2,3}\.)?xing\.com\/(?:profile|companies)\/[^\s"'<>]+/i);
          if (xi) socialXing = xi[0].split('"')[0].split("'")[0].split("?")[0];
        }
        if (!socialTwitter) {
          const tw = html.match(/https?:\/\/([a-z]{2,3}\.)?(twitter\.com|x\.com)\/(?!intent|share)[^\s"'<>]+/i);
          if (tw) socialTwitter = tw[0].split('"')[0].split("'")[0].split("?")[0];
        }
        if (!socialYoutube) {
          const yt = html.match(/https?:\/\/([a-z]{2,3}\.)?youtube\.com\/(channel|c|user|@)[^\s"'<>]+/i);
          if (yt) socialYoutube = yt[0].split('"')[0].split("'")[0].split("?")[0];
        }
        if (!socialTiktok) {
          const tt = html.match(/https?:\/\/([a-z]{2,3}\.)?tiktok\.com\/@[^\s"'<>]+/i);
          if (tt) socialTiktok = tt[0].split('"')[0].split("'")[0].split("?")[0];
        }
      } catch {
        continue;
      }
    }

    return {
      emails: [...new Set(emailsFound)],
      phones: [...new Set(phonesFound)],
      websiteContent: combinedText.substring(0, 8000),
      pagesLoaded,
      socialLinkedin,
      socialFacebook,
      socialInstagram,
      socialXing,
      socialTwitter,
      socialYoutube,
      socialTiktok,
    };
  }

  /* ── LangSearch: CEO / Geschäftsführer finden ── */
  private async searchCEO(companyName: string, location: string): Promise<{
    ceoName: string | null;
    snippets: string;
  }> {
    try {
      const searchQuery = `${companyName} ${location} Geschäftsführer OR CEO OR Inhaber OR "managing director"`;

      const response = await fetch("https://api.langsearch.com/v1/web-search", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.langSearchApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: searchQuery,
          freshness: "noLimit",
          summary: true,
          count: 10,
        }),
      });

      if (!response.ok) {
        console.warn(`[LangSearch] Fehler ${response.status} für "${companyName}"`);
        return { ceoName: null, snippets: "" };
      }

      const data = await response.json();
      const results: LangSearchResult[] = data.webPages?.value || [];

      const snippets = results
        .slice(0, 10)
        .map((r) => `${r.name}: ${r.snippet || ""} ${r.summary || ""}`)
        .join("\n");

      // Einfache CEO-Extraktion aus Snippets
      const ceoName = this.extractCEOFromSnippets(snippets, companyName);

      return { ceoName, snippets };
    } catch (err) {
      console.error(`[LangSearch] Fehler bei CEO-Suche:`, err);
      return { ceoName: null, snippets: "" };
    }
  }

  /* ── CEO aus Suchergebnissen extrahieren ── */
  private extractCEOFromSnippets(snippets: string, _companyName: string): string | null {
    if (!snippets) return null;

    // Pattern für typische CEO/GF-Nennungen
    const patterns = [
      /(?:Geschäftsführer|Geschaeftsfuehrer|CEO|Inhaber|Managing Director|Geschäftsleitung)\s*(?::|ist|,)\s*([A-ZÄÖÜ][a-zäöüß]+(?:\s+[A-ZÄÖÜ][a-zäöüß]+){1,2})/gi,
      /([A-ZÄÖÜ][a-zäöüß]+(?:\s+[A-ZÄÖÜ][a-zäöüß]+){1,2})\s*(?:,\s*)?(?:Geschäftsführer|Geschaeftsfuehrer|CEO|Inhaber|Managing Director)/gi,
      /(?:Mag|Dr|DI|Ing|Prof)\.?\s+([A-ZÄÖÜ][a-zäöüß]+(?:\s+[A-ZÄÖÜ][a-zäöüß]+){1,2})/gi,
    ];

    for (const pattern of patterns) {
      const match = pattern.exec(snippets);
      if (match?.[1]) {
        const name = match[1].trim();
        // Mindestens 2 Wörter, max 40 Zeichen
        if (name.split(/\s+/).length >= 2 && name.length <= 40) {
          return name;
        }
      }
    }

    return null;
  }

  /* ── Einzelne Firma enrichen ── */
  private async enrichPlace(
    place: GooglePlace,
    query: string,
    location: string,
    country: string,
  ): Promise<ScraperResult> {
    const companyName = place.displayName?.text || "";
    const website = (place.websiteUri || "").replace(/\/$/, "");

    // Parallel: Website scrapen + CEO suchen
    const [websiteData, ceoData] = await Promise.all([
      website ? this.fetchWebsiteData(website) : Promise.resolve(null),
      this.searchCEO(companyName, location),
    ]);

    // Beste Email wählen (persönliche vor info@)
    let bestEmail: string | null = null;
    if (websiteData?.emails && websiteData.emails.length > 0) {
      const personal = websiteData.emails.find(
        (e) => !e.startsWith("info@") && !e.startsWith("office@") && !e.startsWith("kontakt@")
      );
      bestEmail = personal || websiteData.emails[0];
    }

    // Beste Telefonnummer
    const bestPhone =
      place.internationalPhoneNumber ||
      place.nationalPhoneNumber ||
      (websiteData?.phones?.[0] || null);

    // Stadt und PLZ aus Adresse extrahieren
    const addressParts = this.parseAddress(place.formattedAddress || "", country);

    return {
      company: companyName,
      name: ceoData.ceoName,
      email: bestEmail,
      phone: bestPhone,
      website,
      address: place.formattedAddress || null,
      street: addressParts.street || null,
      city: addressParts.city || location,
      postal_code: addressParts.postalCode || null,
      country: addressParts.country || country,
      industry: query,
      ceo_name: ceoData.ceoName,
      google_place_id: place.id || null,
      google_rating: place.rating ?? null,
      google_reviews_count: place.userRatingCount ?? null,
      social_linkedin: websiteData?.socialLinkedin || null,
      social_facebook: websiteData?.socialFacebook || null,
      social_instagram: websiteData?.socialInstagram || null,
      social_xing: websiteData?.socialXing || null,
      social_twitter: websiteData?.socialTwitter || null,
      social_youtube: websiteData?.socialYoutube || null,
      social_tiktok: websiteData?.socialTiktok || null,
      raw_data: {
        source: "google-places+langsearch",
        google_maps_url: place.googleMapsUri || null,
        category: (place.types || []).join(", "),
        emails_found: websiteData?.emails || [],
        phones_found: websiteData?.phones || [],
        pages_loaded: websiteData?.pagesLoaded || [],
        ceo_search_snippets: ceoData.snippets,
        website_content_preview: websiteData?.websiteContent?.substring(0, 500) || null,
      },
    };
  }

  /* ── Adresse parsen ── */
  private parseAddress(address: string, defaultCountry: string): {
    street: string | null;
    city: string | null;
    postalCode: string | null;
    country: string;
  } {
    if (!address) return { street: null, city: null, postalCode: null, country: defaultCountry };

    // Land erkennen
    let country = defaultCountry;
    const lower = address.toLowerCase();
    if (lower.includes("österreich") || lower.includes("austria")) {
      country = "AT";
    } else if (lower.includes("deutschland") || lower.includes("germany")) {
      country = "DE";
    } else if (lower.includes("schweiz") || lower.includes("switzerland")) {
      country = "CH";
    }

    // Typisches Format: "Musterstraße 1, 5400 Hallein, Österreich"
    // oder: "Musterstraße 1, 5400 Hallein"
    const parts = address.split(",").map((p) => p.trim());

    // Straße ist typischerweise der erste Teil (vor dem ersten Komma)
    const street = parts[0] || null;

    // PLZ + Stadt aus dem Teil mit der Zahl
    let postalCode: string | null = null;
    let city: string | null = null;

    for (const part of parts.slice(1)) {
      const plzMatch = part.match(/^(\d{4,5})\s+(.+)/);
      if (plzMatch) {
        postalCode = plzMatch[1];
        city = plzMatch[2].trim();
        break;
      }
    }

    return { street, city, postalCode, country };
  }

  /* ── Fallback: Basis-Daten ohne Enrichment ── */
  private placeToBasicResult(
    place: GooglePlace,
    query: string,
    location: string,
    country: string,
  ): ScraperResult {
    const addressParts = this.parseAddress(place.formattedAddress || "", country);
    return {
      company: place.displayName?.text || "",
      name: null,
      email: null,
      phone: place.internationalPhoneNumber || place.nationalPhoneNumber || null,
      website: (place.websiteUri || "").replace(/\/$/, "") || null,
      address: place.formattedAddress || null,
      street: addressParts.street || null,
      city: addressParts.city || location,
      postal_code: addressParts.postalCode || null,
      country: addressParts.country || country,
      industry: query,
      ceo_name: null,
      google_place_id: place.id || null,
      google_rating: place.rating ?? null,
      google_reviews_count: place.userRatingCount ?? null,
      social_linkedin: null,
      social_facebook: null,
      social_instagram: null,
      social_xing: null,
      social_twitter: null,
      social_youtube: null,
      social_tiktok: null,
      raw_data: {
        source: "google-places-basic",
        google_maps_url: place.googleMapsUri || null,
        category: (place.types || []).join(", "),
      },
    };
  }
}

/* ══════════════════════════════════════════════════════════════
   Mock Provider (Fallback für Entwicklung)
   ══════════════════════════════════════════════════════════════ */

const FIRM_PREFIXES: Record<string, string[]> = {
  steuerberater: [
    "Steuerberatung", "Wirtschaftstreuhand", "Tax Consulting",
    "Steuer & Recht", "Finanz & Steuer",
  ],
  rechtsanwalt: [
    "Rechtsanwälte", "Kanzlei", "Law Office",
    "Anwaltskanzlei", "Rechtsberatung",
  ],
  zahnarzt: [
    "Zahnarztpraxis", "Dental Center", "Zahnmedizin",
    "Zahnarzt", "Dentalklinik",
  ],
  handwerker: [
    "Handwerksbetrieb", "Meisterbetrieb", "Bau & Handwerk",
    "Werkstatt", "Service GmbH",
  ],
  restaurant: [
    "Gasthaus", "Restaurant", "Wirtshaus", "Bistro", "Trattoria",
  ],
  default: ["GmbH", "OG", "KG", "e.U.", "AG"],
};

const LAST_NAMES = [
  "Müller", "Gruber", "Wagner", "Huber", "Pichler", "Steiner",
  "Moser", "Mayer", "Hofer", "Berger", "Fuchs", "Eder",
  "Fischer", "Schmid", "Winkler", "Weber", "Schwarz", "Maier",
  "Bauer", "Wolf",
];

const FIRST_NAMES = [
  "Thomas", "Michael", "Andreas", "Christian", "Stefan", "Wolfgang",
  "Markus", "Peter", "Martin", "Daniel", "Anna", "Maria",
  "Elisabeth", "Katharina", "Sandra", "Claudia", "Sabine", "Monika",
  "Eva", "Julia",
];

const STREETS: Record<string, string[]> = {
  wien: [
    "Kärntner Straße", "Mariahilfer Straße", "Stephansplatz",
    "Ringstraße", "Wollzeile", "Tuchlauben", "Graben",
    "Gonzagagasse", "Seilerstätte", "Singerstraße",
  ],
  graz: [
    "Herrengasse", "Hauptplatz", "Sporgasse", "Murgasse",
    "Jakominiplatz", "Annenstraße", "Leonhardstraße", "Glacisstraße",
  ],
  linz: [
    "Landstraße", "Hauptplatz", "Klosterstraße", "Herrenstraße",
    "Domgasse", "Bethlehemstraße", "Mozartstraße",
  ],
  salzburg: [
    "Getreidegasse", "Linzer Gasse", "Kaigasse",
    "Sigmund-Haffner-Gasse", "Mirabellplatz", "Rainerstraße",
  ],
  münchen: [
    "Maximilianstraße", "Leopoldstraße", "Sendlinger Straße",
    "Kaufingerstraße", "Sonnenstraße", "Schillerstraße",
  ],
  berlin: [
    "Friedrichstraße", "Kurfürstendamm", "Unter den Linden",
    "Kantstraße", "Torstraße", "Potsdamer Straße",
  ],
  default: [
    "Hauptstraße", "Bahnhofstraße", "Kirchengasse", "Marktplatz",
    "Schulstraße", "Gartenweg", "Industriestraße", "Parkgasse",
  ],
};

const POSTAL_CODES: Record<string, string[]> = {
  wien: ["1010", "1020", "1030", "1040", "1050", "1060", "1070", "1080", "1090"],
  graz: ["8010", "8020", "8036", "8042", "8045"],
  linz: ["4020", "4030", "4040"],
  salzburg: ["5020", "5023", "5026"],
  münchen: ["80331", "80333", "80335", "80339", "80469"],
  berlin: ["10115", "10117", "10178", "10179", "10435"],
  default: ["1000", "2000", "3000", "4000", "5000"],
};

const EMAIL_DOMAINS = [
  "gmail.com", "office.at", "aon.at", "gmx.at",
  "chello.at", "icloud.com", "outlook.com",
];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function detectIndustry(query: string): string {
  const q = query.toLowerCase();
  if (q.includes("steuerberater") || q.includes("steuer") || q.includes("wirtschaftstreuhand"))
    return "steuerberater";
  if (q.includes("rechtsanwalt") || q.includes("anwalt") || q.includes("kanzlei"))
    return "rechtsanwalt";
  if (q.includes("zahnarzt") || q.includes("dental") || q.includes("zahn"))
    return "zahnarzt";
  if (q.includes("handwerker") || q.includes("installateur") || q.includes("elektriker"))
    return "handwerker";
  if (q.includes("restaurant") || q.includes("gasthaus") || q.includes("lokal"))
    return "restaurant";
  return "default";
}

function normalizeLocation(location: string): string {
  return location.toLowerCase().trim().replace(/\s+/g, "");
}

export class MockScraperProvider implements ScraperProvider {
  name = "mock";

  async search(
    query: string,
    location: string,
    country: string,
  ): Promise<ScraperResult[]> {
    await new Promise((resolve) => setTimeout(resolve, randomInt(1000, 3000)));

    const industry = detectIndustry(query);
    const locKey = normalizeLocation(location);
    const prefixes = FIRM_PREFIXES[industry] ?? FIRM_PREFIXES.default;
    const streets = STREETS[locKey] ?? STREETS.default;
    const postalCodes = POSTAL_CODES[locKey] ?? POSTAL_CODES.default;

    const count = randomInt(5, 10);
    const results: ScraperResult[] = [];

    for (let i = 0; i < count; i++) {
      const lastName = randomItem(LAST_NAMES);
      const firstName = randomItem(FIRST_NAMES);
      const prefix = randomItem(prefixes);

      const company =
        industry === "default"
          ? `${lastName} ${prefix}`
          : `${prefix} ${lastName}`;

      const emailBase = lastName.toLowerCase()
        .replace(/ü/g, "ue").replace(/ö/g, "oe").replace(/ä/g, "ae");
      const domain = randomItem(EMAIL_DOMAINS);
      const streetNumber = randomInt(1, 120);
      const street = `${randomItem(streets)} ${streetNumber}`;
      const postalCode = randomItem(postalCodes);

      const websiteName = emailBase.replace(/\s/g, "-");
      const tld = country === "AT" ? ".at" : country === "DE" ? ".de" : ".com";

      results.push({
        company,
        name: `${firstName} ${lastName}`,
        email: `${emailBase}@${domain}`,
        phone: country === "AT"
          ? `+43 ${randomInt(1, 6)}${randomInt(60, 99)} ${randomInt(1000000, 9999999)}`
          : `+49 ${randomInt(30, 89)} ${randomInt(1000000, 9999999)}`,
        website: `https://www.${websiteName}${tld}`,
        address: `${street}, ${postalCode} ${location}`,
        street,
        city: location,
        postal_code: postalCode,
        country,
        industry: industry === "default" ? query : industry,
        ceo_name: `${firstName} ${lastName}`,
        google_place_id: `ChIJ${randomInt(100000000, 999999999)}`,
        google_rating: parseFloat((randomInt(30, 50) / 10).toFixed(1)),
        google_reviews_count: randomInt(3, 250),
        social_linkedin: null,
        social_facebook: null,
        social_instagram: null,
        social_xing: null,
        social_twitter: null,
        social_youtube: null,
        social_tiktok: null,
        raw_data: {
          source: "mock",
          query,
          location,
          generated_at: new Date().toISOString(),
        },
      });
    }

    return results;
  }
}

/* ── Provider Registry ── */

const providers: Record<string, ScraperProvider> = {
  mock: new MockScraperProvider(),
};

// Google Places + LangSearch Provider nur registrieren wenn Keys vorhanden
try {
  if (process.env.GOOGLE_PLACES_API_KEY && process.env.LANGSEARCH_API_KEY) {
    providers["google-langsearch"] = new GooglePlacesLangSearchProvider();
  }
} catch {
  console.warn("[Scraper] Google Places + LangSearch Provider konnte nicht initialisiert werden");
}

function getActiveProvider(): ScraperProvider {
  const providerName = process.env.SCRAPER_PROVIDER ?? "mock";
  const provider = providers[providerName];

  if (!provider) {
    throw new Error(
      `Unbekannter Scraper-Provider: "${providerName}". Verfügbar: ${Object.keys(providers).join(", ")}`,
    );
  }

  return provider;
}

/* ── Hauptfunktion ── */

export async function scrape(
  query: string,
  location: string,
  country: string = "AT",
): Promise<ScraperResult[]> {
  const provider = getActiveProvider();

  console.log(
    `[Scraper] Starte Suche mit Provider "${provider.name}": query="${query}", location="${location}", country="${country}"`,
  );

  const results = await provider.search(query, location, country);

  console.log(
    `[Scraper] Suche abgeschlossen: ${results.length} Ergebnisse gefunden`,
  );

  return results;
}

/* ── Provider registrieren (für Erweiterungen) ── */

export function registerProvider(provider: ScraperProvider): void {
  providers[provider.name] = provider;
}
