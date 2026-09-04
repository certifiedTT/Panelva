import {
  UserRole,
  SeriesType,
  SeriesStatus,
  ChapterTier,
  PostType,
} from '@panelva/database';

export {
  UserRole,
  SeriesType,
  SeriesStatus,
  ChapterTier,
  PostType,
};

export type LikeTargetType = 'POST' | 'CHAPTER';


export interface ProfileRow {
  id: string;
  username: string;
  pen_name: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  bio: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface SeriesRow {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  cover_url: string;
  banner_url: string | null;
  type: SeriesType;
  genre: string;
  status: SeriesStatus;
  rating: number;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface ChapterRow {
  id: string;
  series_id: string;
  chapter_number: number;
  title: string;
  tier: ChapterTier;
  price_coins: number;
  published_at: string | null;
  created_at: string;
}

export interface PostRow {
  id: string;
  author_id: string;
  content: string;
  type: PostType;
  media_urls: string[];
  likes_count: number;
  comments_count: number;
  created_at: string;
}

export interface CommentRow {
  id: string;
  post_id: string | null;
  chapter_id: string | null;
  user_id: string;
  content: string;
  created_at: string;
}

export interface FollowRow {
  follower_id: string;
  creator_id: string;
  created_at: string;
}

export interface LikeRow {
  user_id: string;
  target_type: LikeTargetType;
  target_id: string;
  created_at: string;
}

export interface NotificationRow {
  id: string;
  user_id: string;
  title: string;
  message: string;
  avatar_url: string | null;
  type: string;
  link_url: string | null;
  is_read: boolean;
  created_at: string;
}

export interface WalletRow {
  user_id: string;
  credits_balance: number;
  coins_balance: number;
  updated_at: string;
}

export interface AnalyticsRow {
  id: string;
  creator_id: string;
  series_id: string | null;
  total_views: number;
  monthly_revenue: number;
  completion_rate: number;
  read_duration_seconds: number;
  period_date: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Partial<ProfileRow> & { id: string; username: string };
        Update: Partial<ProfileRow>;
      };
      series: {
        Row: SeriesRow;
        Insert: Partial<SeriesRow> & { creator_id: string; title: string; cover_url: string };
        Update: Partial<SeriesRow>;
      };
      chapters: {
        Row: ChapterRow;
        Insert: Partial<ChapterRow> & { series_id: string; chapter_number: number; title: string };
        Update: Partial<ChapterRow>;
      };
      posts: {
        Row: PostRow;
        Insert: Partial<PostRow> & { author_id: string; content: string };
        Update: Partial<PostRow>;
      };
      comments: {
        Row: CommentRow;
        Insert: Partial<CommentRow> & { user_id: string; content: string };
        Update: Partial<CommentRow>;
      };
      follows: {
        Row: FollowRow;
        Insert: FollowRow;
        Update: Partial<FollowRow>;
      };
      likes: {
        Row: LikeRow;
        Insert: LikeRow;
        Update: Partial<LikeRow>;
      };
      notifications: {
        Row: NotificationRow;
        Insert: Partial<NotificationRow> & { user_id: string; title: string; message: string };
        Update: Partial<NotificationRow>;
      };
      wallets: {
        Row: WalletRow;
        Insert: Partial<WalletRow> & { user_id: string };
        Update: Partial<WalletRow>;
      };
      analytics: {
        Row: AnalyticsRow;
        Insert: Partial<AnalyticsRow> & { creator_id: string };
        Update: Partial<AnalyticsRow>;
      };
    };
  };
}
