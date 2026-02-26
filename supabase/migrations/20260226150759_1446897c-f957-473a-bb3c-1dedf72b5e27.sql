
-- Chat settings per user per chat
CREATE TABLE public.chat_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  chat_user_id UUID NOT NULL,
  theme_color TEXT DEFAULT 'default',
  emoji_reaction TEXT DEFAULT '❤️',
  is_muted BOOLEAN DEFAULT false,
  mute_until TIMESTAMP WITH TIME ZONE,
  is_archived BOOLEAN DEFAULT false,
  is_private BOOLEAN DEFAULT false,
  disappear_timer INTEGER DEFAULT 0,
  wallpaper TEXT,
  nickname TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, chat_user_id)
);

ALTER TABLE public.chat_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own chat settings" ON public.chat_settings FOR ALL USING (auth.uid() = user_id);

-- Add reply_to_id and edited_at to messages
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES public.messages(id) ON DELETE SET NULL;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS deleted_for JSONB DEFAULT '[]'::jsonb;

-- Group chats table
CREATE TABLE public.chat_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  avatar_url TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.chat_groups ENABLE ROW LEVEL SECURITY;

-- Group members
CREATE TABLE public.chat_group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.chat_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(group_id, user_id)
);

ALTER TABLE public.chat_group_members ENABLE ROW LEVEL SECURITY;

-- Group messages
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.chat_groups(id) ON DELETE CASCADE;

-- RLS for groups - members can see their groups
CREATE POLICY "Members can view their groups" ON public.chat_groups FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.chat_group_members WHERE group_id = chat_groups.id AND user_id = auth.uid()));

CREATE POLICY "Users can create groups" ON public.chat_groups FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admin can update groups" ON public.chat_groups FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.chat_group_members WHERE group_id = chat_groups.id AND user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admin can delete groups" ON public.chat_groups FOR DELETE
  USING (auth.uid() = created_by);

-- RLS for group members
CREATE POLICY "Members can view group members" ON public.chat_group_members FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.chat_group_members gm WHERE gm.group_id = chat_group_members.group_id AND gm.user_id = auth.uid()));

CREATE POLICY "Admin can manage members" ON public.chat_group_members FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.chat_group_members gm WHERE gm.group_id = chat_group_members.group_id AND gm.user_id = auth.uid() AND gm.role = 'admin')
    OR auth.uid() = user_id);

CREATE POLICY "Admin can remove members" ON public.chat_group_members FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.chat_group_members gm WHERE gm.group_id = chat_group_members.group_id AND gm.user_id = auth.uid() AND gm.role = 'admin')
    OR auth.uid() = user_id);

-- Message reactions table (persistent)
CREATE TABLE public.message_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view message reactions" ON public.message_reactions FOR SELECT USING (true);
CREATE POLICY "Users can add reactions" ON public.message_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove own reactions" ON public.message_reactions FOR DELETE USING (auth.uid() = user_id);

-- Typing indicators (ephemeral via realtime, but need a presence table)
CREATE TABLE public.typing_indicators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  chat_user_id UUID,
  group_id UUID REFERENCES public.chat_groups(id) ON DELETE CASCADE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.typing_indicators ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage typing" ON public.typing_indicators FOR ALL USING (true);

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.typing_indicators;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_settings;
