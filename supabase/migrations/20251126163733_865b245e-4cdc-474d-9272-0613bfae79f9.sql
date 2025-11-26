-- Add statut column to notifications table for managing notification states
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS statut TEXT DEFAULT 'actif' CHECK (statut IN ('actif', 'valide', 'supprime'));

-- Update existing notifications to have 'actif' status
UPDATE notifications 
SET statut = 'actif' 
WHERE statut IS NULL;

-- Create indexes for optimized queries
CREATE INDEX IF NOT EXISTS idx_notifications_employee_statut 
ON notifications(employee_id, statut);

CREATE INDEX IF NOT EXISTS idx_notifications_created_at 
ON notifications(created_at DESC);

-- Add comment for documentation
COMMENT ON COLUMN notifications.statut IS 'Statut de la notification: actif (visible), valide (archivée), supprime (soft delete)';