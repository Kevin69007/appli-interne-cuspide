-- Create enum for job document categories
CREATE TYPE public.job_category AS ENUM ('Admin', 'Prothèse');

-- Create job_documents table
CREATE TABLE public.job_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category job_category NOT NULL,
  file_url TEXT,
  file_name TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create junction table for tagged profiles
CREATE TABLE public.job_document_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_document_id UUID REFERENCES public.job_documents(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(job_document_id, profile_id)
);

-- Enable RLS
ALTER TABLE public.job_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_document_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for job_documents
-- Admins can do everything
CREATE POLICY "Admins can manage job documents"
ON public.job_documents
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can only see documents they are tagged in
CREATE POLICY "Users can view tagged job documents"
ON public.job_documents
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.job_document_profiles jdp
    INNER JOIN public.profiles p ON p.id = jdp.profile_id
    WHERE jdp.job_document_id = job_documents.id
    AND p.user_id = auth.uid()
  )
);

-- RLS Policies for job_document_profiles
-- Admins can manage tags
CREATE POLICY "Admins can manage profile tags"
ON public.job_document_profiles
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can see their own tags
CREATE POLICY "Users can view their tags"
ON public.job_document_profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = job_document_profiles.profile_id
    AND p.user_id = auth.uid()
  )
);

-- Add updated_at trigger
CREATE TRIGGER update_job_documents_updated_at
BEFORE UPDATE ON public.job_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();