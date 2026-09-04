import {
  UserRole,
  SeriesStatus,
  SeriesType,
  ChapterTier,
  CreatorApplicationType,
  CreatorApplicationStatus,
  NotificationType,
  PostType,
  WalletTransactionType,
  PayoutStatus,
  SubscriptionPlan,
  SubscriptionStatus,
  StudioRole,
  ChapterTaskStage,
  ChapterTaskStatus,
  ContractStatus,
  ReportTargetType,
  ReportReason,
  ReportStatus,
  ModerationAction,
  TicketCategory,
  TicketStatus,
  CopyrightStatus,
} from './enums';

export interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  role: UserRole;
  bio: string | null;
  verified: boolean;
  favorite_genres: string[];
  reputation_points?: number;
  created_at: string;
}

export interface Series {
  id: string;
  creator_id: string;
  studio_id?: string | null;
  title: string;
  synopsis: string;
  cover_url: string;
  genre: string[];
  status: SeriesStatus;
  type: SeriesType;
  language: string;
  mature: boolean;
  rating?: number;
  view_count?: number;
  created_at: string;
}

export interface Chapter {
  id: string;
  series_id: string;
  chapter_number: number; // Supports decimal chapters: 0 (prologue), 1, 1.5, 12.2
  title: string;
  tier: ChapterTier;
  early_access_hours: number;
  published_at: string;
  price_coins?: number;
  created_at: string;
}

export interface Post {
  id: string;
  author_id: string;
  content: string;
  image_url: string | null;
  type?: PostType;
  likes_count: number;
  comments_count: number;
  created_at: string;
}

export interface Comment {
  id: string;
  user_id: string;
  post_id: string | null;
  chapter_id: string | null;
  body: string;
  created_at: string;
}

export interface Follow {
  follower_id: string;
  creator_id: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  avatar_url: string | null;
  link_url: string | null;
  is_read: boolean;
  created_at: string;
}

