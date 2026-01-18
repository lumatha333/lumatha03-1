-- Fix the overly permissive policy on violations table
DROP POLICY IF EXISTS "System can manage violations" ON public.random_connect_violations;

-- Create proper policies for violations
CREATE POLICY "Users can insert own violations" ON public.random_connect_violations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own violations" ON public.random_connect_violations
  FOR UPDATE USING (auth.uid() = user_id);