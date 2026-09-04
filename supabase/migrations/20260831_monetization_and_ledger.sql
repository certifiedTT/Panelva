-- ==========================================================
-- Panelva Monetization, Ledger & Aggregated Analytics Schema
-- Principle: Never store balances directly. Store transactions.
-- Revenue: 70% Creator Wallet, 30% Platform Revenue.
-- ==========================================================

-- 1. MONETIZATION ENUMS
DO $$ BEGIN
  CREATE TYPE wallet_tx_type AS ENUM (
    'PURCHASE',
    'CHAPTER_UNLOCK',
    'AD_REWARD',
    'REFUND',
    'GIFT',
    'BONUS'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payout_status AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED',
    'PAID'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE subscription_plan AS ENUM (
    'PLUS',
    'PREMIUM'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM (
    'ACTIVE',
    'CANCELLED',
    'EXPIRED'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. WALLET LEDGER TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES public.wallets(user_id) ON DELETE CASCADE,
  amount BIGINT NOT NULL, -- Positive for credits, negative for debits
  type wallet_tx_type NOT NULL,
  reference UUID,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wallet_tx_wallet ON public.wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_created ON public.wallet_transactions(created_at DESC);

-- Automated Ledger Balance Trigger:
-- Calculates wallet balance from transaction history, preventing race conditions and manual drift.
CREATE OR REPLACE FUNCTION public.recalculate_wallet_balance()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.wallets
  SET credits_balance = (
    SELECT COALESCE(SUM(amount), 0)
    FROM public.wallet_transactions
    WHERE wallet_id = NEW.wallet_id
  ),
  updated_at = now()
  WHERE user_id = NEW.wallet_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_recalculate_wallet_balance ON public.wallet_transactions;
CREATE TRIGGER trg_recalculate_wallet_balance
  AFTER INSERT ON public.wallet_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.recalculate_wallet_balance();

-- 3. CREATOR WALLETS (Real Currency Earnings)
CREATE TABLE IF NOT EXISTS public.creator_wallets (
  creator_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  available NUMERIC(10, 2) NOT NULL DEFAULT 0.00, -- Withdrawable
  pending NUMERIC(10, 2) NOT NULL DEFAULT 0.00,   -- Waiting clearance period
  lifetime NUMERIC(10, 2) NOT NULL DEFAULT 0.00,  -- Total historical earnings
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. PAYOUTS TABLE
CREATE TABLE IF NOT EXISTS public.payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 50.00),
  status payout_status NOT NULL DEFAULT 'PENDING',
  approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payouts_creator ON public.payouts(creator_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON public.payouts(status);

-- 5. SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.subscriptions (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan subscription_plan NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  status subscription_status NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. CREDIT PACKAGES STORE
CREATE TABLE IF NOT EXISTS public.credit_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credits INTEGER NOT NULL,
  price_usd NUMERIC(6, 2) NOT NULL,
  bonus_credits INTEGER NOT NULL DEFAULT 0,
  is_popular BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.credit_packages (credits, price_usd, bonus_credits, is_popular)
VALUES 
  (100, 0.99, 0, false),
  (500, 4.99, 50, false),
  (1000, 9.99, 200, true),
  (2000, 19.99, 500, false)
ON CONFLICT DO NOTHING;

-- 7. ANALYTICS AGGREGATION ENGINE
-- Keeps creator dashboards sub-second fast without live full table scans

CREATE TABLE IF NOT EXISTS public.chapter_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chapter_views_chapter ON public.chapter_views(chapter_id);
CREATE INDEX IF NOT EXISTS idx_chapter_views_viewed_at ON public.chapter_views(viewed_at);

CREATE TABLE IF NOT EXISTS public.read_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  progress_percent NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  completed BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_read_progress UNIQUE (user_id, chapter_id)
);

CREATE TABLE IF NOT EXISTS public.series_daily_stats (
  series_id UUID NOT NULL REFERENCES public.series(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  views_count INTEGER NOT NULL DEFAULT 0,
  unlocks_count INTEGER NOT NULL DEFAULT 0,
  revenue_usd NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (series_id, date)
);

CREATE TABLE IF NOT EXISTS public.creator_daily_stats (
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_views INTEGER NOT NULL DEFAULT 0,
  total_revenue_usd NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  new_followers INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (creator_id, date)
);

-- 8. PROCEDURES & TRANSACTION WORKFLOWS

-- 8.1 Process Chapter Unlock with 70/30 Revenue Sharing
CREATE OR REPLACE FUNCTION public.process_chapter_unlock_revenue(
  p_user_id UUID,
  p_chapter_id UUID,
  p_amount_coins BIGINT
)
RETURNS JSONB AS $$
DECLARE
  v_current_balance BIGINT;
  v_series_id UUID;
  v_creator_id UUID;
  v_gross_usd NUMERIC(10, 2);
  v_creator_share NUMERIC(10, 2);
BEGIN
  -- Check user wallet balance
  SELECT credits_balance INTO v_current_balance
  FROM public.wallets
  WHERE user_id = p_user_id;

  IF v_current_balance IS NULL OR v_current_balance < p_amount_coins THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient credit balance');
  END IF;

  -- Lookup series and creator
  SELECT series_id INTO v_series_id FROM public.chapters WHERE id = p_chapter_id;
  SELECT creator_id INTO v_creator_id FROM public.series WHERE id = v_series_id;

  -- 1. Deduct credits via immutable ledger entry
  INSERT INTO public.wallet_transactions (
    wallet_id,
    amount,
    type,
    reference,
    description
  ) VALUES (
    p_user_id,
    -p_amount_coins,
    'CHAPTER_UNLOCK',
    p_chapter_id,
    'Chapter episode unlock'
  );

  -- 2. 70/30 Revenue Split calculation:
  -- Base rate: 100 coins = $1.00 USD (i.e. $0.01 per coin)
  v_gross_usd := (p_amount_coins::NUMERIC) * 0.01;
  v_creator_share := ROUND(v_gross_usd * 0.70, 2); -- 70% share

  -- 3. Credit Creator Wallet (Pending balance)
  INSERT INTO public.creator_wallets (creator_id, pending, lifetime)
  VALUES (v_creator_id, v_creator_share, v_creator_share)
  ON CONFLICT (creator_id) DO UPDATE
  SET pending = public.creator_wallets.pending + v_creator_share,
      lifetime = public.creator_wallets.lifetime + v_creator_share,
      updated_at = now();

  -- 4. Record Daily Stats
  INSERT INTO public.series_daily_stats (series_id, date, unlocks_count, revenue_usd)
  VALUES (v_series_id, CURRENT_DATE, 1, v_creator_share)
  ON CONFLICT (series_id, date) DO UPDATE
  SET unlocks_count = public.series_daily_stats.unlocks_count + 1,
      revenue_usd = public.series_daily_stats.revenue_usd + v_creator_share;

  RETURN jsonb_build_object(
    'success', true,
    'deducted_credits', p_amount_coins,
    'creator_share_usd', v_creator_share,
    'unlocked_chapter_id', p_chapter_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8.2 Grant Ad Reward Function
CREATE OR REPLACE FUNCTION public.grant_ad_reward(p_user_id UUID)
RETURNS JSONB AS $$
BEGIN
  -- Insert +50 credits reward into ledger
  INSERT INTO public.wallet_transactions (
    wallet_id,
    amount,
    type,
    description
  ) VALUES (
    p_user_id,
    50,
    'AD_REWARD',
    'Watched sponsored video ad'
  );

  RETURN jsonb_build_object(
    'success', true,
    'reward_credits', 50,
    'user_id', p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapter_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.read_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.series_daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_daily_stats ENABLE ROW LEVEL SECURITY;

-- wallet_transactions
CREATE POLICY "Users can view their own wallet transactions"
  ON public.wallet_transactions FOR SELECT
  USING (auth.uid() = wallet_id);

-- creator_wallets
CREATE POLICY "Creators can view their own wallet"
  ON public.creator_wallets FOR SELECT
  USING (auth.uid() = creator_id OR public.current_user_role() IN ('ADMIN', 'MASTER_ADMIN'));

-- payouts
CREATE POLICY "Creators can view and create payouts"
  ON public.payouts FOR SELECT
  USING (auth.uid() = creator_id OR public.current_user_role() IN ('ADMIN', 'MASTER_ADMIN'));

CREATE POLICY "Creators can submit payout requests"
  ON public.payouts FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Admins can update payout status"
  ON public.payouts FOR UPDATE
  USING (public.current_user_role() IN ('ADMIN', 'MASTER_ADMIN'));

-- subscriptions
CREATE POLICY "Users can view their own subscriptions"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- credit_packages
CREATE POLICY "Active packages are viewable by everyone"
  ON public.credit_packages FOR SELECT
  USING (is_active = true);

-- read_progress
CREATE POLICY "Users can manage their read progress"
  ON public.read_progress FOR ALL
  USING (auth.uid() = user_id);

-- daily stats
CREATE POLICY "Daily stats viewable by creator or admin"
  ON public.creator_daily_stats FOR SELECT
  USING (auth.uid() = creator_id OR public.current_user_role() IN ('ADMIN', 'MASTER_ADMIN'));
