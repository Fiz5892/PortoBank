-- Allow public access to view app reviews
CREATE POLICY "Anyone can view app reviews" ON public.app_reviews
  FOR SELECT TO public USING (true);
