-- Create enum types for game system
CREATE TYPE game_status AS ENUM ('registration_open', 'waiting_anecdote', 'in_progress', 'finished', 'cancelled_no_anecdote');
CREATE TYPE game_role AS ENUM ('target', 'investigator');
CREATE TYPE vote_type AS ENUM ('elimination', 'anecdote_originality', 'clue_difficulty', 'final_suspect');

-- Table for game sessions
CREATE TABLE weekly_game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_number INTEGER NOT NULL,
  year INTEGER NOT NULL,
  status game_status NOT NULL DEFAULT 'registration_open',
  target_employee_id UUID REFERENCES employees(id),
  anecdote TEXT,
  anecdote_originality_score NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  
  UNIQUE(week_number, year)
);

ALTER TABLE weekly_game_sessions ENABLE ROW LEVEL SECURITY;

-- Table for game participants
CREATE TABLE game_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES weekly_game_sessions(id) ON DELETE CASCADE NOT NULL,
  employee_id UUID REFERENCES employees(id) NOT NULL,
  role game_role NOT NULL,
  is_eliminated BOOLEAN DEFAULT FALSE,
  elimination_date TIMESTAMPTZ,
  total_points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(session_id, employee_id)
);

ALTER TABLE game_participants ENABLE ROW LEVEL SECURITY;

-- Table for game clues
CREATE TABLE game_clues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES weekly_game_sessions(id) ON DELETE CASCADE NOT NULL,
  clue_number INTEGER NOT NULL CHECK (clue_number BETWEEN 1 AND 5),
  clue_text TEXT NOT NULL,
  difficulty_score NUMERIC DEFAULT 0,
  revealed_at TIMESTAMPTZ,
  is_revealed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(session_id, clue_number)
);

ALTER TABLE game_clues ENABLE ROW LEVEL SECURITY;

-- Table for game votes
CREATE TABLE game_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES weekly_game_sessions(id) ON DELETE CASCADE NOT NULL,
  voter_employee_id UUID REFERENCES employees(id) NOT NULL,
  vote_type vote_type NOT NULL,
  vote_day INTEGER CHECK (vote_day BETWEEN 1 AND 5),
  suspect_employee_id UUID REFERENCES employees(id),
  originality_rating INTEGER CHECK (originality_rating BETWEEN 1 AND 5),
  difficulty_rating INTEGER CHECK (difficulty_rating BETWEEN 1 AND 5),
  clue_id UUID REFERENCES game_clues(id),
  voted_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE game_votes ENABLE ROW LEVEL SECURITY;

-- Table for game rewards configuration
CREATE TABLE game_rewards_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_type TEXT NOT NULL UNIQUE,
  points_amount INTEGER NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE game_rewards_config ENABLE ROW LEVEL SECURITY;

-- Table for prize catalog
CREATE TABLE game_prize_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prize_name TEXT NOT NULL,
  prize_description TEXT,
  points_required INTEGER NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE game_prize_catalog ENABLE ROW LEVEL SECURITY;

-- Table for player statistics
CREATE TABLE game_player_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) UNIQUE NOT NULL,
  total_points INTEGER DEFAULT 0,
  times_as_target INTEGER DEFAULT 0,
  times_target_won INTEGER DEFAULT 0,
  times_investigator_won INTEGER DEFAULT 0,
  best_investigator_awards INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE game_player_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for weekly_game_sessions
CREATE POLICY "Everyone can view active sessions"
ON weekly_game_sessions FOR SELECT
USING (status IN ('registration_open', 'waiting_anecdote', 'in_progress', 'finished', 'cancelled_no_anecdote'));

CREATE POLICY "Target can update their anecdote"
ON weekly_game_sessions FOR UPDATE
USING (
  target_employee_id IN (
    SELECT id FROM employees WHERE user_id = auth.uid()
  )
  AND status = 'waiting_anecdote'
);

CREATE POLICY "Admins and managers can manage sessions"
ON weekly_game_sessions FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR is_manager());

-- RLS Policies for game_participants
CREATE POLICY "Everyone can view participants of active games"
ON game_participants FOR SELECT
USING (
  session_id IN (
    SELECT id FROM weekly_game_sessions 
    WHERE status IN ('registration_open', 'in_progress', 'finished', 'cancelled_no_anecdote')
  )
);

CREATE POLICY "Employees can register themselves"
ON game_participants FOR INSERT
WITH CHECK (
  employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
  AND session_id IN (SELECT id FROM weekly_game_sessions WHERE status = 'registration_open')
);

CREATE POLICY "Admins and managers can manage participants"
ON game_participants FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR is_manager());

-- RLS Policies for game_clues
CREATE POLICY "Everyone can view revealed clues"
ON game_clues FOR SELECT
USING (is_revealed = true);

CREATE POLICY "Target can insert clues"
ON game_clues FOR INSERT
WITH CHECK (
  session_id IN (
    SELECT id FROM weekly_game_sessions 
    WHERE target_employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
    AND status = 'waiting_anecdote'
  )
);

CREATE POLICY "Admins and managers can manage clues"
ON game_clues FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR is_manager());

-- RLS Policies for game_votes
CREATE POLICY "Employees can view their own votes"
ON game_votes FOR SELECT
USING (voter_employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid()));

CREATE POLICY "Employees can insert votes"
ON game_votes FOR INSERT
WITH CHECK (
  voter_employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
  AND session_id IN (SELECT id FROM weekly_game_sessions WHERE status = 'in_progress')
);

CREATE POLICY "Admins and managers can view all votes"
ON game_votes FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR is_manager());

-- RLS Policies for game_rewards_config
CREATE POLICY "Everyone can view rewards config"
ON game_rewards_config FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage rewards config"
ON game_rewards_config FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for game_prize_catalog
CREATE POLICY "Everyone can view available prizes"
ON game_prize_catalog FOR SELECT
USING (is_available = true);

CREATE POLICY "Admins can manage prize catalog"
ON game_prize_catalog FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for game_player_stats
CREATE POLICY "Everyone can view player stats"
ON game_player_stats FOR SELECT
USING (true);

CREATE POLICY "Admins and managers can manage player stats"
ON game_player_stats FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR is_manager());

-- Insert default reward configurations
INSERT INTO game_rewards_config (config_type, points_amount, description, is_active) VALUES
  ('target_win', 100, 'Points pour victoire Cible (non trouvée)', true),
  ('investigator_win', 50, 'Points pour victoire Enquêteur (Cible trouvée)', true),
  ('anecdote_bonus', 30, 'Bonus originalité anecdote (4-5 étoiles)', true),
  ('clue_bonus', 10, 'Bonus difficulté indice (4-5 étoiles par indice)', true),
  ('clue_penalty', -5, 'Malus indice trop difficile (1-2 étoiles par indice)', true),
  ('best_investigator', 20, 'Badge Meilleur Enquêteur du jour', true),
  ('target_no_submission_penalty', -50, 'Pénalité si Cible ne soumet pas anecdote à temps', true);

-- Create trigger for updating updated_at timestamps
CREATE OR REPLACE FUNCTION update_game_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER game_rewards_config_updated_at
BEFORE UPDATE ON game_rewards_config
FOR EACH ROW
EXECUTE FUNCTION update_game_updated_at();

CREATE TRIGGER game_player_stats_updated_at
BEFORE UPDATE ON game_player_stats
FOR EACH ROW
EXECUTE FUNCTION update_game_updated_at();