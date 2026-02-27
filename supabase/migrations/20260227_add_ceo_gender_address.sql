-- Migration: Add ceo_gender and address fields to leads table
-- Run this in the Supabase SQL Editor

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS ceo_gender text,
  ADD COLUMN IF NOT EXISTS address    text;

COMMENT ON COLUMN leads.ceo_gender IS 'Anrede/Geschlecht des Geschäftsführers: herr | frau | keine_angabe';
COMMENT ON COLUMN leads.address    IS 'Straße und Hausnummer des Unternehmens';
