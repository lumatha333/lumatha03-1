-- Random Connect Queue - Users waiting to be matched
CREATE TABLE public.random_connect_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('audio', 'video', 'text')),
  language TEXT DEFAULT 'en',
  region TEXT DEFAULT 'international',
  pseudo_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Random Connect Active Sessions
CREATE TABLE public.random_connect_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id UUID NOT NULL,
  user2_id UUID NOT NULL,
  user1_pseudo_name TEXT NOT NULL,
  user2_pseudo_name TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('audio', 'video', 'text')),
  conversation_starter TEXT,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended', 'skipped'))
);

-- Random Connect Violations (for screenshot/recording detection)
CREATE TABLE public.random_connect_violations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  violation_type TEXT NOT NULL CHECK (violation_type IN ('screenshot', 'recording')),
  violation_count INTEGER NOT NULL DEFAULT 1,
  last_violation_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  banned_until TIMESTAMP WITH TIME ZONE,
  permanent_ban BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Random Connect Text Memory (anonymized, last 20 chats per user)
CREATE TABLE public.random_connect_text_memory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_own_message BOOLEAN NOT NULL DEFAULT true,
  session_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Random Connect Messages (for active text sessions)
CREATE TABLE public.random_connect_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.random_connect_sessions(id) ON DELETE CASCADE,
  sender_pseudo_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.random_connect_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.random_connect_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.random_connect_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.random_connect_text_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.random_connect_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Queue
CREATE POLICY "Users can manage their own queue entry" ON public.random_connect_queue
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can see others in queue for matching" ON public.random_connect_queue
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- RLS Policies for Sessions
CREATE POLICY "Users can view their own sessions" ON public.random_connect_sessions
  FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can create sessions" ON public.random_connect_sessions
  FOR INSERT WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can update their own sessions" ON public.random_connect_sessions
  FOR UPDATE USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- RLS Policies for Violations
CREATE POLICY "Users can view their own violations" ON public.random_connect_violations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage violations" ON public.random_connect_violations
  FOR ALL USING (auth.uid() IS NOT NULL);

-- RLS Policies for Text Memory
CREATE POLICY "Users can manage their own text memory" ON public.random_connect_text_memory
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for Messages
CREATE POLICY "Session participants can view messages" ON public.random_connect_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.random_connect_sessions s
      WHERE s.id = session_id AND (s.user1_id = auth.uid() OR s.user2_id = auth.uid())
    )
  );

CREATE POLICY "Session participants can send messages" ON public.random_connect_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.random_connect_sessions s
      WHERE s.id = session_id AND (s.user1_id = auth.uid() OR s.user2_id = auth.uid())
    )
  );

-- Enable realtime for sessions and messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.random_connect_queue;
ALTER PUBLICATION supabase_realtime ADD TABLE public.random_connect_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.random_connect_messages;

-- Create indexes for performance
CREATE INDEX idx_random_connect_queue_mode ON public.random_connect_queue(mode);
CREATE INDEX idx_random_connect_queue_user ON public.random_connect_queue(user_id);
CREATE INDEX idx_random_connect_sessions_users ON public.random_connect_sessions(user1_id, user2_id);
CREATE INDEX idx_random_connect_sessions_status ON public.random_connect_sessions(status);
CREATE INDEX idx_random_connect_violations_user ON public.random_connect_violations(user_id);
CREATE INDEX idx_random_connect_text_memory_user ON public.random_connect_text_memory(user_id);