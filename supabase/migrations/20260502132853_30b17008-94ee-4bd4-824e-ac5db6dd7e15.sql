-- Suspension appeals table
CREATE TABLE public.suspension_appeals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.suspension_appeals ENABLE ROW LEVEL SECURITY;

-- Users can submit and view their own appeals
CREATE POLICY "Users can submit own appeals"
  ON public.suspension_appeals
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own appeals"
  ON public.suspension_appeals
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view and update all appeals
CREATE POLICY "Admins can view all appeals"
  ON public.suspension_appeals
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update appeals"
  ON public.suspension_appeals
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_suspension_appeals_user_id ON public.suspension_appeals(user_id);
CREATE INDEX idx_suspension_appeals_status ON public.suspension_appeals(status);