
-- Delete duplicate entry for 15/12/2025
DELETE FROM agenda_entries WHERE id = '8bb0ea8c-f3b8-4820-b73c-d7824a2ca8ac';

-- Add missing entry for 19/12/2025
INSERT INTO agenda_entries (employee_id, date, categorie, type_absence, detail, statut_validation, points)
VALUES ('8b6251f9-1efb-4cf6-b9a0-d18e48909f85', '2025-12-19', 'absence', 'demande_conges', 'Du 15/12/2025 au 19/12/2025', 'valide', 0);
