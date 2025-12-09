-- Add request_group_id to link leave request entries together
ALTER TABLE agenda_entries 
ADD COLUMN IF NOT EXISTS request_group_id UUID;

-- Index for performance when querying by request_group_id
CREATE INDEX IF NOT EXISTS idx_agenda_entries_request_group ON agenda_entries(request_group_id);