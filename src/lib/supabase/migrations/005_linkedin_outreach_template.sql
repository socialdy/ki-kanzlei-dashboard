-- Add outreach template column to user_settings
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS linkedin_outreach_template TEXT;
