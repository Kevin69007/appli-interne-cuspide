-- Nettoyage des demandes de congés orphelines
-- Ces entrées sont restées bloquées avec le statut 'en_attente' car elles ont été créées
-- avant la mise en place complète du système de validation

DELETE FROM public.agenda_entries
WHERE id IN (
  'ddd08367-b27b-4cd7-9f08-57241f62b640',
  '552480b6-f065-4e15-8756-da42a09dcb93'
);