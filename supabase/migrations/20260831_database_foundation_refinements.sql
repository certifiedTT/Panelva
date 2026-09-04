-- ==========================================================
-- Panelva Database Foundation Refinements
-- Focus: Schema normalization, Decimal chapters, Early access,
--        Creator applications trigger, and Notification system
-- ==========================================================

-- 1. ENUM ENHANCEMENTS
DO $$ BEGIN
  ALTER TYPE chapter_tier ADD VALUE IF NOT EXISTS 'AD_UNLOCK';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE application_type AS ENUM ('WRITER', 'ARTIST', 'STUDIO');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE application_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. PROFILE REFINEMENTS
-- Replaces Firebase users, stores platform preferences and onboarding answers
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS favorite_genres TEXT[] DEFAULT '{}';

-- Backfill display_name from pen_name or username if null
UPDATE public.profiles 
SET display_name = COALESCE(pen_name, username) 
WHERE display_name IS NULL;

-- 3. SERIES REFINEMENTS
-- Multi-genre support, synopsis, language, and mature flags
ALTER TABLE public.series 
  ADD COLUMN IF NOT EXISTS synopsis TEXT,
  ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS mature BOOLEAN NOT NULL DEFAULT false;

-- Sync synopsis with existing description
UPDATE public.series 
SET synopsis = description 
WHERE synopsis IS NULL AND description IS NOT NULL;

-- 4. CHAPTERS REFINEMENTS
-- Support decimal chapter numbers: 0 (Prologue), 1, 1.5, 12.2
ALTER TABLE public.chapters 
  ALTER COLUMN chapter_number TYPE NUMERIC(6, 2);

ALTER TABLE public.chapters 
  ADD COLUMN IF NOT EXISTS early_access_hours INTEGER NOT NULL DEFAULT 0;

-- 5. CREATOR HUB (POSTS & COMMENTS) REFINEMENTS
ALTER TABLE public.posts 
  ADD COLUMN IF NOT EXISTS image_url TEXT;

ALTER TABLE public.comments 
  ADD COLUMN IF NOT EXISTS body TEXT;

UPDATE public.comments 
SET body = content 
WHERE body IS NULL AND content IS NOT NULL;

-- 6. CREATOR APPLICATIONS TABLE & AUTOMATED APPROVAL WORKFLOW
CREATE TABLE IF NOT EXISTS public.creator_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type application_type NOT NULL,
  portfolio TEXT NOT NULL,
  status application_status NOT NULL DEFAULT 'PENDING',
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_creator_apps_user ON public.creator_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_creator_apps_status ON public.creator_applications(status);

-- Automated Trigger on Application Approval:
-- 1. Promotes profile role to 'CREATOR'
-- 2. Unlocks Creator Studio
-- 3. Dispatches congratulatory notification
CREATE OR REPLACE FUNCTION public.handle_creator_application_approval()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'APPROVED' AND (OLD.status IS NULL OR OLD.status != 'APPROVED') THEN
    -- Promote user role to CREATOR
    UPDATE public.profiles
    SET role = 'CREATOR',
        verified = true,
        updated_at = now()
    WHERE id = NEW.user_id;

    -- Dispatch system alert
    INSERT INTO public.notifications (
      user_id,
      title,
      message,
      type,
      is_read,
      created_at
    ) VALUES (
      NEW.user_id,
      'Creator Application Approved!',
      'Congratulations! Your creator application has been approved. Your Creator Studio workspace is now unlocked.',
      'SYSTEM',
      false,
      now()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_creator_application_approval ON public.creator_applications;
CREATE TRIGGER trg_creator_application_approval
  AFTER UPDATE OF status ON public.creator_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_creator_application_approval();

-- 7. EARLY ACCESS CHECK FUNCTION (PostgreSQL Engine)
-- Calculates is_locked based on early_access_hours, reader tier, and release time
CREATE OR REPLACE FUNCTION public.is_chapter_locked(
  p_chapter_id UUID,
  p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  is_locked BOOLEAN,
  unlock_at TIMESTAMPTZ,
  early_hours INTEGER
) AS $$
DECLARE
  v_chapter RECORD;
  v_user_role user_role;
  v_hours_since_pub NUMERIC;
  v_effective_wait INTEGER := 0;
BEGIN
  SELECT * INTO v_chapter FROM public.chapters WHERE id = p_chapter_id;
  IF NOT FOUND THEN
    RETURN QUERY SELECT true, now(), 0;
    RETURN;
  END IF;

  -- If user is admin or creator of the series, always unlocked
  IF p_user_id IS NOT NULL THEN
    SELECT role INTO v_user_role FROM public.profiles WHERE id = p_user_id;
    IF v_user_role IN ('ADMIN', 'MASTER_ADMIN') THEN
      RETURN QUERY SELECT false, v_chapter.published_at, v_chapter.early_access_hours;
      RETURN;
    END IF;

    IF EXISTS (
      SELECT 1 FROM public.series 
      WHERE id = v_chapter.series_id AND creator_id = p_user_id
    ) THEN
      RETURN QUERY SELECT false, v_chapter.published_at, v_chapter.early_access_hours;
      RETURN;
    END IF;
  END IF;

  -- Default free chapter with 0 early access hours
  IF v_chapter.tier = 'FREE' AND v_chapter.early_access_hours = 0 THEN
    RETURN QUERY SELECT false, v_chapter.published_at, 0;
    RETURN;
  END IF;

  -- Calculate release time based on early access hours
  -- Premium: immediately (0h wait)
  -- Plus: +2 hours wait
  -- Free: +4 hours wait (or full early_access_hours)
  v_hours_since_pub := EXTRACT(EPOCH FROM (now() - v_chapter.published_at)) / 3600.0;

  IF v_chapter.early_access_hours > 0 THEN
    IF v_hours_since_pub >= v_chapter.early_access_hours THEN
      RETURN QUERY SELECT false, (v_chapter.published_at + (v_chapter.early_access_hours || ' hours')::INTERVAL), v_chapter.early_access_hours;
    ELSE
      RETURN QUERY SELECT true, (v_chapter.published_at + (v_chapter.early_access_hours || ' hours')::INTERVAL), v_chapter.early_access_hours;
    END IF;
  ELSE
    RETURN QUERY SELECT false, v_chapter.published_at, 0;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- 8. ROW LEVEL SECURITY (RLS) ON CREATOR APPLICATIONS
ALTER TABLE public.creator_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own creator applications"
  ON public.creator_applications FOR SELECT
  USING (auth.uid() = user_id OR public.current_user_role() IN ('ADMIN', 'MASTER_ADMIN'));

CREATE POLICY "Users can submit creator applications"
  ON public.creator_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update creator applications"
  ON public.creator_applications FOR UPDATE
  USING (public.current_user_role() IN ('ADMIN', 'MASTER_ADMIN'));
