/**
 * Panelva Instant Early Access System Core Logic
 *
 * Early Access Hierarchy:
 * 1. Premium Subscribers: Immediate access (0 hours delay)
 * 2. Plus Subscribers: Access 2 hours after publication
 * 3. Free Readers: Access 4 hours after publication (2 hours after Plus)
 *
 * Operates independently from Content Tiers (FREE, AD_SUPPORTED, PREMIUM)
 * and independent from the 7-day wait-for-free lifecycle timer.
 */

export const EARLY_ACCESS_HOURS = {
  PREMIUM: 0,
  PLUS: 2,
  FREE: 4,
} as const;

export const EARLY_ACCESS_MS = {
  PREMIUM: 0,
  PLUS: 2 * 60 * 60 * 1000,       // 2 hours in ms
  FREE: 4 * 60 * 60 * 1000,       // 4 hours in ms
} as const;

export interface EarlyAccessSchedule {
  publishedAt: Date;
  premiumAccessAt: Date;
  plusAccessAt: Date;
  freeAccessAt: Date;
  isEarlyAccessActive: boolean;    // true if current time < freeAccessAt
  isPlusAvailable: boolean;        // true if current time >= plusAccessAt
  isFreeAvailable: boolean;        // true if current time >= freeAccessAt
  timeUntilPlusMs: number;         // ms remaining until Plus access (0 if past)
  timeUntilFreeMs: number;         // ms remaining until Free access (0 if past)
  plusWaitFormatted: string;       // e.g. "1h 32m" or "Available now"
  freeWaitFormatted: string;       // e.g. "3h 32m" or "Available now"
  freeAccessTimeFormatted: string; // e.g. "4:00 PM"
}

export interface EarlyAccessCheckResult {
  hasAccess: boolean;
  isEarlyAccessActive: boolean;
  schedule: EarlyAccessSchedule;
  requiredTier: 'PREMIUM' | 'PLUS' | null;
  message?: string;
  reason?: 'ADMIN_BYPASS' | 'CREATOR_BYPASS' | 'PREMIUM_TIER' | 'PLUS_TIER' | 'EARLY_ACCESS_EXPIRED' | 'BLOCKED_NEED_PLUS' | 'BLOCKED_NEED_PREMIUM';
}

/**
 * Format duration in milliseconds to human readable string (e.g. "1h 32m", "45m", "Available now")
 */
export function formatEarlyAccessDuration(ms: number): string {
  if (ms <= 0) return 'Available now';
  
  const totalMinutes = Math.ceil(ms / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (hours > 0) {
    return `${hours}h`;
  }
  return `${minutes}m`;
}

/**
 * Calculate the complete Early Access Schedule for a given publication timestamp.
 */
export function getEarlyAccessSchedule(
  publishedAtInput: Date | string | number | null | undefined,
  referenceTimeInput?: Date | string | number
): EarlyAccessSchedule {
  const publishedAt = publishedAtInput
    ? new Date(publishedAtInput)
    : new Date();

  // If invalid date, fallback to epoch/now
  const validPublishedAt = isNaN(publishedAt.getTime()) ? new Date() : publishedAt;
  const now = referenceTimeInput ? new Date(referenceTimeInput) : new Date();
  const nowTime = now.getTime();
  const pubTime = validPublishedAt.getTime();

  const premiumAccessAt = new Date(pubTime);
  const plusAccessAt = new Date(pubTime + EARLY_ACCESS_MS.PLUS);
  const freeAccessAt = new Date(pubTime + EARLY_ACCESS_MS.FREE);

  const isEarlyAccessActive = nowTime < freeAccessAt.getTime();
  const isPlusAvailable = nowTime >= plusAccessAt.getTime();
  const isFreeAvailable = nowTime >= freeAccessAt.getTime();

  const timeUntilPlusMs = Math.max(0, plusAccessAt.getTime() - nowTime);
  const timeUntilFreeMs = Math.max(0, freeAccessAt.getTime() - nowTime);

  // Time format
  const freeAccessTimeFormatted = freeAccessAt.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });

  return {
    publishedAt: validPublishedAt,
    premiumAccessAt,
    plusAccessAt,
    freeAccessAt,
    isEarlyAccessActive,
    isPlusAvailable,
    isFreeAvailable,
    timeUntilPlusMs,
    timeUntilFreeMs,
    plusWaitFormatted: formatEarlyAccessDuration(timeUntilPlusMs),
    freeWaitFormatted: formatEarlyAccessDuration(timeUntilFreeMs),
    freeAccessTimeFormatted,
  };
}

