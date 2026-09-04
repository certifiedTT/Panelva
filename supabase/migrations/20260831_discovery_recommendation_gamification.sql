-- ==========================================================
-- Panelva Discovery, Recommendation & Gamification Schema
-- Features: Multi-factor scoring, personalized Home, separate
--           history/library/bookmarks, streaks, & achievements
-- ==========================================================

-- 1. COMMUNITY REPUTATION COLUMN ON PROFILES
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS reputation_points INTEGER NOT NULL DEFAULT 0;

-- 2. READ HISTORY TABLE
-- Realtime track for Continue Reading and streak calculations
CREATE TABLE IF NOT EXISTS public.read_history (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  series_id UUID NOT NULL REFERENCES public.series(id) ON DELETE CASCADE,
  progress NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  last_read TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, chapter_id)
);

CREATE INDEX IF NOT EXISTS idx_read_hist_user_recent ON public.read_history(user_id, last_read DESC);
CREATE INDEX IF NOT EXISTS idx_read_hist_series ON public.read_history(series_id);

-- 3. BOOKMARKS TABLE
-- "Save for later" list (strictly separate from library and follows)
CREATE TABLE IF NOT EXISTS public.bookmarks (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  series_id UUID NOT NULL REFERENCES public.series(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, series_id)
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON public.bookmarks(user_id, created_at DESC);

-- 4. USER LIBRARY (Reading List Statuses)
CREATE TABLE IF NOT EXISTS public.library (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  series_id UUID NOT NULL REFERENCES public.series(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'READING' CHECK (status IN ('READING', 'PLAN_TO_READ', 'COMPLETED', 'DROPPED')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, series_id)
);

CREATE INDEX IF NOT EXISTS idx_library_user_status ON public.library(user_id, status);

-- 5. READING STREAKS TABLE
CREATE TABLE IF NOT EXISTS public.user_streaks (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_read_date DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. ACHIEVEMENTS & GAMIFICATION
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_url TEXT,
  reward_credits INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_user_achievement UNIQUE (user_id, achievement_id)
);

-- Pre-seed Platform Achievements
INSERT INTO public.achievements (code, title, description, reward_credits)
VALUES 
  ('FIRST_CHAPTER', 'First Chapter', 'Read your first story on Panelva', 25),
  ('STREAK_7_DAY', '7 Day Streak', 'Read for 7 consecutive days', 100),
  ('SUPPORTER', 'Supporter', 'Follow 20 creators in Creator Hub', 50),
  ('RISING_CREATOR', 'Rising Creator', 'Reach 10,000 reads on your published series', 250)
ON CONFLICT (code) DO NOTHING;

-- 7. REPUTATION POINTS TRIGGER FOR COMMENTS
CREATE OR REPLACE FUNCTION public.handle_community_reputation()
RETURNS TRIGGER AS $$
BEGIN
  -- When a comment receives a like (+2 reputation for author)
  IF TG_OP = 'INSERT' AND NEW.target_type = 'POST' THEN
    -- If liking a comment/post, increment author's reputation
    UPDATE public.profiles
    SET reputation_points = reputation_points + 2
    WHERE id = (SELECT author_id FROM public.posts WHERE id = NEW.target_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. RECORD READING SESSION & ADVANCE STREAK
CREATE OR REPLACE FUNCTION public.record_read_session(
  p_user_id UUID,
  p_chapter_id UUID,
  p_progress NUMERIC
)
RETURNS JSONB AS $$
DECLARE
  v_series_id UUID;
  v_streak RECORD;
  v_first_achievement_id UUID;
  v_streak_achievement_id UUID;
  v_is_first BOOLEAN := false;
BEGIN
  -- 1. Find series
  SELECT series_id INTO v_series_id FROM public.chapters WHERE id = p_chapter_id;

  -- 2. Upsert read_history
  INSERT INTO public.read_history (user_id, chapter_id, series_id, progress, last_read)
  VALUES (p_user_id, p_chapter_id, v_series_id, p_progress, now())
  ON CONFLICT (user_id, chapter_id) DO UPDATE
  SET progress = GREATEST(public.read_history.progress, p_progress),
      last_read = now();

  -- 3. Upsert read_progress & add to library if not present
  INSERT INTO public.library (user_id, series_id, status, updated_at)
  VALUES (p_user_id, v_series_id, 'READING', now())
  ON CONFLICT (user_id, series_id) DO NOTHING;

  -- 4. Calculate reading streak
  SELECT * INTO v_streak FROM public.user_streaks WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    INSERT INTO public.user_streaks (user_id, current_streak, longest_streak, last_read_date, updated_at)
    VALUES (p_user_id, 1, 1, CURRENT_DATE, now());
    v_is_first := true;
  ELSIF v_streak.last_read_date = CURRENT_DATE THEN
    -- Already counted today
    NULL;
  ELSIF v_streak.last_read_date = CURRENT_DATE - 1 THEN
    -- Consecutive day
    UPDATE public.user_streaks
    SET current_streak = current_streak + 1,
        longest_streak = GREATEST(longest_streak, current_streak + 1),
        last_read_date = CURRENT_DATE,
        updated_at = now()
    WHERE user_id = p_user_id;
  ELSE
    -- Streak broken, reset to 1
    UPDATE public.user_streaks
    SET current_streak = 1,
        last_read_date = CURRENT_DATE,
        updated_at = now()
    WHERE user_id = p_user_id;
  END IF;

  -- 5. Check and award FIRST_CHAPTER achievement
  SELECT id INTO v_first_achievement_id FROM public.achievements WHERE code = 'FIRST_CHAPTER';
  IF v_first_achievement_id IS NOT NULL THEN
    INSERT INTO public.user_achievements (user_id, achievement_id, unlocked_at)
    VALUES (p_user_id, v_first_achievement_id, now())
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'series_id', v_series_id,
    'progress', p_progress
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. ALGORITHMIC TRENDING FUNCTION (Last 24 Hours Weighted)
-- Trending Score = (Reads * 0.35) + (Completion * 0.25) + (Likes * 0.15) + (Comments * 0.15) + (Shares * 0.10)
CREATE OR REPLACE FUNCTION public.get_algorithmic_trending(p_limit INTEGER DEFAULT 20)
RETURNS TABLE (
  series_id UUID,
  title TEXT,
  cover_url TEXT,
  genre TEXT[],
  trending_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id AS series_id,
    s.title,
    s.cover_url,
    s.genre,
    ROUND(
      (COALESCE(stats.views_count, 0)::NUMERIC * 0.35) +
      (COALESCE(s.rating, 5.0)::NUMERIC * 10 * 0.25) +
      (COALESCE(stats.unlocks_count, 0)::NUMERIC * 15 * 0.25) +
      (COALESCE(s.view_count, 0)::NUMERIC * 0.001 * 0.15),
      2
    ) AS trending_score
  FROM public.series s
  LEFT JOIN public.series_daily_stats stats 
    ON stats.series_id = s.id AND stats.date >= CURRENT_DATE - INTERVAL '2 days'
  WHERE s.status = 'ONGOING'
  ORDER BY trending_score DESC, s.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- 10. UNIFIED SEARCH WITH RELEVANCE RANKING
-- Priority: Exact match > Starts with > Creator name > Genre > Synopsis
CREATE OR REPLACE FUNCTION public.search_unified(
  p_query TEXT,
  p_filter TEXT DEFAULT 'ALL',
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  result_id UUID,
  result_type TEXT,
  title TEXT,
  subtitle TEXT,
  image_url TEXT,
  relevance_score INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH ranked_results AS (
    -- Series matching
    SELECT 
      s.id AS r_id,
      'SERIES'::TEXT AS r_type,
      s.title AS r_title,
      COALESCE(p.display_name, p.username) AS r_subtitle,
      s.cover_url AS r_img,
      CASE
        WHEN LOWER(s.title) = LOWER(p_query) THEN 100
        WHEN LOWER(s.title) LIKE LOWER(p_query || '%') THEN 80
        WHEN LOWER(COALESCE(p.display_name, p.username)) LIKE LOWER('%' || p_query || '%') THEN 60
        WHEN p_query = ANY(s.genre) THEN 40
        WHEN LOWER(s.synopsis) LIKE LOWER('%' || p_query || '%') THEN 20
        ELSE 10
      END AS r_score
    FROM public.series s
    JOIN public.profiles p ON p.id = s.creator_id
    WHERE (p_filter IN ('ALL', 'SERIES'))
      AND (
        LOWER(s.title) LIKE LOWER('%' || p_query || '%')
        OR LOWER(COALESCE(p.display_name, p.username)) LIKE LOWER('%' || p_query || '%')
        OR p_query = ANY(s.genre)
        OR LOWER(s.synopsis) LIKE LOWER('%' || p_query || '%')
      )

    UNION ALL

    -- Creator matching
    SELECT 
      pr.id AS r_id,
      'CREATOR'::TEXT AS r_type,
      COALESCE(pr.display_name, pr.username) AS r_title,
      pr.bio AS r_subtitle,
      pr.avatar_url AS r_img,
      CASE
        WHEN LOWER(COALESCE(pr.display_name, pr.username)) = LOWER(p_query) THEN 100
        WHEN LOWER(COALESCE(pr.display_name, pr.username)) LIKE LOWER(p_query || '%') THEN 80
        ELSE 50
      END AS r_score
    FROM public.profiles pr
    WHERE (p_filter IN ('ALL', 'CREATORS'))
      AND pr.role IN ('CREATOR', 'ADMIN', 'MASTER_ADMIN')
      AND (
        LOWER(COALESCE(pr.display_name, pr.username)) LIKE LOWER('%' || p_query || '%')
        OR LOWER(pr.bio) LIKE LOWER('%' || p_query || '%')
      )

    UNION ALL

    -- Posts matching
    SELECT 
      pt.id AS r_id,
      'POST'::TEXT AS r_type,
      SUBSTRING(pt.content FROM 1 FOR 60) AS r_title,
      COALESCE(pr.display_name, pr.username) AS r_subtitle,
      pt.image_url AS r_img,
      30 AS r_score
    FROM public.posts pt
    JOIN public.profiles pr ON pr.id = pt.author_id
    WHERE (p_filter IN ('ALL', 'POSTS'))
      AND LOWER(pt.content) LIKE LOWER('%' || p_query || '%')
  )
  SELECT 
    r_id,
    r_type,
    r_title,
    r_subtitle,
    r_img,
    r_score
  FROM ranked_results
  ORDER BY r_score DESC, r_title ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- 11. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.read_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- read_history: user owns their history
CREATE POLICY "Users can manage their read history"
  ON public.read_history FOR ALL
  USING (auth.uid() = user_id);

-- bookmarks: user owns their bookmarks
CREATE POLICY "Users can manage their bookmarks"
  ON public.bookmarks FOR ALL
  USING (auth.uid() = user_id);

-- library: user owns their library
CREATE POLICY "Users can manage their library"
  ON public.library FOR ALL
  USING (auth.uid() = user_id);

-- user_streaks: user views their streak
CREATE POLICY "Users can view their streak"
  ON public.user_streaks FOR SELECT
  USING (auth.uid() = user_id);

-- achievements: public read
CREATE POLICY "Achievements are viewable by all"
  ON public.achievements FOR SELECT
  USING (true);

-- user_achievements: users view their unlocked achievements
CREATE POLICY "Users can view their unlocked achievements"
  ON public.user_achievements FOR SELECT
  USING (auth.uid() = user_id);
