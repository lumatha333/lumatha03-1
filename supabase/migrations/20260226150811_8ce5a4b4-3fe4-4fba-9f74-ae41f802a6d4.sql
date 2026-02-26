
-- Fix overly permissive typing_indicators policy
DROP POLICY IF EXISTS "Users can manage typing" ON public.typing_indicators;

CREATE POLICY "Users can insert typing" ON public.typing_indicators FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view typing" ON public.typing_indicators FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update typing" ON public.typing_indicators FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete typing" ON public.typing_indicators FOR DELETE USING (auth.uid() = user_id);
