-- Create daily_mood table for gamified daily mood tracking
CREATE TABLE public.daily_mood (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  mood_emoji TEXT NOT NULL,
  mood_label TEXT NOT NULL,
  need_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(employee_id, date)
);

-- Enable RLS
ALTER TABLE public.daily_mood ENABLE ROW LEVEL SECURITY;

-- Employees can view their own daily mood
CREATE POLICY "Employees can view their own daily mood"
ON public.daily_mood
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM employees
    WHERE employees.id = daily_mood.employee_id
    AND employees.user_id = auth.uid()
  )
);

-- Employees can insert their own daily mood
CREATE POLICY "Employees can insert their own daily mood"
ON public.daily_mood
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM employees
    WHERE employees.id = daily_mood.employee_id
    AND employees.user_id = auth.uid()
  )
);

-- Admins and managers can view all daily moods
CREATE POLICY "Admins and managers can view all daily moods"
ON public.daily_mood
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR is_manager()
);

-- Create daily_quotes table for personalized quotes
CREATE TABLE public.daily_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_text TEXT NOT NULL,
  author TEXT,
  category TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.daily_quotes ENABLE ROW LEVEL SECURITY;

-- Everyone can view active quotes
CREATE POLICY "Everyone can view active quotes"
ON public.daily_quotes
FOR SELECT
USING (is_active = true);

-- Admins can manage quotes
CREATE POLICY "Admins can manage quotes"
ON public.daily_quotes
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Pre-populate with diverse quotes
INSERT INTO public.daily_quotes (quote_text, author, category) VALUES
-- Motivation
('Le succès c''est d''aller d''échec en échec sans perdre son enthousiasme.', 'Winston Churchill', 'motivation'),
('L''énergie et la persévérance conquièrent toutes choses.', 'Benjamin Franklin', 'motivation'),
('Le seul moyen de faire du bon travail est d''aimer ce que vous faites.', 'Steve Jobs', 'motivation'),
('La différence entre l''ordinaire et l''extraordinaire, c''est ce petit "extra".', 'Jimmy Johnson', 'motivation'),
('Ne laissez pas hier prendre trop de place dans votre aujourd''hui.', 'Will Rogers', 'motivation'),

-- Gaieté
('Un jour sans rire est un jour perdu.', 'Charlie Chaplin', 'joy'),
('La joie est en tout ; il faut savoir l''extraire.', 'Confucius', 'joy'),
('Être heureux ne signifie pas que tout est parfait, cela signifie que vous avez décidé de voir au-delà des imperfections.', 'Anonyme', 'joy'),
('Le rire est le soleil qui chasse l''hiver du visage humain.', 'Victor Hugo', 'joy'),
('Riez et le monde rira avec vous.', 'Ella Wheeler Wilcox', 'joy'),

-- Info insolite
('Les pieuvres ont 3 cœurs et leur sang est bleu !', 'Fait scientifique', 'fun_fact'),
('Le miel ne se périme jamais. Des archéologues ont trouvé du miel vieux de 3000 ans dans des tombes égyptiennes, toujours comestible !', 'Fait historique', 'fun_fact'),
('Une journée sur Vénus dure plus longtemps qu''une année sur Vénus !', 'Fait astronomique', 'fun_fact'),
('Les bananes sont des baies, mais les fraises ne le sont pas !', 'Fait botanique', 'fun_fact'),
('Il y a plus d''étoiles dans l''univers que de grains de sable sur toutes les plages de la Terre.', 'Fait cosmique', 'fun_fact'),

-- Zen
('La paix vient de l''intérieur. Ne la cherchez pas à l''extérieur.', 'Bouddha', 'calm'),
('Dans le calme de la nature, l''homme trouve l''inspiration.', 'Anonyme', 'calm'),
('Respirer est vivre, vivre est respirer.', 'Proverbe indien', 'calm'),
('Le silence est la meilleure réponse à beaucoup de choses.', 'Anonyme', 'calm'),
('Prends le temps de t''arrêter pour voir où tu vas.', 'Proverbe', 'calm'),

-- Énergie
('L''action est la clé fondamentale de tout succès.', 'Pablo Picasso', 'energy'),
('Commence où tu es. Utilise ce que tu as. Fais ce que tu peux.', 'Arthur Ashe', 'energy'),
('Le mouvement c''est la vie, l''immobilité c''est la mort.', 'Proverbe', 'energy'),
('Chaque matin nous naissons à nouveau. Ce que nous faisons aujourd''hui importe le plus.', 'Bouddha', 'energy'),
('L''énergie que tu donnes à quelque chose détermine ce que cette chose devient.', 'Anonyme', 'energy');

-- Create index for better performance
CREATE INDEX idx_daily_mood_employee_date ON public.daily_mood(employee_id, date DESC);
CREATE INDEX idx_daily_quotes_category ON public.daily_quotes(category, is_active);