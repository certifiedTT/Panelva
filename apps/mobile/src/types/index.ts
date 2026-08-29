/**
 * Strongly typed interfaces for Panelva Mobile application
 */

export type SeriesType = 'COMIC' | 'NOVEL' | 'MANHWA' | string;
export type ChapterTier = 'FREE' | 'AD_SUPPORTED' | 'PREMIUM' | string;
export type UserRole = 'USER' | 'CREATOR' | 'ADMIN' | 'STAFF' | string;
export type SubscriptionTier = 'NONE' | 'PLUS' | 'PREMIUM' | string;

export interface EarlyAccessSchedule {
  publishedAt: Date | string;
  premiumAccessAt: Date | string;
  plusAccessAt: Date | string;
  freeAccessAt: Date | string;
  isEarlyAccessActive: boolean;
  isPlusAvailable: boolean;
  isFreeAvailable: boolean;
  timeUntilPlusMs: number;
  timeUntilFreeMs: number;
  plusWaitFormatted: string;
  freeWaitFormatted: string;
  freeAccessTimeFormatted: string;
}

export interface CreatorUser {
  id?: string;
  username?: string;
  avatarUrl?: string | null;
}

export interface Creator {
  id: string;
  userId?: string;
  penName: string;
  bio?: string | null;
  avatarUrl?: string | null;
  isVetted?: boolean;
  user?: CreatorUser | null;
  followersCount?: number;
  seriesCount?: number;
  totalViews?: number;
  [key: string]: any;
}

export interface Chapter {
  id: string;
  seriesId?: string;
  chapterIndex: number;
  title: string;
  subtitle?: string | null;
  tier: ChapterTier;
  isLocked?: boolean;
  isEarlyAccess?: boolean;
  earlyAccess?: EarlyAccessSchedule | null;
  pages?: string[];
  textContent?: string | null;
  createdAt?: string | Date | null;
  price?: number;
  views?: number;
  likes?: number;
  commentCount?: number;
  [key: string]: any;
}

export interface Series {
  id: string;
  title: string;
  description?: string | null;
  quote?: string | null;
  synopsis?: string | null;
  coverUrl?: string | null;
  coverBg?: string | null;
  rating?: string | number | null;
  genre?: string | null;
  type: SeriesType;
  views?: string | number;
  likes?: number;
  status?: string | null;
  statusMessage?: string | null;
  statusUpdatedAt?: string | Date | null;
  author?: string | null;
  creatorId?: string | null;
  creator?: Creator | null;
  chapters?: Chapter[];
  isHot?: boolean;
  isEarlyAccess?: boolean;
  earlyAccess?: EarlyAccessSchedule | null;
  linkedSeriesId?: string | null;
  linkedSeries?: Series | null;
  format?: 'comic' | 'novel' | 'COMIC' | 'NOVEL' | string;
  alternateFormat?: string | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
  [key: string]: any;
}

export interface User {
  id: string;
  email: string;
  username?: string;
  role?: UserRole;
  subscription?: SubscriptionTier;
  creditsBalance?: number;
  wCoinBalance?: number;
  avatarUrl?: string | null;
  [key: string]: any;
}

export interface ReadingHistoryItem {
  id: string;
  userId?: string;
  chapterId?: string;
  seriesId?: string;
  progressPct: number;
  scrollProgress?: number;
  updatedAt?: string | Date;
  chapter?: Chapter & { series?: Series };
}

export interface BookmarkItem {
  id: string;
  userId?: string;
  seriesId: string;
  createdAt?: string | Date;
  series?: Series;
}

export interface UseSeriesDetailResult {
  series: Series | null;
  chapters: Chapter[];
  creator: Creator | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}
