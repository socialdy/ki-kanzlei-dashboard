/* ── API Route: POST /api/leads/search ──
 * Neue Lead-Suche starten: Erstellt einen SearchJob und triggert den n8n Workflow.
 * Fallback auf lokalen Scraper wenn kein n8n konfiguriert.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  createSearchJob,
  getSearchJobs,
  updateSearchJobStatus,
  insertLeads,
} from "@/lib/supabase/leads";
import { scrape } from "@/lib/scraper/service";
import type { LeadInsert } from "@/types/leads";
import type { ScraperResult } from "@/lib/scraper/service";

/* ── GET: Alle Search Jobs des Users abrufen ── */
export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Nicht authentifiziert" },
        { status: 401 },
      );
    }

    const jobs = await getSearchJobs();
    return NextResponse.json({ data: jobs });
  } catch (error) {
    console.error("[API GET /api/leads/search] Fehler:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 },
    );
  }
}

/* ── POST: Neue Suche starten ── */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Authentifizierung prüfen
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Nicht authentifiziert" },
        { status: 401 },
      );
    }

    // Request-Body parsen und validieren
    let body: { query?: string; location?: string; country?: string; company_type?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Ungültiger JSON-Body" },
        { status: 400 },
      );
    }

    const { query, location, country = "AT", company_type = "all" } = body;

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return NextResponse.json(
        { error: "Suchbegriff (query) ist erforderlich" },
        { status: 400 },
      );
    }

    if (!location || typeof location !== "string" || location.trim().length === 0) {
      return NextResponse.json(
        { error: "Standort (location) ist erforderlich" },
        { status: 400 },
      );
    }

    // SearchJob in der Datenbank erstellen
    const searchJob = await createSearchJob({
      user_id: user.id,
      query: query.trim(),
      location: location.trim(),
      country,
    });

    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;

    if (n8nWebhookUrl) {
      // n8n Workflow triggern
      triggerN8nWorkflow(
        n8nWebhookUrl,
        searchJob.id,
        user.id,
        query.trim(),
        location.trim(),
        country,
        company_type,
      );
    } else {
      // Fallback: Lokaler Scraper
      runScraperAsync(searchJob.id, user.id, query.trim(), location.trim(), country);
    }

    return NextResponse.json(
      { data: searchJob },
      { status: 201 },
    );
  } catch (error) {
    console.error("[API /api/leads/search] Fehler:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 },
    );
  }
}

/* ── n8n Webhook triggern ──
 * Sendet alle nötigen Daten an den n8n Workflow.
 * n8n übernimmt: Google Places → Website Scraping → LangSearch → AI → Supabase Insert
 */
async function triggerN8nWorkflow(
  webhookUrl: string,
  jobId: string,
  userId: string,
  query: string,
  location: string,
  country: string,
  companyType: string = "all",
): Promise<void> {
  try {
    console.log(`[n8n] Triggere Workflow: "${query} in ${location}" (Job: ${jobId}, Filter: ${companyType})`);

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        job_id: jobId,
        user_id: userId,
        query,
        location,
        country,
        company_type: companyType ?? "all",
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[n8n] Webhook Fehler (${response.status}):`, errText);

      // Job als failed markieren wenn n8n nicht erreichbar
      await updateSearchJobStatus(jobId, "failed", {
        error_message: `n8n Webhook Fehler: ${response.status}`,
        completed_at: new Date().toISOString(),
      });
    } else {
      console.log(`[n8n] Workflow gestartet für Job ${jobId}`);
    }
  } catch (error) {
    console.error(`[n8n] Webhook nicht erreichbar:`, error);

    // Fallback auf lokalen Scraper
    console.log(`[n8n] Fallback auf lokalen Scraper für Job ${jobId}`);
    runScraperAsync(jobId, userId, query, location, country);
  }
}

/* ── Fallback: Lokaler Scraper ──
 * Wird verwendet wenn n8n nicht erreichbar ist.
 */
async function runScraperAsync(
  jobId: string,
  userId: string,
  query: string,
  location: string,
  country: string,
): Promise<void> {
  try {
    await updateSearchJobStatus(jobId, "running", {
      started_at: new Date().toISOString(),
    });

    const results = await scrape(query, location, country);

    const leads: LeadInsert[] = results.map((result: ScraperResult) => ({
      company: result.company,
      company_name: null,
      name: result.name,
      email: result.email,
      phone: result.phone,
      website: result.website,
      address: result.address,
      street: result.street,
      city: result.city,
      postal_code: result.postal_code,
      country: result.country,
      category: null,
      industry: result.industry,
      legal_form: null,
      employee_count: null,
      ceo_name: result.ceo_name,
      ceo_title: null,
      ceo_first_name: null,
      ceo_last_name: null,
      ceo_gender: null,
      ceo_source: null,
      google_place_id: result.google_place_id,
      google_rating: result.google_rating,
      google_reviews_count: result.google_reviews_count,
      social_linkedin: (result.raw_data?.social_linkedin as string) || null,
      social_facebook: (result.raw_data?.social_facebook as string) || null,
      social_instagram: (result.raw_data?.social_instagram as string) || null,
      social_xing: (result.raw_data?.social_xing as string) || null,
      social_twitter: (result.raw_data?.social_twitter as string) || null,
      social_youtube: (result.raw_data?.social_youtube as string) || null,
      social_tiktok: (result.raw_data?.social_tiktok as string) || null,
      status: "new" as const,
      search_query: query,
      search_location: location,
      search_job_id: jobId,
      raw_data: result.raw_data,
      user_id: userId,
    }));

    if (leads.length > 0) {
      await insertLeads(leads);
    }

    await updateSearchJobStatus(jobId, "completed", {
      results_count: leads.length,
      completed_at: new Date().toISOString(),
    });

    console.log(
      `[Scraper] Job ${jobId} abgeschlossen: ${leads.length} Leads gespeichert`,
    );
  } catch (error) {
    console.error(`[Scraper] Job ${jobId} fehlgeschlagen:`, error);

    const errorMessage =
      error instanceof Error ? error.message : "Unbekannter Fehler";
    await updateSearchJobStatus(jobId, "failed", {
      error_message: errorMessage,
      completed_at: new Date().toISOString(),
    });
  }
}
