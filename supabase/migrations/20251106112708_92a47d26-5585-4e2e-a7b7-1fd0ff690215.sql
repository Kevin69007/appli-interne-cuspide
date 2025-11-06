-- Table pour les votes du collègue du mois
CREATE TABLE public.colleague_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voter_employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  voted_for_employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  mois INTEGER NOT NULL CHECK (mois BETWEEN 1 AND 12),
  annee INTEGER NOT NULL CHECK (annee >= 2024),
  commentaire TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(voter_employee_id, mois, annee),
  CHECK (voter_employee_id != voted_for_employee_id)
);

CREATE INDEX idx_colleague_votes_period ON public.colleague_votes(mois, annee);
CREATE INDEX idx_colleague_votes_voted_for ON public.colleague_votes(voted_for_employee_id);

-- RLS pour colleague_votes
ALTER TABLE public.colleague_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employés peuvent insérer leur vote"
  ON public.colleague_votes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.employees
      WHERE id = voter_employee_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Employés peuvent voir leur vote"
  ON public.colleague_votes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.employees
      WHERE id = voter_employee_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins peuvent voir tous les votes"
  ON public.colleague_votes FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR is_manager());

CREATE POLICY "Admins peuvent gérer les votes"
  ON public.colleague_votes FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Table pour les notes de mood
CREATE TABLE public.mood_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  mois INTEGER NOT NULL CHECK (mois BETWEEN 1 AND 12),
  annee INTEGER NOT NULL CHECK (annee >= 2024),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  commentaire TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(employee_id, mois, annee)
);

CREATE INDEX idx_mood_ratings_period ON public.mood_ratings(mois, annee);

-- RLS pour mood_ratings
ALTER TABLE public.mood_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employés peuvent insérer leur mood"
  ON public.mood_ratings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.employees
      WHERE id = employee_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Employés peuvent modifier leur mood"
  ON public.mood_ratings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.employees
      WHERE id = employee_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Employés peuvent voir leur mood"
  ON public.mood_ratings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.employees
      WHERE id = employee_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins peuvent voir tous les moods"
  ON public.mood_ratings FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR is_manager());

-- Ajouter configuration pour les points du collègue du mois
INSERT INTO public.configuration (cle, categorie, valeur, description)
VALUES (
  'colleague_vote_bonus',
  'objectifs',
  '{"points": 20}'::jsonb,
  'Points bonus attribués au collègue du mois élu par vote'
)
ON CONFLICT (cle) DO NOTHING;