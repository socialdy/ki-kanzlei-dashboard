-- Migration: Sync company_name ↔ company + update_at trigger
-- Hintergrund: n8n schreibt company_name (AI-Output), Dashboard liest company.
-- Dieser Trigger hält beide Spalten synchron.
-- Run this in the Supabase SQL Editor

-- Trigger-Funktion: company_name → company
CREATE OR REPLACE FUNCTION fn_sync_company_name()
RETURNS TRIGGER AS $$
BEGIN
  -- n8n schreibt company_name, company ist leer → company befüllen
  IF (NEW.company IS NULL OR NEW.company = '') AND NEW.company_name IS NOT NULL THEN
    NEW.company := NEW.company_name;
  END IF;
  -- Dashboard schreibt company, company_name ist leer → company_name befüllen
  IF (NEW.company_name IS NULL OR NEW.company_name = '') AND NEW.company IS NOT NULL THEN
    NEW.company_name := NEW.company;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_company_name ON leads;
CREATE TRIGGER trg_sync_company_name
  BEFORE INSERT OR UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION fn_sync_company_name();

-- Trigger-Funktion: updated_at automatisch setzen
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_updated_at ON leads;
CREATE TRIGGER trg_set_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION fn_set_updated_at();

-- Bestehende Daten nachträglich synchronisieren
UPDATE leads
SET company = company_name
WHERE (company IS NULL OR company = '')
  AND company_name IS NOT NULL;
