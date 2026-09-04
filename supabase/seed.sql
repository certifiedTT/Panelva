-- ==========================================================
-- Panelva Production Seed Data
-- ==========================================================

-- 1. SEED PROFILES
-- Matches realistic users with defined PostgreSQL roles
INSERT INTO public.profiles (id, username, pen_name, avatar_url, bio, role)
VALUES 
  (
    '00000000-0000-0000-0000-000000000001',
    'master_admin',
    'System Overseer',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    'Master administrator supervising full Panelva platform integrity.',
    'MASTER_ADMIN'
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'admin_ops',
    'Ops Supervisor',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    'Operations & series curation administrator.',
    'ADMIN'
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'mod_community',
    'Community Sentinel',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    'Platform safety and moderation team lead.',
    'MODERATOR'
  ),
  (
    '00000000-0000-0000-0000-000000000004',
    'StudioSpectre',
    'Studio Spectre',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    'High-octane action and sci-fi comic production team behind Shadow City: Neon Blade.',
    'CREATOR'
  ),
  (
    '00000000-0000-0000-0000-000000000005',
    'LadySeraphina',
    'Lady Seraphina',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
    'Romance & historical fantasy novelist. Author of Born to be Grand Duchess.',
    'CREATOR'
  ),
  (
    '00000000-0000-0000-0000-000000000006',
    'CyberReader99',
    'Alex Reader',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400',
    'Avid webtoon and light novel reader.',
    'READER'
  )
ON CONFLICT (id) DO NOTHING;

-- 2. SEED WALLETS
INSERT INTO public.wallets (user_id, credits_balance, coins_balance)
VALUES 
  ('00000000-0000-0000-0000-000000000004', 1845, 12000),
  ('00000000-0000-0000-0000-000000000005', 920, 4800),
  ('00000000-0000-0000-0000-000000000006', 250, 500)
ON CONFLICT (user_id) DO NOTHING;

-- 3. SEED SERIES
INSERT INTO public.series (id, creator_id, title, description, cover_url, type, genre, status, rating, view_count)
VALUES 
  (
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000004',
    'Shadow City: Neon Blade',
    'In the hyper-dense sprawl of Neo-Kowloon, an augmented street courier discovers an encrypted AI core capable of overriding corporate cyberware.',
    'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600',
    'COMIC',
    'Cyberpunk',
    'ONGOING',
    4.92,
    382000
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000005',
    'Born to be Grand Duchess',
    'Betrayed and executed by her royal court, Lady Vivienne wakes up ten years in the past on the eve of the imperial ball.',
    'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600',
    'NOVEL',
    'Romance Fantasy',
    'ONGOING',
    4.88,
    510000
  )
ON CONFLICT (id) DO NOTHING;

-- 4. SEED CHAPTERS
INSERT INTO public.chapters (id, series_id, chapter_number, title, tier, price_coins)
VALUES 
  (
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    1,
    'Prologue: Rain on Neon Glass',
    'FREE',
    0
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000001',
    2,
    'Episode 2: The Cybernetic Edge',
    'FREE',
    0
  ),
  (
    '20000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000001',
    3,
    'Episode 3: Syndicate Patrols',
    'AD_SUPPORTED',
    15
  ),
  (
    '20000000-0000-0000-0000-000000000004',
    '10000000-0000-0000-0000-000000000002',
    1,
    'Chapter 1: The Second Dawn',
    'FREE',
    0
  )
ON CONFLICT (id) DO NOTHING;

-- 5. SEED CREATOR POSTS (Creator Hub)
INSERT INTO public.posts (id, author_id, content, type, likes_count, comments_count)
VALUES 
  (
    '30000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000004',
    'Episode 14 coloring is 90% complete! The bike chase sequence through the neon tunnels came out better than expected.',
    'UPDATE',
    342,
    58
  ),
  (
    '30000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000005',
    'Volume 3 reaches the imperial tribunal tomorrow. Which character arc has surprised you the most so far?',
    'POLL',
    512,
    94
  )
ON CONFLICT (id) DO NOTHING;

-- 6. SEED NOTIFICATIONS
INSERT INTO public.notifications (id, user_id, title, message, avatar_url, type, is_read)
VALUES 
  (
    '40000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000006',
    'New Chapter Released!',
    'Studio Spectre published "Episode 3: Syndicate Patrols" in Shadow City: Neon Blade.',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    'CHAPTER_RELEASE',
    false
  ),
  (
    '40000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000006',
    'Daily Login Reward',
    'You received 25 bonus credits! Use them to unlock your favorite serialized episodes.',
    null,
    'SYSTEM',
    true
  )
ON CONFLICT (id) DO NOTHING;

-- 7. SEED ANALYTICS
INSERT INTO public.analytics (creator_id, series_id, total_views, monthly_revenue, completion_rate, read_duration_seconds)
VALUES 
  (
    '00000000-0000-0000-0000-000000000004',
    '10000000-0000-0000-0000-000000000001',
    382000,
    1845.50,
    94.20,
    408
  )
ON CONFLICT DO NOTHING;
