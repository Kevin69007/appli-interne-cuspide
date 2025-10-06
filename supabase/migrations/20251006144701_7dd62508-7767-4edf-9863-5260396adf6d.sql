-- Create protocols table
CREATE TABLE public.protocols (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  file_url TEXT,
  file_name TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on protocols
ALTER TABLE public.protocols ENABLE ROW LEVEL SECURITY;

-- Create protocols_profiles junction table
CREATE TABLE public.protocol_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  protocol_id UUID NOT NULL REFERENCES public.protocols(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(protocol_id, profile_id)
);

-- Enable RLS on protocol_profiles
ALTER TABLE public.protocol_profiles ENABLE ROW LEVEL SECURITY;

-- Create quiz table
CREATE TABLE public.quiz (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  file_url TEXT,
  file_name TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on quiz
ALTER TABLE public.quiz ENABLE ROW LEVEL SECURITY;

-- Create quiz_profiles junction table
CREATE TABLE public.quiz_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.quiz(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(quiz_id, profile_id)
);

-- Enable RLS on quiz_profiles
ALTER TABLE public.quiz_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for protocols
CREATE POLICY "Admins can manage protocols"
ON public.protocols
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view tagged protocols"
ON public.protocols
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM protocol_profiles pp
    JOIN profiles p ON p.id = pp.profile_id
    WHERE pp.protocol_id = protocols.id AND p.user_id = auth.uid()
  )
);

-- RLS Policies for protocol_profiles
CREATE POLICY "Admins can manage protocol tags"
ON public.protocol_profiles
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their protocol tags"
ON public.protocol_profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = protocol_profiles.profile_id AND p.user_id = auth.uid()
  )
);

-- RLS Policies for quiz
CREATE POLICY "Admins can manage quiz"
ON public.quiz
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view tagged quiz"
ON public.quiz
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM quiz_profiles qp
    JOIN profiles p ON p.id = qp.profile_id
    WHERE qp.quiz_id = quiz.id AND p.user_id = auth.uid()
  )
);

-- RLS Policies for quiz_profiles
CREATE POLICY "Admins can manage quiz tags"
ON public.quiz_profiles
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their quiz tags"
ON public.quiz_profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = quiz_profiles.profile_id AND p.user_id = auth.uid()
  )
);

-- Create storage bucket for protocols
INSERT INTO storage.buckets (id, name, public)
VALUES ('protocols', 'protocols', true);

-- Storage policies for protocols
CREATE POLICY "Admins can upload protocols"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'protocols' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Admins can update protocols"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'protocols' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Admins can delete protocols"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'protocols' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Authenticated users can view protocols"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'protocols');

-- Create storage bucket for quiz
INSERT INTO storage.buckets (id, name, public)
VALUES ('quiz', 'quiz', true);

-- Storage policies for quiz
CREATE POLICY "Admins can upload quiz"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'quiz' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Admins can update quiz"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'quiz' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Admins can delete quiz"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'quiz' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Authenticated users can view quiz"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'quiz');

-- Add update trigger for protocols
CREATE TRIGGER update_protocols_updated_at
BEFORE UPDATE ON public.protocols
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add update trigger for quiz
CREATE TRIGGER update_quiz_updated_at
BEFORE UPDATE ON public.quiz
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();