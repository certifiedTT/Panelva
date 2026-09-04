-- ==========================================================
-- Panelva Studio Grade Creator Ecosystem & Collaboration Schema
-- Principles: Studios as organizations, role-based permissions,
--             100% validated revenue splits, Kanban production pipeline,
--             and non-destructive file version history.
-- ==========================================================

-- 1. STUDIO ENUMS
DO $$ BEGIN
  CREATE TYPE studio_role AS ENUM (
    'OWNER',
    'ADMIN',
    'WRITER',
    'ARTIST',
    'COLORIST',
    'LETTERER',
    'EDITOR'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE task_stage AS ENUM (
    'SCRIPT',
    'SKETCH',
    'LINEART',
    'COLOR',
    'LETTERING',
    'REVIEW',
    'PUBLISH'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE task_status AS ENUM (
    'TODO',
    'IN_PROGRESS',
    'REVIEW',
    'DONE'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE contract_status AS ENUM (
    'DRAFT',
    'PENDING_SIGNATURE',
    'SIGNED',
    'TERMINATED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. STUDIOS (First-Class Organizations)
CREATE TABLE IF NOT EXISTS public.studios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  banner_url TEXT,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  bio TEXT,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_studios_owner ON public.studios(owner_id);
CREATE INDEX IF NOT EXISTS idx_studios_slug ON public.studios(slug);

-- 3. STUDIO MEMBERS (Connecting Creators to Studios with Granular Roles)
CREATE TABLE IF NOT EXISTS public.studio_members (
  studio_id UUID NOT NULL REFERENCES public.studios(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role studio_role NOT NULL DEFAULT 'ARTIST',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (studio_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_studio_members_user ON public.studio_members(user_id);

-- Link series to optional owning studio
ALTER TABLE public.series
  ADD COLUMN IF NOT EXISTS studio_id UUID REFERENCES public.studios(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_series_studio ON public.series(studio_id);

-- 4. KANBAN PRODUCTION PIPELINE (Chapter Tasks)
CREATE TABLE IF NOT EXISTS public.chapter_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  series_id UUID NOT NULL REFERENCES public.series(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  stage task_stage NOT NULL,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status task_status NOT NULL DEFAULT 'TODO',
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chapter_tasks_series ON public.chapter_tasks(series_id, status);
CREATE INDEX IF NOT EXISTS idx_chapter_tasks_assigned ON public.chapter_tasks(assigned_to);

-- 5. CHAPTER VERSION HISTORY (Non-Destructive Art & Script Revisions)
CREATE TABLE IF NOT EXISTS public.chapter_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  stage task_stage NOT NULL,
  file_url TEXT NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_chapter_version_stage UNIQUE (chapter_id, version, stage)
);

CREATE INDEX IF NOT EXISTS idx_chapter_versions_chapter ON public.chapter_versions(chapter_id, version DESC);

-- 6. SERIES REVENUE SPLITS (Must Total Exactly 100%)
CREATE TABLE IF NOT EXISTS public.series_revenue_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id UUID NOT NULL REFERENCES public.series(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  percentage NUMERIC(5, 2) NOT NULL CHECK (percentage > 0 AND percentage <= 100),
  role TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_series_member_split UNIQUE (series_id, member_id)
);

CREATE INDEX IF NOT EXISTS idx_splits_series ON public.series_revenue_splits(series_id);

-- Function to validate that total splits for a series equal 100.00%
CREATE OR REPLACE FUNCTION public.validate_series_revenue_splits(p_series_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_total NUMERIC(5, 2);
BEGIN
  SELECT COALESCE(SUM(percentage), 0) INTO v_total
  FROM public.series_revenue_splits
  WHERE series_id = p_series_id;

  RETURN (v_total = 100.00);
END;
$$ LANGUAGE plpgsql STABLE;

-- 7. DIGITAL CONTRACTS & AGREEMENTS
CREATE TABLE IF NOT EXISTS public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES public.studios(id) ON DELETE CASCADE,
  series_id UUID REFERENCES public.series(id) ON DELETE SET NULL,
  member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'revenue_split',
  terms JSONB NOT NULL DEFAULT '{}'::jsonb,
  revenue_percentage NUMERIC(5, 2),
  status contract_status NOT NULL DEFAULT 'PENDING_SIGNATURE',
  signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contracts_studio ON public.contracts(studio_id);
CREATE INDEX IF NOT EXISTS idx_contracts_member ON public.contracts(member_id);

-- 8. STUDIO DAILY STATS (Studio Workspace Dashboard Analytics)
CREATE TABLE IF NOT EXISTS public.studio_daily_stats (
  studio_id UUID NOT NULL REFERENCES public.studios(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  active_members INTEGER NOT NULL DEFAULT 0,
  chapters_completed INTEGER NOT NULL DEFAULT 0,
  revenue_usd NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  total_views BIGINT NOT NULL DEFAULT 0,
  PRIMARY KEY (studio_id, date)
);

-- 9. DEDICATED PRODUCTION STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('scripts', 'scripts', false),
  ('storyboards', 'storyboards', false),
  ('lineart', 'lineart', false),
  ('colors', 'colors', false),
  ('exports', 'exports', false)
ON CONFLICT (id) DO NOTHING;

-- 10. SECURITY & PERMISSION HELPER
CREATE OR REPLACE FUNCTION public.has_studio_permission(
  p_studio_id UUID,
  p_user_id UUID,
  p_allowed_roles studio_role[]
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.studio_members
    WHERE studio_id = p_studio_id
      AND user_id = p_user_id
      AND role = ANY(p_allowed_roles)
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 11. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.studios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapter_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapter_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.series_revenue_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_daily_stats ENABLE ROW LEVEL SECURITY;

-- studios
CREATE POLICY "Studios are viewable by everyone"
  ON public.studios FOR SELECT
  USING (true);

CREATE POLICY "Owners can update studio"
  ON public.studios FOR UPDATE
  USING (auth.uid() = owner_id OR public.has_studio_permission(id, auth.uid(), ARRAY['OWNER'::studio_role, 'ADMIN'::studio_role]));

-- studio_members
CREATE POLICY "Studio members viewable by members or admins"
  ON public.studio_members FOR SELECT
  USING (true);

CREATE POLICY "Owners and Admins can manage members"
  ON public.studio_members FOR ALL
  USING (public.has_studio_permission(studio_id, auth.uid(), ARRAY['OWNER'::studio_role, 'ADMIN'::studio_role]));

-- chapter_tasks
CREATE POLICY "Studio team can view chapter tasks"
  ON public.chapter_tasks FOR SELECT
  USING (true);

CREATE POLICY "Team members can update tasks assigned to them"
  ON public.chapter_tasks FOR UPDATE
  USING (auth.uid() = assigned_to OR EXISTS (
    SELECT 1 FROM public.series s
    WHERE s.id = chapter_tasks.series_id
      AND (s.creator_id = auth.uid() OR (s.studio_id IS NOT NULL AND public.has_studio_permission(s.studio_id, auth.uid(), ARRAY['OWNER'::studio_role, 'ADMIN'::studio_role, 'EDITOR'::studio_role])))
  ));

-- chapter_versions
CREATE POLICY "Team members can view chapter versions"
  ON public.chapter_versions FOR SELECT
  USING (true);

CREATE POLICY "Team artists and editors can insert versions"
  ON public.chapter_versions FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- series_revenue_splits
CREATE POLICY "Team members can view series splits"
  ON public.series_revenue_splits FOR SELECT
  USING (auth.uid() = member_id OR EXISTS (
    SELECT 1 FROM public.series s
    WHERE s.id = series_revenue_splits.series_id AND s.creator_id = auth.uid()
  ));

-- contracts
CREATE POLICY "Members can view their own contracts"
  ON public.contracts FOR SELECT
  USING (auth.uid() = member_id OR public.has_studio_permission(studio_id, auth.uid(), ARRAY['OWNER'::studio_role, 'ADMIN'::studio_role]));

CREATE POLICY "Members can sign their contracts"
  ON public.contracts FOR UPDATE
  USING (auth.uid() = member_id);

-- studio_daily_stats
CREATE POLICY "Studio members can view daily stats"
  ON public.studio_daily_stats FOR SELECT
  USING (public.has_studio_permission(studio_id, auth.uid(), ARRAY['OWNER'::studio_role, 'ADMIN'::studio_role]));
