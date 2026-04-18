
-- Blocks table
CREATE TABLE public.blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID NOT NULL,
  blocked_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can block others" ON public.blocks FOR INSERT WITH CHECK (auth.uid() = blocker_id);
CREATE POLICY "Users can unblock" ON public.blocks FOR DELETE USING (auth.uid() = blocker_id);
CREATE POLICY "Users can view own blocks" ON public.blocks FOR SELECT USING (auth.uid() = blocker_id OR auth.uid() = blocked_id);

-- Add privacy fields to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS allow_messages_from TEXT DEFAULT 'friends';

-- Delete policy for notifications (missing)
CREATE POLICY "Users can delete own notifications" ON public.notifications FOR DELETE USING (auth.uid() = user_id);

-- Mutual friends function
CREATE OR REPLACE FUNCTION public.get_mutual_friends_count(user1 UUID, user2 UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER FROM (
    SELECT CASE WHEN sender_id = user1 THEN receiver_id ELSE sender_id END AS friend_id
    FROM friend_requests WHERE status = 'accepted' AND (sender_id = user1 OR receiver_id = user1)
    INTERSECT
    SELECT CASE WHEN sender_id = user2 THEN receiver_id ELSE sender_id END AS friend_id
    FROM friend_requests WHERE status = 'accepted' AND (sender_id = user2 OR receiver_id = user2)
  ) mutual
$$;

-- Check if user is blocked
CREATE OR REPLACE FUNCTION public.is_blocked(checker_id UUID, target_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.blocks
    WHERE (blocker_id = checker_id AND blocked_id = target_id)
       OR (blocker_id = target_id AND blocked_id = checker_id)
  )
$$;

-- Enable realtime for blocks
ALTER PUBLICATION supabase_realtime ADD TABLE public.blocks;
