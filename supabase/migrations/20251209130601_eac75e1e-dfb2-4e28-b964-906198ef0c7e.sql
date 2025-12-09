-- Ajouter le flag pour planning indéfini
ALTER TABLE work_schedules ADD COLUMN IF NOT EXISTS is_indefinite BOOLEAN DEFAULT false;

-- Ajouter un index pour performance
CREATE INDEX IF NOT EXISTS idx_work_schedules_indefinite ON work_schedules(is_indefinite) WHERE is_indefinite = true;