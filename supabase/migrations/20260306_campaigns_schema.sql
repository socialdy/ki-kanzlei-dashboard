-- ══════════════════════════════════════════════════════════════
-- Campaigns & Campaign Leads Schema
-- ══════════════════════════════════════════════════════════════

-- campaigns Tabelle
CREATE TABLE IF NOT EXISTS public.campaigns (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL,
  name            text        NOT NULL,
  status          text        NOT NULL DEFAULT 'draft',  -- draft/active/paused/completed
  -- Zähler (von n8n/tracking aktualisiert)
  total_count     integer     NOT NULL DEFAULT 0,
  sent_count      integer     NOT NULL DEFAULT 0,
  failed_count    integer     NOT NULL DEFAULT 0,
  open_count      integer     NOT NULL DEFAULT 0,
  bounce_count    integer     NOT NULL DEFAULT 0,
  reply_count     integer     NOT NULL DEFAULT 0,
  -- Konfiguration
  daily_limit     integer     NOT NULL DEFAULT 200,
  delay_minutes   integer     NOT NULL DEFAULT 8,
  reply_to        text        NOT NULL DEFAULT 'info@ki-kanzlei.at',
  -- Zeitstempel
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  started_at      timestamptz,
  completed_at    timestamptz
);

-- campaign_leads Verbindungstabelle
CREATE TABLE IF NOT EXISTS public.campaign_leads (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id     uuid        NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  lead_id         uuid        NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id         uuid        NOT NULL,
  tracking_token  uuid        NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  status          text        NOT NULL DEFAULT 'pending', -- pending/sent/failed/opened/bounced/replied
  -- Email Content (von n8n befüllt)
  email_subject   text,
  email_text      text,
  sender_email    text,
  -- Tracking
  sent_at         timestamptz,
  open_count      integer     NOT NULL DEFAULT 0,
  first_opened_at timestamptz,
  last_opened_at  timestamptz,
  bounced_at      timestamptz,
  bounce_type     text,        -- hard/soft
  replied_at      timestamptz,
  reply_preview   text,
  -- Fehler
  error_message   text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON public.campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaign_leads_campaign_id ON public.campaign_leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_leads_lead_id ON public.campaign_leads(lead_id);
CREATE INDEX IF NOT EXISTS idx_campaign_leads_tracking_token ON public.campaign_leads(tracking_token);
CREATE INDEX IF NOT EXISTS idx_campaign_leads_status ON public.campaign_leads(status);

-- updated_at Trigger für campaigns
CREATE TRIGGER trg_campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- RLS
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "campaigns_owner" ON public.campaigns
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "campaign_leads_owner" ON public.campaign_leads
  FOR ALL USING (auth.uid() = user_id);
