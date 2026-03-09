#!/usr/bin/env node
// ============================================================
// Test: Email-Flow lokal testen mit 2 Test-Leads
// Legt 2 Leads + 1 Testkampagne an, damit der n8n Workflow
// über das Dashboard getriggert werden kann.
//
// Usage: node test-email-flow.mjs
// ============================================================

const SUPABASE_URL = 'https://kvwjabdmmdthgbhimjqf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2d2phYmRtbWR0aGdiaGltanFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjAwNjYyMywiZXhwIjoyMDg3NTgyNjIzfQ.zALe211MgoaYme-1ianIM28SVFR4xA1LQLyiWRo4DeI';

const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation',
};

async function supabaseGet(table, filter = '') {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, { headers });
  return res.json();
}

async function supabasePost(table, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: { ...headers, 'Prefer': 'return=representation' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`POST ${table} fehlgeschlagen: ${err}`);
  }
  return res.json();
}

async function supabaseDelete(table, filter) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
    method: 'DELETE',
    headers: { ...headers, 'Prefer': 'return=minimal' },
  });
  if (!res.ok) {
    const err = await res.text();
    console.warn(`DELETE ${table} Warnung: ${err}`);
  }
}

// ── User ID ermitteln (erster User in auth.users) ──
async function getUserId() {
  // Über RPC oder direkt — wir nehmen den user_id aus bestehenden Leads
  const leads = await supabaseGet('leads', 'select=user_id&limit=1');
  if (leads.length > 0) return leads[0].user_id;

  // Fallback: aus campaigns
  const campaigns = await supabaseGet('campaigns', 'select=user_id&limit=1');
  if (campaigns.length > 0) return campaigns[0].user_id;

  throw new Error('Kein User gefunden. Bitte erst über das Dashboard einloggen.');
}

async function main() {
  console.log('🔧 Email-Flow Test Setup\n');

  // 1. User ID
  const userId = await getUserId();
  console.log(`👤 User ID: ${userId}\n`);

  // 2. Test-Leads
  const testLeads = [
    {
      name: 'KI Kanzlei Test GmbH',
      company: 'KI Kanzlei Test GmbH',
      company_name: 'KI Kanzlei Test GmbH',
      email: 'markus.wallner@ki-kanzlei.at',
      phone: '+43 664 1234567',
      website: 'https://www.ki-kanzlei.at',
      city: 'Wien',
      postal_code: '1010',
      street: 'Stephansplatz 1',
      country: 'AT',
      industry: 'Hotel',
      legal_form: 'GmbH',
      ceo_name: 'Markus Wallner',
      ceo_title: '',
      ceo_first_name: 'Markus',
      ceo_last_name: 'Wallner',
      ceo_gender: 'herr',
      user_id: userId,
    },
    {
      name: 'Wallner Test Hotel',
      company: 'Wallner Test Hotel',
      company_name: 'Wallner Test Hotel',
      email: 'markuswallner19@hotmail.com',
      phone: '+43 664 9876543',
      website: 'https://www.ki-kanzlei.at',
      city: 'Salzburg',
      postal_code: '5020',
      street: 'Getreidegasse 15',
      country: 'AT',
      industry: 'Hotel',
      legal_form: 'GmbH',
      ceo_name: 'Markus Wallner',
      ceo_title: '',
      ceo_first_name: 'Markus',
      ceo_last_name: 'Wallner',
      ceo_gender: 'herr',
      user_id: userId,
    },
  ];

  const leadIds = [];

  for (const lead of testLeads) {
    // Prüfen ob Lead schon existiert
    const existing = await supabaseGet('leads', `email=eq.${encodeURIComponent(lead.email)}&select=id`);

    if (existing.length > 0) {
      console.log(`✅ Lead existiert: ${lead.email} (${existing[0].id})`);
      leadIds.push(existing[0].id);
    } else {
      const [created] = await supabasePost('leads', lead);
      console.log(`➕ Lead erstellt: ${lead.email} (${created.id})`);
      leadIds.push(created.id);
    }
  }

  // 3. Alte Testkampagnen aufräumen
  const oldCampaigns = await supabaseGet('campaigns', `name=eq.${encodeURIComponent('[TEST] Email-Flow Test')}&select=id`);
  for (const old of oldCampaigns) {
    await supabaseDelete('campaign_leads', `campaign_id=eq.${old.id}`);
    await supabaseDelete('campaigns', `id=eq.${old.id}`);
    console.log(`🗑️  Alte Testkampagne entfernt: ${old.id}`);
  }

  // 4. Neue Testkampagne erstellen
  const [campaign] = await supabasePost('campaigns', {
    user_id: userId,
    name: '[TEST] Email-Flow Test',
    status: 'draft',
    total_count: leadIds.length,
    daily_limit: 10,
    delay_minutes: 1,  // Nur 1 Minute Verzögerung für Tests
    reply_to: 'info@ki-kanzlei.at',
  });
  console.log(`\n📧 Testkampagne erstellt: ${campaign.id}`);
  console.log(`   Name: ${campaign.name}`);
  console.log(`   Delay: ${campaign.delay_minutes} Minute(n)`);

  // 5. Campaign Leads verknüpfen
  const campaignLeads = leadIds.map(lead_id => ({
    campaign_id: campaign.id,
    lead_id,
    user_id: userId,
  }));

  const createdCLs = await supabasePost('campaign_leads', campaignLeads);
  console.log(`   Leads verknüpft: ${createdCLs.length}`);

  for (const cl of createdCLs) {
    console.log(`   - ${cl.id} (tracking: ${cl.tracking_token})`);
  }

  // 6. Zusammenfassung
  console.log('\n' + '='.repeat(60));
  console.log('✅ Test-Setup abgeschlossen!\n');
  console.log('Nächste Schritte:');
  console.log('1. Next.js Dev-Server starten: npm run dev');
  console.log('2. Dashboard öffnen: http://localhost:3000/dashboard/campaigns');
  console.log('3. Kampagne "[TEST] Email-Flow Test" starten');
  console.log('4. n8n Webhook URL muss in Einstellungen konfiguriert sein');
  console.log(`\nKampagne-ID: ${campaign.id}`);
  console.log('Test-Emails: markus.wallner@ki-kanzlei.at, markuswallner19@hotmail.com');
  console.log('\nTracking-Pixel URLs (lokal):');
  for (const cl of createdCLs) {
    console.log(`  http://localhost:3000/api/track/open/${cl.tracking_token}`);
  }
  console.log('='.repeat(60));
}

main().catch(err => {
  console.error('\n❌ Fehler:', err.message);
  process.exit(1);
});
