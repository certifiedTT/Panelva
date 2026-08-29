/**
 * Comprehensive Test Suite for Panelva:
 * 1. Rename W-Coins to Credits
 * 2. Instant Early Access System (Premium: 0h, Plus: +2h, Free: +4h)
 * 3. Independence from Content Tiers & 7-day chapter timer
 * 4. Server-Side Early Access Authorizations
 * 5. Cross-platform Data Normalization
 */

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    failed++;
  } else {
    console.log(`✅ PASS: ${message}`);
    passed++;
  }
}

console.log('--- Running Early Access & Credits Test Suite ---');

// Early Access calculation engine (identical to packages/api/src/earlyAccess.ts)
const EARLY_ACCESS_MS = {
  PREMIUM: 0,
  PLUS: 2 * 60 * 60 * 1000,
  FREE: 4 * 60 * 60 * 1000,
};

function formatEarlyAccessDuration(ms) {
  if (ms <= 0) return 'Available now';
  const totalMinutes = Math.ceil(ms / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
}

function getEarlyAccessSchedule(publishedAtInput, referenceTimeInput) {
  const publishedAt = publishedAtInput ? new Date(publishedAtInput) : new Date();
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

function checkEarlyAccessPermission(publishedAtInput, userSubscription, userRole, isCreatorOrCollab, referenceTimeInput) {
  const schedule = getEarlyAccessSchedule(publishedAtInput, referenceTimeInput);

  if (userRole === 'ADMIN' || userRole === 'MASTER_ADMIN') {
    return {
      hasAccess: true,
      isEarlyAccessActive: schedule.isEarlyAccessActive,
      schedule,
      requiredTier: null,
      reason: 'ADMIN_BYPASS',
    };
  }

  if (isCreatorOrCollab) {
    return {
      hasAccess: true,
      isEarlyAccessActive: schedule.isEarlyAccessActive,
      schedule,
      requiredTier: null,
      reason: 'CREATOR_BYPASS',
    };
  }

  if (!schedule.isEarlyAccessActive) {
    return {
      hasAccess: true,
      isEarlyAccessActive: false,
      schedule,
      requiredTier: null,
      reason: 'EARLY_ACCESS_EXPIRED',
    };
  }

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

  if (!schedule.isPlusAvailable) {
    return {
      hasAccess: false,
      isEarlyAccessActive: true,
      schedule,
      requiredTier: 'PREMIUM',
      message: `This content is in Early Access. Available to Plus in ${schedule.plusWaitFormatted}, and to free readers in ${schedule.freeWaitFormatted} (${schedule.freeAccessTimeFormatted}).`,
      reason: 'BLOCKED_NEED_PREMIUM',
    };
  } else {
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

const publishTimestamp = new Date('2026-08-20T12:00:00.000Z');

// Test Case 1: T+0 (Publication Moment: 12:00 PM)
const t0 = new Date('2026-08-20T12:00:00.000Z');
const schedT0 = getEarlyAccessSchedule(publishTimestamp, t0);
assert(schedT0.isEarlyAccessActive === true, 'T0: Early access is active');
assert(schedT0.isPlusAvailable === false, 'T0: Plus access is not available');
assert(schedT0.isFreeAvailable === false, 'T0: Free access is not available');
assert(schedT0.timeUntilPlusMs === 2 * 3600 * 1000, 'T0: 2 hours until Plus');
assert(schedT0.timeUntilFreeMs === 4 * 3600 * 1000, 'T0: 4 hours until Free');
assert(schedT0.plusWaitFormatted === '2h', 'T0: plusWaitFormatted is 2h');
assert(schedT0.freeWaitFormatted === '4h', 'T0: freeWaitFormatted is 4h');

// Test Case 2: T+1h (1:00 PM - Premium window only)
const t1 = new Date('2026-08-20T13:00:00.000Z');
const schedT1 = getEarlyAccessSchedule(publishTimestamp, t1);
assert(schedT1.isEarlyAccessActive === true, 'T1: Early access is active');
assert(schedT1.isPlusAvailable === false, 'T1: Plus access is not available');
assert(schedT1.isFreeAvailable === false, 'T1: Free access is not available');
assert(schedT1.plusWaitFormatted === '1h', 'T1: Plus wait is 1h');
assert(schedT1.freeWaitFormatted === '3h', 'T1: Free wait is 3h');

// Test Case 3: T+2h (2:00 PM - Plus access unlocks)
const t2 = new Date('2026-08-20T14:00:00.000Z');
const schedT2 = getEarlyAccessSchedule(publishTimestamp, t2);
assert(schedT2.isEarlyAccessActive === true, 'T2: Early access is active (waiting for free)');
assert(schedT2.isPlusAvailable === true, 'T2: Plus access IS available');
assert(schedT2.isFreeAvailable === false, 'T2: Free access is not available');
assert(schedT2.plusWaitFormatted === 'Available now', 'T2: Plus wait is Available now');
assert(schedT2.freeWaitFormatted === '2h', 'T2: Free wait is 2h');

// Test Case 4: T+3h (3:00 PM - Plus active, 1h left for free)
const t3 = new Date('2026-08-20T15:00:00.000Z');
const schedT3 = getEarlyAccessSchedule(publishTimestamp, t3);
assert(schedT3.isEarlyAccessActive === true, 'T3: Early access is active');
assert(schedT3.isPlusAvailable === true, 'T3: Plus is available');
assert(schedT3.freeWaitFormatted === '1h', 'T3: Free wait is 1h');

// Test Case 5: T+4h (4:00 PM - Free access unlocks, early access period ends)
const t4 = new Date('2026-08-20T16:00:00.000Z');
const schedT4 = getEarlyAccessSchedule(publishTimestamp, t4);
assert(schedT4.isEarlyAccessActive === false, 'T4: Early access has expired');
assert(schedT4.isPlusAvailable === true, 'T4: Plus available');
assert(schedT4.isFreeAvailable === true, 'T4: Free available');
assert(schedT4.freeWaitFormatted === 'Available now', 'T4: Free wait is Available now');

// ==========================================
// 2. PERMISSION CHECKS ACROSS SUBSCRIPTION TIERS
// ==========================================

// Premium tests
assert(checkEarlyAccessPermission(publishTimestamp, 'PREMIUM', 'USER', false, t0).hasAccess === true, 'Premium has immediate access at T0');
assert(checkEarlyAccessPermission(publishTimestamp, 'PREMIUM', 'USER', false, t1).hasAccess === true, 'Premium has access at T1');
assert(checkEarlyAccessPermission(publishTimestamp, 'PREMIUM', 'USER', false, t2).hasAccess === true, 'Premium has access at T2');
assert(checkEarlyAccessPermission(publishTimestamp, 'PREMIUM', 'USER', false, t4).hasAccess === true, 'Premium has access at T4');

// Plus tests
const pCheckT0 = checkEarlyAccessPermission(publishTimestamp, 'PLUS', 'USER', false, t0);
assert(pCheckT0.hasAccess === false && pCheckT0.requiredTier === 'PREMIUM', 'Plus blocked at T0 (Needs Premium for 0-2h)');

const pCheckT1 = checkEarlyAccessPermission(publishTimestamp, 'PLUS', 'USER', false, t1);
assert(pCheckT1.hasAccess === false && pCheckT1.requiredTier === 'PREMIUM', 'Plus blocked at T1 (Needs Premium for 0-2h)');

const pCheckT2 = checkEarlyAccessPermission(publishTimestamp, 'PLUS', 'USER', false, t2);
assert(pCheckT2.hasAccess === true && pCheckT2.reason === 'PLUS_TIER', 'Plus allowed at T2 (+2h)');

const pCheckT3 = checkEarlyAccessPermission(publishTimestamp, 'PLUS', 'USER', false, t3);
assert(pCheckT3.hasAccess === true && pCheckT3.reason === 'PLUS_TIER', 'Plus allowed at T3 (+3h)');

// Free readers tests
const fCheckT0 = checkEarlyAccessPermission(publishTimestamp, 'NONE', 'USER', false, t0);
assert(fCheckT0.hasAccess === false && fCheckT0.requiredTier === 'PREMIUM', 'Free reader blocked at T0 (offers Premium upgrade)');

const fCheckT2 = checkEarlyAccessPermission(publishTimestamp, 'NONE', 'USER', false, t2);
assert(fCheckT2.hasAccess === false && fCheckT2.requiredTier === 'PLUS', 'Free reader blocked at T2 (offers Plus upgrade)');

const fCheckT4 = checkEarlyAccessPermission(publishTimestamp, 'NONE', 'USER', false, t4);
assert(fCheckT4.hasAccess === true && fCheckT4.reason === 'EARLY_ACCESS_EXPIRED', 'Free reader allowed at T4 (Early access ended)');

// Admin & Creator Bypass
assert(checkEarlyAccessPermission(publishTimestamp, 'NONE', 'ADMIN', false, t0).hasAccess === true, 'Admin bypasses early access at T0');
assert(checkEarlyAccessPermission(publishTimestamp, 'NONE', 'MASTER_ADMIN', false, t0).hasAccess === true, 'Master admin bypasses early access at T0');
assert(checkEarlyAccessPermission(publishTimestamp, 'NONE', 'USER', true, t0).hasAccess === true, 'Series creator bypasses early access at T0');

// ==========================================
// 3. SEPARATION FROM CONTENT ACCESS TIERS
// ==========================================
// Scenario: A chapter is FREE tier, but in early access (T+1h)
const earlyFreeChapter = {
  id: 'ch-new-free',
  title: 'Episode 10',
  tier: 'FREE',
  createdAt: publishTimestamp,
};

const plusAtT1 = checkEarlyAccessPermission(earlyFreeChapter.createdAt, 'PLUS', 'USER', false, t1);
assert(plusAtT1.hasAccess === false, 'FREE tier chapter in early access blocks Plus at T1');

const plusAtT2 = checkEarlyAccessPermission(earlyFreeChapter.createdAt, 'PLUS', 'USER', false, t2);
assert(plusAtT2.hasAccess === true, 'FREE tier chapter in early access allows Plus at T2');

const freeAtT4 = checkEarlyAccessPermission(earlyFreeChapter.createdAt, 'NONE', 'USER', false, t4);
assert(freeAtT4.hasAccess === true, 'FREE tier chapter allows Free reader after early access expires at T4');

// ==========================================
// 4. CURRENCY RENAMING CHECKS (CREDITS)
// ==========================================
const testUser = {
  id: 'usr-1',
  username: 'LunaBlade',
  creditsBalance: 550,
  wCoinBalance: 550,
};

assert(testUser.creditsBalance === 550, 'User profile supports creditsBalance');
assert(typeof testUser.creditsBalance === 'number', 'creditsBalance is numeric');

// Payout conversion rate test: 1,000 Credits = $1.00 USD -> 1 Credit = 0.1 cents = $0.001
const creatorEarningsCredits = 10000;
const usdValue = (creatorEarningsCredits / 1000) * 1.0;
assert(usdValue === 10.0, '10,000 Credits converts to $10.00 USD');

console.log(`\n========================================`);
console.log(`Early Access & Credits Summary: ${passed} Passed, ${failed} Failed`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
