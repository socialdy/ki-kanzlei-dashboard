-- Migration: Add legal_form, street, employee_count, CEO-Felder + make company_name nullable
-- Run this in the Supabase SQL Editor

-- Neue Spalten
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS legal_form       text,
  ADD COLUMN IF NOT EXISTS street           text,
  ADD COLUMN IF NOT EXISTS employee_count   integer,
  ADD COLUMN IF NOT EXISTS ceo_title        text,
  ADD COLUMN IF NOT EXISTS ceo_first_name   text,
  ADD COLUMN IF NOT EXISTS ceo_last_name    text;

-- company_name NOT NULL aufheben (n8n schreibt company, nicht company_name)
ALTER TABLE leads ALTER COLUMN company_name DROP NOT NULL;

-- ceo_position entfernen falls vorhanden
ALTER TABLE leads DROP COLUMN IF EXISTS ceo_position;

COMMENT ON COLUMN leads.legal_form     IS 'Rechtsform: GmbH | AG | OG | KG | GmbH & Co KG | e.U. | ...';
COMMENT ON COLUMN leads.street         IS 'Straße + Hausnummer aus AI-Extraktion';
COMMENT ON COLUMN leads.employee_count IS 'Mitarbeiterzahl (AI-Schätzung)';
COMMENT ON COLUMN leads.ceo_title      IS 'Akadem. Titel: Mag. | Dr. | Ing. | DI | etc. (nullable)';
COMMENT ON COLUMN leads.ceo_first_name IS 'Vorname des Ansprechpartners';
COMMENT ON COLUMN leads.ceo_last_name  IS 'Nachname des Ansprechpartners';