/**
 * Evaluate if a user has access to content under early access rules.
 */
export function checkEarlyAccessPermission(
  publishedAtInput: Date | string | number | null | undefined,
  userSubscription?: string | null,
  userRole?: string | null,
  isCreatorOrCollab?: boolean,
  referenceTimeInput?: Date | string | number
): EarlyAccessCheckResult {
  const schedule = getEarlyAccessSchedule(publishedAtInput, referenceTimeInput);

  // 1. Admin / Master Admin Bypass
  if (userRole === 'ADMIN' || userRole === 'MASTER_ADMIN') {
    return {
      hasAccess: true,
      isEarlyAccessActive: schedule.isEarlyAccessActive,
      schedule,
      requiredTier: null,
      reason: 'ADMIN_BYPASS',
    };
  }

  // 2. Series Creator / Collaborator Bypass
  if (isCreatorOrCollab) {
    return {
      hasAccess: true,
      isEarlyAccessActive: schedule.isEarlyAccessActive,
      schedule,
      requiredTier: null,
      reason: 'CREATOR_BYPASS',
    };
  }

  // 3. If Early Access window has expired (+4 hours past publication) -> full public access allowed
  if (!schedule.isEarlyAccessActive) {
    return {
      hasAccess: true,
      isEarlyAccessActive: false,
      schedule,
      requiredTier: null,
      reason: 'EARLY_ACCESS_EXPIRED',
    };
  }

  // 4. Premium Subscriber -> Immediate access at any time
  const normalizedSub = (userSubscription || '').toUpperCase();
  if (normalizedSub === 'PREMIUM') {
    return {
      hasAccess: true,
      isEarlyAccessActive: true,
      schedule,
      requiredTier: null,
      reason: 'PREMIUM_TIER',
    };
  }

  // 5. Plus Subscriber -> Access after +2 hours
  if (normalizedSub === 'PLUS') {
    if (schedule.isPlusAvailable) {
      return {
        hasAccess: true,
        isEarlyAccessActive: true,
        schedule,
        requiredTier: null,
        reason: 'PLUS_TIER',
      };
    }

    return {
      hasAccess: false,
      isEarlyAccessActive: true,
      schedule,
      requiredTier: 'PREMIUM',
      message: `Available to Plus subscribers in ${schedule.plusWaitFormatted}. Upgrade to Premium for instant access.`,
      reason: 'BLOCKED_NEED_PREMIUM',
    };
  }

  // 6. Free Readers -> Blocked during the 4-hour window
  if (!schedule.isPlusAvailable) {
    // Within 0h - 2h: Need Premium for now, Plus available at +2h, Free at +4h
    return {
      hasAccess: false,
      isEarlyAccessActive: true,
      schedule,
      requiredTier: 'PREMIUM',
      message: `This content is in Early Access. Available to Plus in ${schedule.plusWaitFormatted}, and to free readers in ${schedule.freeWaitFormatted} (${schedule.freeAccessTimeFormatted}).`,
      reason: 'BLOCKED_NEED_PREMIUM',
    };
  } else {
    // Within 2h - 4h: Plus is active, Free available at +4h
    return {
      hasAccess: false,
      isEarlyAccessActive: true,
      schedule,
      requiredTier: 'PLUS',
      message: `Available to Plus subscribers now, and to free readers in ${schedule.freeWaitFormatted} (${schedule.freeAccessTimeFormatted}).`,
      reason: 'BLOCKED_NEED_PLUS',
    };
  }
}
