
-- Create forum_polls table
CREATE TABLE public.forum_polls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL,
  question TEXT NOT NULL,
  multiple_choice BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create forum_poll_options table
CREATE TABLE public.forum_poll_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID NOT NULL REFERENCES public.forum_polls(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  vote_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create forum_poll_votes table
CREATE TABLE public.forum_poll_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID NOT NULL REFERENCES public.forum_polls(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES public.forum_poll_options(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(poll_id, user_id) -- One vote per user per poll
);

-- Enable RLS on all poll tables
ALTER TABLE public.forum_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_poll_votes ENABLE ROW LEVEL SECURITY;

-- RLS policies for forum_polls
CREATE POLICY "Anyone can view forum polls" ON public.forum_polls
  FOR SELECT USING (true);

CREATE POLICY "Users can create polls for their posts" ON public.forum_polls
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.forum_posts 
      WHERE id = post_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own polls" ON public.forum_polls
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.forum_posts 
      WHERE id = post_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own polls" ON public.forum_polls
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.forum_posts 
      WHERE id = post_id AND user_id = auth.uid()
    )
  );

-- RLS policies for forum_poll_options
CREATE POLICY "Anyone can view poll options" ON public.forum_poll_options
  FOR SELECT USING (true);

CREATE POLICY "Users can create options for their polls" ON public.forum_poll_options
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.forum_polls fp
      JOIN public.forum_posts fp2 ON fp.post_id = fp2.id
      WHERE fp.id = poll_id AND fp2.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own poll options" ON public.forum_poll_options
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.forum_polls fp
      JOIN public.forum_posts fp2 ON fp.post_id = fp2.id
      WHERE fp.id = poll_id AND fp2.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own poll options" ON public.forum_poll_options
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.forum_polls fp
      JOIN public.forum_posts fp2 ON fp.post_id = fp2.id
      WHERE fp.id = poll_id AND fp2.user_id = auth.uid()
    )
  );

-- RLS policies for forum_poll_votes
CREATE POLICY "Anyone can view poll votes" ON public.forum_poll_votes
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own votes" ON public.forum_poll_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes" ON public.forum_poll_votes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes" ON public.forum_poll_votes
  FOR DELETE USING (auth.uid() = user_id);

-- Create trigger to update vote counts
CREATE OR REPLACE FUNCTION public.update_poll_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- Update vote count for the affected option
  IF TG_OP = 'INSERT' THEN
    UPDATE public.forum_poll_options 
    SET vote_count = vote_count + 1 
    WHERE id = NEW.option_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.forum_poll_options 
    SET vote_count = vote_count - 1 
    WHERE id = OLD.option_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
CREATE TRIGGER trigger_update_poll_vote_counts
  AFTER INSERT OR DELETE ON public.forum_poll_votes
  FOR EACH ROW EXECUTE FUNCTION public.update_poll_vote_counts();