export interface CreatorApplication {
  id: string;
  user_id: string;
  type: CreatorApplicationType;
  portfolio: string;
  status: CreatorApplicationStatus;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Wallet {
  user_id: string;
  credits_balance: number;
  coins_balance?: number;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  amount: number; // positive = credit, negative = debit
  type: WalletTransactionType;
  reference?: string | null;
  description?: string | null;
  created_at: string;
}

export interface CreatorWallet {
  creator_id: string;
  available: number; // withdrawable
  pending: number;   // waiting period
  lifetime: number;  // total earned historical
  updated_at: string;
}

export interface Payout {
  id: string;
  creator_id: string;
  amount: number;
  status: PayoutStatus;
  approved_by?: string | null;
  paid_at?: string | null;
  created_at: string;
}

export interface Subscription {
  user_id: string;
  plan: SubscriptionPlan;
  expires_at: string;
  status: SubscriptionStatus;
  created_at: string;
}

export interface CreditPackage {
  id: string;
  credits: number;
  price_usd: number;
  bonus_credits: number;
  is_popular: boolean;
  is_active: boolean;
  created_at: string;
}

export interface ChapterView {
  id: string;
  chapter_id: string;
  user_id?: string | null;
  viewed_at: string;
}

export interface ReadProgress {
  id: string;
  user_id: string;
  chapter_id: string;
  progress_percent: number;
  completed: boolean;
  updated_at: string;
}

export interface SeriesDailyStats {
  series_id: string;
  date: string;
  views_count: number;
  unlocks_count: number;
  revenue_usd: number;
}

export interface CreatorDailyStats {
  creator_id: string;
  date: string;
  total_views: number;
  total_revenue_usd: number;
  new_followers: number;
}

export interface Analytics {
  id: string;
  creator_id: string;
  series_id: string | null;
  total_views: number;
  monthly_revenue: number;
  completion_rate: number;
  read_duration_seconds: number;
  period_date: string;
}

export interface ReadHistory {
  user_id: string;
  chapter_id: string;
  series_id: string;
  progress: number;
  last_read: string;
}

export interface Bookmark {
  user_id: string;
  series_id: string;
  created_at: string;
}

export type LibraryStatus = 'READING' | 'PLAN_TO_READ' | 'COMPLETED' | 'DROPPED';

export interface LibraryEntry {
  user_id: string;
  series_id: string;
  status: LibraryStatus;
  updated_at: string;
}

export interface UserStreak {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_read_date: string | null;
  broken_streak?: number;
  broken_at?: string | null;
  is_recoverable?: boolean;
  updated_at: string;
}

export interface Achievement {
  id: string;
  code: string;
  title: string;
  description: string;
  icon_url?: string | null;
  reward_credits: number;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
}

export interface UnifiedSearchResult {
  result_id: string;
  result_type: 'SERIES' | 'CREATOR' | 'POST';
  title: string;
  subtitle?: string | null;
  image_url?: string | null;
  relevance_score: number;
}

export interface Studio {
  id: string;
  name: string;
  slug: string;
  logo_url?: string | null;
  banner_url?: string | null;
  owner_id: string;
  bio?: string | null;
  verified: boolean;
  created_at: string;
}

export interface StudioMember {
  studio_id: string;
  user_id: string;
  role: StudioRole;
  joined_at: string;
}

export interface ChapterTask {
  id: string;
  chapter_id: string;
  series_id: string;
  title: string;
  stage: ChapterTaskStage;
  assigned_to?: string | null;
  status: ChapterTaskStatus;
  due_date?: string | null;
  created_at: string;
}

export interface ChapterVersion {
  id: string;
  chapter_id: string;
  version: number;
  stage: ChapterTaskStage;
  file_url: string;
  notes?: string | null;
  created_by?: string | null;
  created_at: string;
}

export interface SeriesRevenueSplit {
  id: string;
  series_id: string;
  member_id: string;
  percentage: number;
  role: string;
  created_at: string;
}

export interface Contract {
  id: string;
  studio_id: string;
  series_id?: string | null;
  member_id: string;
  type: string;
  terms: Record<string, unknown>;
  revenue_percentage?: number | null;
  status: ContractStatus;
  signed_at?: string | null;
  created_at: string;
}

export interface StudioDailyStats {
  studio_id: string;
  date: string;
  active_members: number;
  chapters_completed: number;
  revenue_usd: number;
  total_views: number;
}

export interface Report {
  id: string;
  reporter_id: string;
  target_type: ReportTargetType;
  target_id: string;
  reason: ReportReason;
  priority: number;
  status: ReportStatus;
  resolved_by?: string | null;
  resolution_action: ModerationAction;
  resolution_notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string;
  actor_role: string;
  action: string;
  target_type: string;
  target_id?: string | null;
  details: Record<string, unknown>;
  ip_address?: string | null;
  created_at: string;
}

export interface SupportTicket {
  id: string;
  user_id: string;
  category: TicketCategory;
  subject: string;
  message: string;
  status: TicketStatus;
  assigned_to?: string | null;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface CopyrightClaim {
  id: string;
  claimant_id: string;
  claimed_series_id?: string | null;
  claimed_chapter_id?: string | null;
  work_title: string;
  evidence_urls: string[];
  description: string;
  status: CopyrightStatus;
  reviewed_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SystemMetric {
  id: string;
  service: string;
  latency_ms: number;
  status: string;
  recorded_at: string;
}
export type GiftTier = 0 | 1 | 2 | 3;

export interface Comment {
  id: string;
  chapter_id?: string | null;
  post_id?: string | null;
  user_id: string;
  content: string;
  priority_score: number;
  sticker_id?: string | null;
  gif_id?: string | null;
  gif_url?: string | null;
  gift_id?: string | null;
  gift_credits?: number;
  gift_tier?: GiftTier;
  parent_id?: string | null;
  is_pinned?: boolean;
  is_hearted?: boolean;
  created_at: string;
  updated_at?: string;
}

export type StickerAccessType = 'FREE' | 'PAID' | 'MEMBERSHIP' | 'PLUS' | 'PREMIUM';
export type StickerPackStatus = 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'ARCHIVED';
export type UserPackSource = 'PURCHASE' | 'CLAIM' | 'MEMBERSHIP' | 'PLUS' | 'PREMIUM';
export type EntitlementReason = 'FREE' | 'PURCHASED' | 'MEMBERSHIP' | 'PLUS' | 'PREMIUM' | 'LOCKED';

export interface StickerPack {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  cover_image: string;
  access_type: StickerAccessType;
  price: number;
  status: StickerPackStatus;
  sticker_count: number;
  created_at: string;
  updated_at: string;
}

export interface Sticker {
  id: string;
  pack_id: string;
  name: string;
  image_url: string;
  animated: boolean;
  width: number;
  height: number;
  order: number;
  created_at: string;
}

export interface UserPackLibrary {
  id: string;
  user_id: string;
  pack_id: string;
  source: UserPackSource;
  expires_at?: string | null;
  created_at: string;
}

export interface FavoriteMedia {
  id: string;
  user_id: string;
  media_type: 'STICKER' | 'GIF';
  media_id: string;
  provider: 'Panelva' | 'Tenor';
  metadata?: string | null;
  created_at: string;
}
