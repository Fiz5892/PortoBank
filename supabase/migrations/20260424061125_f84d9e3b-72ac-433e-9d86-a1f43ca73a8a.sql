-- Prevent duplicate likes (same user liking same portfolio twice)
ALTER TABLE public.likes
  ADD CONSTRAINT likes_user_portfolio_unique UNIQUE (user_id, portfolio_id);

-- Helpful indexes for new social features
CREATE INDEX IF NOT EXISTS idx_messages_receiver_unread
  ON public.messages (receiver_id, is_read);

CREATE INDEX IF NOT EXISTS idx_likes_portfolio
  ON public.likes (portfolio_id);

CREATE INDEX IF NOT EXISTS idx_reports_status
  ON public.reports (status);