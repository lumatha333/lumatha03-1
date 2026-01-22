-- Create SECURITY DEFINER function for safe notification creation
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id uuid,
  p_type text,
  p_content text,
  p_link text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notification_id uuid;
  valid_types text[] := ARRAY['follow', 'like', 'comment', 'share', 'friend_request', 'mention', 'message', 'system'];
BEGIN
  -- Validate notification type
  IF NOT (p_type = ANY(valid_types)) THEN
    RAISE EXCEPTION 'Invalid notification type: %', p_type;
  END IF;
  
  -- Validate user_id exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'Invalid user_id';
  END IF;
  
  -- Prevent self-notifications (except for system type)
  IF p_type != 'system' AND p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot send notification to yourself';
  END IF;
  
  -- Validate content
  IF p_content IS NULL OR length(trim(p_content)) = 0 THEN
    RAISE EXCEPTION 'Content cannot be empty';
  END IF;
  
  IF length(p_content) > 500 THEN
    RAISE EXCEPTION 'Content too long (max 500 characters)';
  END IF;
  
  -- Insert notification with auth.uid() as from_user_id
  INSERT INTO public.notifications (
    user_id,
    from_user_id,
    type,
    content,
    link,
    is_read
  ) VALUES (
    p_user_id,
    auth.uid(),
    p_type,
    trim(p_content),
    p_link,
    false
  )
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Drop the insecure INSERT policy  
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

-- Create new secure INSERT policy that blocks direct inserts
DROP POLICY IF EXISTS "Block direct notification inserts" ON public.notifications;
CREATE POLICY "Block direct notification inserts"
ON public.notifications
FOR INSERT
WITH CHECK (false);