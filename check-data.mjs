const SRK = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2d2phYmRtbWR0aGdiaGltanFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjAwNjYyMywiZXhwIjoyMDg3NTgyNjIzfQ.zALe211MgoaYme-1ianIM28SVFR4xA1LQLyiWRo4DeI";
const URL = "https://kvwjabdmmdthgbhimjqf.supabase.co";

const res = await fetch(`${URL}/rest/v1/leads?search_job_id=eq.ad26979d-fbd7-47fd-99ef-6f68cfbfb413&select=company,email,phone,ceo_name,ceo_gender,ceo_title,industry,legal_form,raw_data&order=created_at.asc`, {
  headers: { apikey: SRK, Authorization: `Bearer ${SRK}` }
});
const rows = await res.json();

let noCeo = 0;
for (const [i, r] of rows.entries()) {
  if (!r.ceo_name) noCeo++;
  console.log(`${i+1}. ${r.company}`);
  console.log(`   Email: ${r.email}`);
  console.log(`   Phone: ${r.phone}`);
  console.log(`   CEO: ${r.ceo_name || 'NICHT GEFUNDEN'} (${r.ceo_gender}) ${r.ceo_title || ''}`);
  console.log(`   Industry: ${r.industry} | Legal: ${r.legal_form}`);
  console.log(`   AI: ${r.raw_data?.ai_extraction ? 'ja' : 'nein'} | Confidence: ${r.raw_data?.confidence_score ?? '-'}`);
  console.log('');
}
console.log(`TOTAL: ${rows.length} | Ohne CEO: ${noCeo} (${(noCeo/rows.length*100).toFixed(0)}%)`);
