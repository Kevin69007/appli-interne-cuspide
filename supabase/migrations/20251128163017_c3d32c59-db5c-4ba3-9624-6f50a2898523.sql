-- Add new value to destinataire_type enum for selecting specific employees
-- This must be done in a separate transaction before using the value
ALTER TYPE destinataire_type ADD VALUE IF NOT EXISTS 'selection_employes';