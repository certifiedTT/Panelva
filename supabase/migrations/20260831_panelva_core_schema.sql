-- ==========================================================
-- Panelva Production PostgreSQL Schema & Storage Migration
-- Architecture: Supabase (Auth, Postgres, Storage, Realtime)
-- ==========================================================

-- 1. ENUMS & EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM (
    'MASTER_ADMIN',
    'ADMIN',
    'MODERATOR',
    'CREATOR',
    'READER'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE series_type AS ENUM ('COMIC', 'NOVEL');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE series_status AS ENUM (
    'ONGOING',
    'COMPLETED',
    'HIATUS',
    'COMING_SOON'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE chapter_tier AS ENUM ('FREE', 'AD_SUPPORTED', 'PREMIUM');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE post_type AS ENUM (
    'UPDATE',
    'ARTWORK',
    'ANNOUNCEMENT',
    'POLL'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE like_target_type AS ENUM ('POST', 'CHAPTER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. CORE PLATFORM TABLES

-- 2.1 PROFILES (Users & Roles)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  pen_name TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  bio TEXT,
  role user_role NOT NULL DEFAULT 'READER',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.2 SERIES (Comic & Novel metadata)
CREATE TABLE IF NOT EXISTS public.series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  cover_url TEXT NOT NULL,
  banner_url TEXT,
  type series_type NOT NULL DEFAULT 'COMIC',
  genre TEXT NOT NULL DEFAULT 'Action',
  status series_status NOT NULL DEFAULT 'ONGOING',
  rating NUMERIC(3, 2) DEFAULT 5.00,
  view_count BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.3 CHAPTERS (Episode data)
CREATE TABLE IF NOT EXISTS public.chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id UUID NOT NULL REFERENCES public.series(id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  tier chapter_tier NOT NULL DEFAULT 'FREE',
  price_coins INTEGER DEFAULT 0,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_series_chapter UNIQUE (series_id, chapter_number)
);

-- 2.4 POSTS (Creator Hub Feed)
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  type post_type NOT NULL DEFAULT 'UPDATE',
  media_urls TEXT[] DEFAULT '{}',
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.5 COMMENTS (Discussions on posts & chapters)
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES public.chapters(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT comment_target_check CHECK (
    (post_id IS NOT NULL AND chapter_id IS NULL) OR
    (chapter_id IS NOT NULL AND post_id IS NULL)
  )
);

-- 2.6 FOLLOWS (User follows creator)
CREATE TABLE IF NOT EXISTS public.follows (
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (follower_id, creator_id)
);

-- 2.7 LIKES (Post & Chapter likes)
CREATE TABLE IF NOT EXISTS public.likes (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_type like_target_type NOT NULL,
  target_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, target_type, target_id)
);

-- 2.8 NOTIFICATIONS (Alerts)
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  avatar_url TEXT,
  type TEXT DEFAULT 'SYSTEM',
  link_url TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.9 WALLETS (Reader balances)
CREATE TABLE IF NOT EXISTS public.wallets (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  credits_balance INTEGER NOT NULL DEFAULT 0,
  coins_balance INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.10 ANALYTICS (Creator stats & KPIs)
CREATE TABLE IF NOT EXISTS public.analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  series_id UUID REFERENCES public.series(id) ON DELETE SET NULL,
  total_views BIGINT DEFAULT 0,
  monthly_revenue NUMERIC(10, 2) DEFAULT 0.00,
  completion_rate NUMERIC(5, 2) DEFAULT 0.00,
  read_duration_seconds BIGINT DEFAULT 0,
  period_date DATE NOT NULL DEFAULT CURRENT_DATE
);

-- 3. INDEXES FOR HIGH-THROUGHPUT QUERIES
CREATE INDEX IF NOT EXISTS idx_series_creator ON public.series(creator_id);
CREATE INDEX IF NOT EXISTS idx_series_genre ON public.series(genre);
CREATE INDEX IF NOT EXISTS idx_chapters_series ON public.chapters(series_id);
CREATE INDEX IF NOT EXISTS idx_posts_author ON public.posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_chapter ON public.comments(chapter_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_analytics_creator ON public.analytics(creator_id, period_date);

-- 4. STORAGE BUCKETS SETUP
-- avatars: User profile images (Public read)
-- covers: Series covers (Public read)
-- chapters: Comic pages (Protected reader access)
-- banners: Creator banners (Public read)
-- thumbnails: Optimized images (Public read)
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('avatars', 'avatars', true),
  ('covers', 'covers', true),
  ('chapters', 'chapters', false),
  ('banners', 'banners', true),
  ('thumbnails', 'thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- Enable RLS on every table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.series ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

-- Helper security function to check current user's role
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 5.1 PROFILES POLICIES
CREATE POLICY "Public profiles are viewable by everyone" 
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" 
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 5.2 SERIES POLICIES
CREATE POLICY "Published series are viewable by everyone" 
  ON public.series FOR SELECT USING (true);

CREATE POLICY "Creators can insert series" 
  ON public.series FOR INSERT WITH CHECK (
    auth.uid() = creator_id AND 
    public.current_user_role() IN ('CREATOR', 'ADMIN', 'MASTER_ADMIN')
  );

CREATE POLICY "Creators can update their own series" 
  ON public.series FOR UPDATE USING (
    auth.uid() = creator_id OR 
    public.current_user_role() IN ('ADMIN', 'MASTER_ADMIN')
  );

CREATE POLICY "Creators can delete their own series" 
  ON public.series FOR DELETE USING (
    auth.uid() = creator_id OR 
    public.current_user_role() = 'MASTER_ADMIN'
  );

-- 5.3 CHAPTERS POLICIES
CREATE POLICY "Chapters are viewable by everyone" 
  ON public.chapters FOR SELECT USING (true);

CREATE POLICY "Creators can manage chapters of their series" 
  ON public.chapters FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.series 
      WHERE series.id = chapters.series_id 
        AND (series.creator_id = auth.uid() OR public.current_user_role() IN ('ADMIN', 'MASTER_ADMIN'))
    )
  );

-- 5.4 POSTS POLICIES
CREATE POLICY "Posts are viewable by everyone" 
  ON public.posts FOR SELECT USING (true);

CREATE POLICY "Creators and admins can insert posts" 
  ON public.posts FOR INSERT WITH CHECK (
    auth.uid() = author_id AND 
    public.current_user_role() IN ('CREATOR', 'ADMIN', 'MASTER_ADMIN')
  );

CREATE POLICY "Authors and moderators can update posts" 
  ON public.posts FOR UPDATE USING (
    auth.uid() = author_id OR 
    public.current_user_role() IN ('MODERATOR', 'ADMIN', 'MASTER_ADMIN')
  );

CREATE POLICY "Authors and moderators can delete posts" 
  ON public.posts FOR DELETE USING (
    auth.uid() = author_id OR 
    public.current_user_role() IN ('MODERATOR', 'ADMIN', 'MASTER_ADMIN')
  );

-- 5.5 COMMENTS POLICIES
CREATE POLICY "Comments are viewable by everyone" 
  ON public.comments FOR SELECT USING (true);

CREATE POLICY "Authenticated users can post comments" 
  ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Comment authors and moderators can delete comments" 
  ON public.comments FOR DELETE USING (
    auth.uid() = user_id OR 
    public.current_user_role() IN ('MODERATOR', 'ADMIN', 'MASTER_ADMIN')
  );

-- 5.6 FOLLOWS POLICIES
CREATE POLICY "Follows are viewable by everyone" 
  ON public.follows FOR SELECT USING (true);

CREATE POLICY "Users can manage their own follows" 
  ON public.follows FOR ALL USING (auth.uid() = follower_id);

-- 5.7 LIKES POLICIES
CREATE POLICY "Likes are viewable by everyone" 
  ON public.likes FOR SELECT USING (true);

CREATE POLICY "Users can manage their own likes" 
  ON public.likes FOR ALL USING (auth.uid() = user_id);

-- 5.8 NOTIFICATIONS POLICIES
CREATE POLICY "Users can view and update their own notifications" 
  ON public.notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification read status" 
  ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- 5.9 WALLETS POLICIES
CREATE POLICY "Users can view their own wallet" 
  ON public.wallets FOR SELECT USING (auth.uid() = user_id);

-- 5.10 ANALYTICS POLICIES
CREATE POLICY "Creators can view their own analytics" 
  ON public.analytics FOR SELECT USING (
    auth.uid() = creator_id OR 
    public.current_user_role() IN ('ADMIN', 'MASTER_ADMIN')
  );

-- 6. REALTIME REPLICATION CONFIGURATION
-- Realtime enabled only for notifications, comments, and posts per architecture rules
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
EXCEPTION
  WHEN undefined_object THEN null;
END $$;
