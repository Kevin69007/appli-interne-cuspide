-- Migration: Renommer objectifs en indicateurs et ajouter justifications

-- 1. Renommer les colonnes dans les tables
ALTER TABLE agenda_entries 
  RENAME COLUMN points_objectif TO points_indicateur;

ALTER TABLE monthly_scores 
  RENAME COLUMN score_objectifs TO score_indicateurs;

-- 2. Mettre à jour la configuration
UPDATE configuration 
SET cle = 'indicateurs_points_total' 
WHERE cle = 'objectifs_points_total';

-- 3. Renommer la valeur enum dans categorie_agenda
ALTER TYPE categorie_agenda RENAME VALUE 'objectifs' TO 'indicateurs';

-- 4. Ajouter colonnes de justification à agenda_entries
ALTER TABLE agenda_entries
ADD COLUMN IF NOT EXISTS raison_ecart TEXT CHECK (raison_ecart IN ('indicateur_trop_eleve', 'volume_travail_insuffisant', 'probleme_exceptionnel')),
ADD COLUMN IF NOT EXISTS detail_probleme TEXT,
ADD COLUMN IF NOT EXISTS manager_notifie BOOLEAN DEFAULT FALSE;

-- 5. Index pour performances
CREATE INDEX IF NOT EXISTS idx_agenda_entries_raison_ecart ON agenda_entries(raison_ecart);

-- 6. Ajouter configuration pour délai de retard (24h)
INSERT INTO configuration (cle, categorie, valeur, description)
VALUES (
  'delai_retard_taches', 
  'taches', 
  '24',
  'Nombre d''heures après l''échéance avant qu''une tâche soit considérée en retard'
)
ON CONFLICT (cle) DO UPDATE SET valeur = '24';