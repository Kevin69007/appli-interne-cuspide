-- Ajouter la colonne pour suivre les commentaires d'avancement
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS last_progress_comment_at TIMESTAMPTZ;

-- Index pour optimiser les requêtes de l'edge function
CREATE INDEX IF NOT EXISTS idx_tasks_priority_tracking ON tasks(is_priority, last_progress_comment_at) 
WHERE is_priority = true AND statut IN ('en_cours', 'a_venir');