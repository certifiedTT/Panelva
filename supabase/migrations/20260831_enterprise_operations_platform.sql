-- ==========================================================
-- Panelva Enterprise Platform & Operations Schema
-- Principles: Role-based workspaces (Master Admin, Ops, Moderator),
--             Prioritized Trust & Safety moderation queue,
--             Immutable audit logs, Customer support ticketing,
--             Copyright protection, and System health monitoring.
-- ==========================================================

-- 1. ENTERPRISE ENUMS
DO $$ BEGIN
  CREATE TYPE report_target_type AS ENUM (
    'POST',
    'COMMENT',
    'CHAPTER',
    'SERIES',
    'USER'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE report_reason AS ENUM (
    'SPAM',
    'HARASSMENT',
    'INAPPROPRIATE_CONTENT',
    'COPYRIGHT',
    'OTHER'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE report_status AS ENUM (
    'PENDING',
    'IN_REVIEW',
    'RESOLVED',
    'DISMISSED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE moderation_action AS ENUM (
    'NONE',
    'WARN',
    'REMOVE_CONTENT',
    'TEMPORARY_BAN',
    'PERMANENT_BAN'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE ticket_category AS ENUM (
    'PAYMENT',
    'CREATOR',
    'BUG',
    'ACCOUNT',
    'COPYRIGHT'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE ticket_status AS ENUM (
    'OPEN',
    'IN_PROGRESS',
    'WAITING_USER',
    'RESOLVED',
    'CLOSED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE copyright_status AS ENUM (
    'FILED',
    'UNDER_REVIEW',
    'UPHELD_REMOVED',
    'REJECTED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. TRUST & SAFETY (REPORTS QUEUE WITH PRIORITY SCORING)
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_type report_target_type NOT NULL,
  target_id UUID NOT NULL,
  reason report_reason NOT NULL,
  priority INTEGER NOT NULL DEFAULT 10,
  status report_status NOT NULL DEFAULT 'PENDING',
  resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  resolution_action moderation_action NOT NULL DEFAULT 'NONE',
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reports_status_priority ON public.reports(status, priority DESC);
CREATE INDEX IF NOT EXISTS idx_reports_target ON public.reports(target_type, target_id);

-- Automated Report Priority Scoring:
-- Signal weighting: Multiple reports (+30), Spam reason (+25), New account reporter (+10)
CREATE OR REPLACE FUNCTION public.calculate_report_priority()
RETURNS TRIGGER AS $$
DECLARE
  v_existing_reports_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_existing_reports_count
  FROM public.reports
  WHERE target_type = NEW.target_type AND target_id = NEW.target_id;

  NEW.priority := 10;
  IF v_existing_reports_count > 1 THEN
    NEW.priority := NEW.priority + 30;
  END IF;

  IF NEW.reason = 'SPAM' THEN
    NEW.priority := NEW.priority + 25;
  ELSIF NEW.reason = 'HARASSMENT' THEN
    NEW.priority := NEW.priority + 20;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_calculate_report_priority ON public.reports;
CREATE TRIGGER trg_calculate_report_priority
  BEFORE INSERT ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_report_priority();

-- 3. IMMUTABLE AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- Trigger: Strictly enforce that audit logs can never be deleted or updated
CREATE OR REPLACE FUNCTION public.prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are permanent and immutable. UPDATE and DELETE operations are forbidden.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_audit_log_modification ON public.audit_logs;
CREATE TRIGGER trg_prevent_audit_log_modification
  BEFORE UPDATE OR DELETE ON public.audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_audit_log_modification();

-- Helper function to append audit log
CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_actor_id UUID,
  p_action TEXT,
  p_target_type TEXT,
  p_target_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT '{}'::jsonb,
  p_ip TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_role TEXT;
  v_log_id UUID;
BEGIN
  SELECT role::TEXT INTO v_role FROM public.profiles WHERE id = p_actor_id;

  INSERT INTO public.audit_logs (
    actor_id,
    actor_role,
    action,
    target_type,
    target_id,
    details,
    ip_address
  ) VALUES (
    p_actor_id,
    COALESCE(v_role, 'ADMIN'),
    p_action,
    p_target_type,
    p_target_id,
    p_details,
    p_ip
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. CUSTOMER SUPPORT TICKETS
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category ticket_category NOT NULL DEFAULT 'BUG',
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status ticket_status NOT NULL DEFAULT 'OPEN',
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  priority INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tickets_user ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.support_tickets(status);

-- 5. COPYRIGHT CLAIMS & IP PROTECTION
CREATE TABLE IF NOT EXISTS public.copyright_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claimant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  claimed_series_id UUID REFERENCES public.series(id) ON DELETE SET NULL,
  claimed_chapter_id UUID REFERENCES public.chapters(id) ON DELETE SET NULL,
  work_title TEXT NOT NULL,
  evidence_urls TEXT[] NOT NULL DEFAULT '{}',
  description TEXT NOT NULL,
  status copyright_status NOT NULL DEFAULT 'FILED',
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_copyright_status ON public.copyright_claims(status);

-- 6. PLATFORM SYSTEM MONITORING
CREATE TABLE IF NOT EXISTS public.system_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service TEXT NOT NULL, -- API, DATABASE, STORAGE, REALTIME
  latency_ms INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'HEALTHY', -- HEALTHY, DEGRADED, DOWN
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.system_metrics (service, latency_ms, status)
VALUES 
  ('API', 42, 'HEALTHY'),
  ('DATABASE', 18, 'HEALTHY'),
  ('STORAGE', 65, 'HEALTHY'),
  ('REALTIME', 24, 'HEALTHY')
ON CONFLICT DO NOTHING;

-- 7. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copyright_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_metrics ENABLE ROW LEVEL SECURITY;

-- reports
CREATE POLICY "Users can create reports"
  ON public.reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Moderators and Admins can view and resolve reports"
  ON public.reports FOR ALL
  USING (public.current_user_role() IN ('MODERATOR', 'ADMIN', 'MASTER_ADMIN'));

-- audit_logs
CREATE POLICY "Only Master Admins can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (public.current_user_role() = 'MASTER_ADMIN');

CREATE POLICY "System and Admins can create audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (auth.uid() = actor_id OR public.current_user_role() IN ('ADMIN', 'MASTER_ADMIN'));

-- support_tickets
CREATE POLICY "Users can view and create their own tickets"
  ON public.support_tickets FOR SELECT
  USING (auth.uid() = user_id OR public.current_user_role() IN ('ADMIN', 'MASTER_ADMIN'));

CREATE POLICY "Users can submit tickets"
  ON public.support_tickets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update tickets"
  ON public.support_tickets FOR UPDATE
  USING (public.current_user_role() IN ('ADMIN', 'MASTER_ADMIN'));

-- copyright_claims
CREATE POLICY "Claimants can view their own claims"
  ON public.copyright_claims FOR SELECT
  USING (auth.uid() = claimant_id OR public.current_user_role() IN ('ADMIN', 'MASTER_ADMIN'));

CREATE POLICY "Users can file copyright claims"
  ON public.copyright_claims FOR INSERT
  WITH CHECK (auth.uid() = claimant_id);

CREATE POLICY "Admins can manage copyright claims"
  ON public.copyright_claims FOR UPDATE
  USING (public.current_user_role() IN ('ADMIN', 'MASTER_ADMIN'));

-- system_metrics
CREATE POLICY "System metrics viewable by Admins"
  ON public.system_metrics FOR SELECT
  USING (public.current_user_role() IN ('ADMIN', 'MASTER_ADMIN'));
