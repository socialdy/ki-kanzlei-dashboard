-- Kampagnen-Fehlermeldung: n8n schreibt Fehler hierher wenn Workflow crasht
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS error_message TEXT DEFAULT NULL;
