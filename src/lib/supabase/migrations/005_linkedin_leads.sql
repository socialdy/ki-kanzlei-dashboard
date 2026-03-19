-- Migration: LinkedIn Leads table + Unipile settings columns

CREATE TABLE linkedin_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  -- LinkedIn-Profildaten
  linkedin_url TEXT NOT NULL,
  linkedin_id TEXT,
  full_name TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  headline TEXT,
  company TEXT,
  position TEXT,
  location TEXT,
  profile_picture_url TEXT,
  industry TEXT,
  -- Outreach-Status
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new','analyzed','queued','invited','accepted','messaged','replied','declined','error')),
  connection_sent_at TIMESTAMPTZ,
  connection_accepted_at TIMESTAMPTZ,
  follow_up_sent_at TIMESTAMPTZ,
  last_message_at TIMESTAMPTZ,
  -- AI-Analyse
  ai_summary TEXT,
  ai_score INTEGER CHECK (ai_score BETWEEN 0 AND 100),
  -- Nachrichten
  invite_message TEXT,
  follow_up_message TEXT,
  -- Verknüpfung
  matched_lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  search_query TEXT,
  -- Meta
  error_message TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, linkedin_url)
);

CREATE INDEX idx_linkedin_leads_user_status ON linkedin_leads(user_id, status);
CREATE INDEX idx_linkedin_leads_user_created ON linkedin_leads(user_id, created_at DESC);

-- RLS
ALTER TABLE linkedin_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own linkedin_leads" ON linkedin_leads
  FOR ALL USING (auth.uid() = user_id);

-- Unipile/LinkedIn settings columns
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS unipile_api_key TEXT;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS unipile_dsn TEXT;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS unipile_account_id TEXT;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS linkedin_daily_limit INTEGER DEFAULT 25;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS linkedin_auto_outreach BOOLEAN DEFAULT false;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS linkedin_follow_up_days INTEGER DEFAULT 3;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS linkedin_sender_profile JSONB;
