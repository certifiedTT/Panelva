import { ChapterTier, UserRole, UserSubscription } from './enums';
import { Chapter } from './schema';

export interface ChapterAccessResult {
  is_locked: boolean;
  unlock_at: Date;
  early_access_hours: number;
  reason?: string;
}

export interface UserContext {
  id?: string;
  role?: UserRole;
  subscription?: UserSubscription;
  isCreatorOwner?: boolean;
}

/**
 * Calculates chapter availability and lock state.
 *
 * Rules:
 * 1. Admins, moderators, and the creator owning the series always bypass lock.
 * 2. If chapter is FREE with 0 early access hours, it is unlocked immediately.
 * 3. Early access logic based on user subscription tier:
 *    - Premium: immediately (0 hours delay)
 *    - Plus: +2 hours delay after publication
 *    - Free (None): +4 hours delay (or full early_access_hours)
 */
export function calculateChapterAccess(
  chapter: Pick<Chapter, 'published_at' | 'tier' | 'early_access_hours'>,
  user?: UserContext | null,
  currentTime: Date = new Date()
): ChapterAccessResult {
  const publishedAt = new Date(chapter.published_at);
  const earlyHours = chapter.early_access_hours || 0;

  // 1. Privileged users (Admin, Master Admin, or the Creator Owner)
  if (
    user?.role === UserRole.MASTER_ADMIN ||
    user?.role === UserRole.ADMIN ||
    user?.isCreatorOwner
  ) {
    return {
      is_locked: false,
      unlock_at: publishedAt,
      early_access_hours: earlyHours,
    };
  }

  // 2. Non-free tier chapters (e.g. AD_UNLOCK or PREMIUM permanent tier)
  if (chapter.tier === ChapterTier.PREMIUM) {
    const hasPremium = user?.subscription === UserSubscription.PREMIUM;
    return {
      is_locked: !hasPremium,
      unlock_at: publishedAt,
      early_access_hours: earlyHours,
      reason: hasPremium ? undefined : 'Requires Premium subscription',
    };
  }

  // 3. Early access window logic for FREE/AD_UNLOCK chapters
  if (earlyHours <= 0) {
    return {
      is_locked: false,
      unlock_at: publishedAt,
      early_access_hours: 0,
    };
  }

  // Calculate tier-specific delay in hours
  let requiredWaitHours = earlyHours;
  if (user?.subscription === UserSubscription.PREMIUM) {
    requiredWaitHours = 0; // Premium users get immediate access
  } else if (user?.subscription === UserSubscription.PLUS) {
    requiredWaitHours = Math.min(2, earlyHours); // Plus gets +2 hours
  } else {
    requiredWaitHours = Math.max(4, earlyHours); // Free readers get +4 hours or full earlyHours
  }

  const unlockTime = new Date(publishedAt.getTime() + requiredWaitHours * 60 * 60 * 1000);
  const isLocked = currentTime < unlockTime;

  return {
    is_locked: isLocked,
    unlock_at: unlockTime,
    early_access_hours: earlyHours,
    reason: isLocked
      ? `Available on ${unlockTime.toLocaleDateString()} ${unlockTime.toLocaleTimeString()}`
      : undefined,
  };
}
