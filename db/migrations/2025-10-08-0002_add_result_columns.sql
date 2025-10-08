-- Add result columns to store pipeline outcomes
ALTER TABLE content_intents
ADD COLUMN IF NOT EXISTS preview_url text,
ADD COLUMN IF NOT EXISTS scheduled_time timestamptz;

