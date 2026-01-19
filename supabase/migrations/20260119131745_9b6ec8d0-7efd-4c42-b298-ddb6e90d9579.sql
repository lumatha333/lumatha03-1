-- Create reports table for Random Connect
CREATE TABLE IF NOT EXISTS public.random_connect_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID NOT NULL,
  reported_user_id UUID NOT NULL,
  session_id UUID REFERENCES public.random_connect_sessions(id),
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reconnect requests table
CREATE TABLE IF NOT EXISTS public.random_connect_reconnect_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.random_connect_sessions(id),
  requester_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours'),
  UNIQUE(session_id, requester_id)
);

-- Create session memories table for unified memory view
CREATE TABLE IF NOT EXISTS public.random_connect_memories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_id UUID NOT NULL REFERENCES public.random_connect_sessions(id),
  partner_pseudo_name TEXT NOT NULL,
  mode TEXT NOT NULL,
  duration_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours')
);

-- Enable RLS on all tables
ALTER TABLE public.random_connect_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.random_connect_reconnect_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.random_connect_memories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reports
CREATE POLICY "Users can create reports" 
ON public.random_connect_reports 
FOR INSERT 
WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own reports" 
ON public.random_connect_reports 
FOR SELECT 
USING (auth.uid() = reporter_id);

-- RLS Policies for reconnect requests
CREATE POLICY "Users can create reconnect requests" 
ON public.random_connect_reconnect_requests 
FOR INSERT 
WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can view their reconnect requests" 
ON public.random_connect_reconnect_requests 
FOR SELECT 
USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can update received requests" 
ON public.random_connect_reconnect_requests 
FOR UPDATE 
USING (auth.uid() = receiver_id);

-- RLS Policies for memories
CREATE POLICY "Users can create their own memories" 
ON public.random_connect_memories 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own memories" 
ON public.random_connect_memories 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own memories" 
ON public.random_connect_memories 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to check if user is banned (3+ unique reporters)
CREATE OR REPLACE FUNCTION public.check_random_connect_ban(check_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  unique_reporter_count INTEGER;
BEGIN
  SELECT COUNT(DISTINCT reporter_id) INTO unique_reporter_count
  FROM public.random_connect_reports
  WHERE reported_user_id = check_user_id;
  
  RETURN unique_reporter_count >= 3;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to get report count for a user
CREATE OR REPLACE FUNCTION public.get_random_connect_report_count(check_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  unique_reporter_count INTEGER;
BEGIN
  SELECT COUNT(DISTINCT reporter_id) INTO unique_reporter_count
  FROM public.random_connect_reports
  WHERE reported_user_id = check_user_id;
  
  RETURN unique_reporter_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update the violations table to track report-based bans
ALTER TABLE public.random_connect_violations 
ADD COLUMN IF NOT EXISTS report_ban BOOLEAN DEFAULT false;

-- Enable realtime for reconnect requests
ALTER PUBLICATION supabase_realtime ADD TABLE public.random_connect_reconnect_requests;