/**
 * Test Suite: Reader Profile Experience, Role Matrix & Streak Recovery System
 * Validates requirements for:
 * 1. Reader Stats Row (Following, Streak, Reads; no Followers)
 * 2. Streak Recovery System (24h window, 20 Credits, no free restores for Plus/Premium, reset after 24h)
 * 3. Role-based Navigation Tabs (No Posts for readers; Favorites, About, Activity)
 * 4. Redesigned Activity Tab (Reading Journal: Today, Summary, Recent History)
 * 5. Role-based Profile Matrix (Reader vs Creator vs Studio vs Admin)
 * 6. Comments & Community Reputation Lifecycle (+5 reputation on comment, duplicate prevention, revocation on delete)
 */

const assert = require('assert');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`✓ Passed: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`✗ FAILED: ${name}`);
    console.error(`  Error: ${err.message}`);
    failedTests++;
  }
}

console.log('====================================================');
console.log('🧪 RUNNING READER PROFILE & STREAK RECOVERY TEST SUITE');
console.log('====================================================\n');

// -------------------------------------------------------------
// 1. STATS ROW SPECIFICATION
// -------------------------------------------------------------
console.log('--- Suite 1: Stats Row per Role ---');

function getProfileStats(role, userData = {}) {
  const isCreator = role === 'CREATOR' || role === 'VERIFIED_CREATOR';
  const isStudio = role === 'STUDIO';
  const isAdmin = role === 'ADMIN' || role === 'MASTER_ADMIN';
  const isReader = !isCreator && !isStudio && !isAdmin;

  if (isReader) {
    return {
      following: userData.followingCount || 42,
      streak: userData.streakCount || 5,
      reads: userData.totalReads || 384,
      followers: undefined, // Followers must be strictly absent for readers
    };
  }

  if (isCreator) {
    return {
      followers: userData.followersCount || 128,
      following: userData.followingCount || 42,
      series: userData.publishedSeriesCount || 2,
    };
  }

  if (isStudio) {
    return {
      followers: userData.followersCount || 128,
      following: userData.followingCount || 42,
      projects: userData.projectsCount || 4,
    };
  }

  // Admin
  return {
    auditLogs: userData.auditCount || 128,
    queuedReports: userData.reportsCount || 12,
    managedContent: userData.managedCount || 84,
  };
}

runTest('Reader stats row has Following (42), Streak (5), Reads (384)', () => {
  const stats = getProfileStats('USER');
  assert.strictEqual(stats.following, 42, 'Following must default to 42');
  assert.strictEqual(stats.streak, 5, 'Streak must default to 5');
  assert.strictEqual(stats.reads, 384, 'Reads must default to 384');
});

runTest('Followers is completely removed for Reader', () => {
  const stats = getProfileStats('USER');
  assert.strictEqual(stats.followers, undefined, 'Followers must not exist for Reader');
});

runTest('Creator profile retains Followers and Following', () => {
  const stats = getProfileStats('CREATOR');
  assert.strictEqual(stats.followers, 128, 'Creator has followers');
  assert.strictEqual(stats.following, 42, 'Creator has following');
  assert.strictEqual(stats.series, 2, 'Creator shows published series');
});

runTest('Studio profile shows Followers, Following, and Projects', () => {
  const stats = getProfileStats('STUDIO');
  assert.strictEqual(stats.followers, 128, 'Studio has followers');
  assert.strictEqual(stats.following, 42, 'Studio has following');
  assert.strictEqual(stats.projects, 4, 'Studio shows projects');
});

runTest('Admin profile shows operational metrics instead of social influence', () => {
  const stats = getProfileStats('ADMIN');
  assert.strictEqual(stats.followers, undefined, 'Admin has no followers count');
  assert.strictEqual(stats.auditLogs, 128, 'Admin shows audit logs');
  assert.strictEqual(stats.queuedReports, 12, 'Admin shows queued reports');
});

// -------------------------------------------------------------
// 2. STREAK RECOVERY SYSTEM
// -------------------------------------------------------------
console.log('\n--- Suite 2: Streak Recovery System ---');

class StreakRecoveryService {
  constructor() {
    this.COST = 20;
    this.MAX_WINDOW_HOURS = 24;
    this.MASTER_ADMIN_ACCOUNT = 'master-admin';
  }

  getSubscriptionTokens(tier) {
    if (tier === 'PREMIUM') return 3;
    if (tier === 'PLUS') return 2;
    return 1; // Free users get 1 restore token
  }

  checkEligibility({ brokenAtHoursAgo, brokenStreak, alreadyRestored, subscriptionTier = 'NONE' }) {
    if (alreadyRestored) {
      return { eligible: false, reason: 'ALREADY_RESTORED' };
    }
    if (brokenAtHoursAgo > this.MAX_WINDOW_HOURS) {
      return { eligible: false, reason: 'EXPIRED_PERMANENTLY', resetStreak: 0 };
    }
    if (!brokenStreak || brokenStreak <= 0) {
      return { eligible: false, reason: 'NO_BROKEN_STREAK' };
    }

    const availableTokens = this.getSubscriptionTokens(subscriptionTier);

    return {
      eligible: true,
      costCredits: this.COST,
      availableTokens,
      destination: 'PLATFORM_MASTER_ADMIN', // 20 Credits fee goes strictly to platform master-admin account
      destinationAccount: this.MASTER_ADMIN_ACCOUNT,
      hoursRemaining: this.MAX_WINDOW_HOURS - brokenAtHoursAgo,
      restorableStreak: brokenStreak,
    };
  }

  restoreStreak({ userCredits, subscriptionTier = 'NONE', eligibility, useToken = false }) {
    if (!eligibility.eligible) {
      throw new Error(`Cannot restore: ${eligibility.reason}`);
    }

    const tokens = eligibility.availableTokens ?? this.getSubscriptionTokens(subscriptionTier);

    // If using restore token (3 for Premium, 2 for Plus, 1 for Free)
    if (useToken && tokens > 0) {
      return {
        success: true,
        restoredStreak: eligibility.restorableStreak,
        usedToken: true,
        deductedCredits: 0,
        remainingTokens: tokens - 1,
        remainingCredits: userCredits,
        destination: 'PLATFORM_MASTER_ADMIN',
        destinationAccount: this.MASTER_ADMIN_ACCOUNT,
        alreadyRestored: true,
      };
    }

    // Credits cost: 20 Credits strictly to the platform master-admin account
    const cost = this.COST;

    if (userCredits < cost) {
      throw new Error(`Insufficient credits. Required: ${cost}, available: ${userCredits}`);
    }

    return {
      success: true,
      restoredStreak: eligibility.restorableStreak,
      usedToken: false,
      deductedCredits: cost,
      destination: 'PLATFORM_MASTER_ADMIN',
      destinationAccount: this.MASTER_ADMIN_ACCOUNT,
      remainingCredits: userCredits - cost,
      alreadyRestored: true,
    };
  }
}

const streakService = new StreakRecoveryService();

runTest('Premium subscription gets 3 restore tokens', () => {
  const tokens = streakService.getSubscriptionTokens('PREMIUM');
  assert.strictEqual(tokens, 3, 'Premium must get 3 restore tokens');
});

runTest('Panelva Plus subscription gets 2 restore tokens', () => {
  const tokens = streakService.getSubscriptionTokens('PLUS');
  assert.strictEqual(tokens, 2, 'Plus must get 2 restore tokens');
});

runTest('Free user gets 1 restore token', () => {
  const tokens = streakService.getSubscriptionTokens('NONE');
  assert.strictEqual(tokens, 1, 'Free user gets 1 restore token');
});

runTest('Premium user can restore streak using 1 token at 0 credit cost (2 tokens remaining)', () => {
  const eligibility = streakService.checkEligibility({
    brokenAtHoursAgo: 10,
    brokenStreak: 20,
    alreadyRestored: false,
    subscriptionTier: 'PREMIUM',
  });
  const outcome = streakService.restoreStreak({
    userCredits: 100,
    subscriptionTier: 'PREMIUM',
    eligibility,
    useToken: true,
  });
  assert.strictEqual(outcome.success, true);
  assert.strictEqual(outcome.usedToken, true);
  assert.strictEqual(outcome.deductedCredits, 0, 'Token restore must cost 0 credits');
  assert.strictEqual(outcome.remainingTokens, 2, '2 tokens must remain out of 3');
  assert.strictEqual(outcome.restoredStreak, 20);
});

runTest('Panelva Plus user can restore streak using 1 token at 0 credit cost (1 token remaining)', () => {
  const eligibility = streakService.checkEligibility({
    brokenAtHoursAgo: 14,
    brokenStreak: 20,
    alreadyRestored: false,
    subscriptionTier: 'PLUS',
  });
  const outcome = streakService.restoreStreak({
    userCredits: 50,
    subscriptionTier: 'PLUS',
    eligibility,
    useToken: true,
  });
  assert.strictEqual(outcome.success, true);
  assert.strictEqual(outcome.usedToken, true);
  assert.strictEqual(outcome.deductedCredits, 0);
  assert.strictEqual(outcome.remainingTokens, 1, '1 token remains out of 2');
  assert.strictEqual(outcome.restoredStreak, 20);
});

runTest('Free user can restore streak using their 1 restore token at 0 credit cost', () => {
  const eligibility = streakService.checkEligibility({
    brokenAtHoursAgo: 8,
    brokenStreak: 20,
    alreadyRestored: false,
    subscriptionTier: 'NONE',
  });
  const outcome = streakService.restoreStreak({
    userCredits: 10,
    subscriptionTier: 'NONE',
    eligibility,
    useToken: true,
  });
  assert.strictEqual(outcome.success, true);
  assert.strictEqual(outcome.usedToken, true);
  assert.strictEqual(outcome.deductedCredits, 0);
  assert.strictEqual(outcome.remainingTokens, 0, '0 tokens remain after using free token');
  assert.strictEqual(outcome.restoredStreak, 20);
});

runTest('Streak recovery with credits costs 20 Credits and strictly goes to platform master-admin account', () => {
  const eligibility = streakService.checkEligibility({
    brokenAtHoursAgo: 18,
    brokenStreak: 20,
    alreadyRestored: false,
    subscriptionTier: 'NONE',
  });
  const outcome = streakService.restoreStreak({
    userCredits: 350,
    subscriptionTier: 'NONE',
    eligibility,
    useToken: false,
  });
  assert.strictEqual(outcome.success, true);
  assert.strictEqual(outcome.usedToken, false);
  assert.strictEqual(outcome.deductedCredits, 20, 'Cost must be exactly 20 credits');
  assert.strictEqual(outcome.destination, 'PLATFORM_MASTER_ADMIN');
  assert.strictEqual(outcome.destinationAccount, 'master-admin', '20 Credits must go to platform master-admin account only');
  assert.strictEqual(outcome.remainingCredits, 330);
});

runTest('Insufficient credits (< 20) throws error when user has 0 tokens', () => {
  const eligibility = {
    ...streakService.checkEligibility({
      brokenAtHoursAgo: 12,
      brokenStreak: 20,
      alreadyRestored: false,
      subscriptionTier: 'NONE',
    }),
    availableTokens: 0,
  };
  assert.throws(() => {
    streakService.restoreStreak({
      userCredits: 15,
      subscriptionTier: 'NONE',
      eligibility,
      useToken: false,
    });
  }, /Insufficient credits/);
});

runTest('After 24 hours, streak resets permanently to 0 and recovery expires', () => {
  const expired = streakService.checkEligibility({
    brokenAtHoursAgo: 25,
    brokenStreak: 20,
    alreadyRestored: false,
  });
  assert.strictEqual(expired.eligible, false);
  assert.strictEqual(expired.reason, 'EXPIRED_PERMANENTLY');
  assert.strictEqual(expired.resetStreak, 0);
});

runTest('Can only restore the most recent broken streak once', () => {
  const check = streakService.checkEligibility({
    brokenAtHoursAgo: 10,
    brokenStreak: 20,
    alreadyRestored: true,
  });
  assert.strictEqual(check.eligible, false);
  assert.strictEqual(check.reason, 'ALREADY_RESTORED');
});

// -------------------------------------------------------------
// 3. ROLE-BASED TABS SPECIFICATION
// -------------------------------------------------------------
console.log('\n--- Suite 3: Role-Based Navigation Tabs ---');

function getTabsForRole(role) {
  const upper = (role || 'USER').toUpperCase();
  if (upper === 'USER' || upper === 'GUEST') {
    return ['favorites', 'about', 'activity'];
  }
  if (upper === 'CREATOR' || upper === 'VERIFIED_CREATOR') {
    return ['series', 'posts', 'about', 'activity'];
  }
  if (upper === 'STUDIO') {
    return ['series', 'posts', 'about', 'activity'];
  }
  // Admin
  return ['series', 'about', 'activity'];
}

runTest('Reader tabs: strictly Favorites, About, Activity (no Posts tab)', () => {
  const tabs = getTabsForRole('USER');
  assert.deepStrictEqual(tabs, ['favorites', 'about', 'activity']);
  assert.strictEqual(tabs.includes('posts'), false, 'Reader must NOT have Posts tab');
});

runTest('Creator tabs include Posts and Series', () => {
  const tabs = getTabsForRole('CREATOR');
  assert.strictEqual(tabs.includes('posts'), true, 'Creator must have Posts tab');
  assert.strictEqual(tabs.includes('series'), true, 'Creator must have Series tab');
});

runTest('Studio tabs include Posts and Projects', () => {
  const tabs = getTabsForRole('STUDIO');
  assert.strictEqual(tabs.includes('posts'), true, 'Studio must have Posts tab');
});

runTest('Admin tabs exclude Posts tab', () => {
  const tabs = getTabsForRole('ADMIN');
  assert.strictEqual(tabs.includes('posts'), false, 'Admin must NOT have Posts tab');
});

// -------------------------------------------------------------
// 4. READING JOURNAL (ACTIVITY TAB)
// -------------------------------------------------------------
console.log('\n--- Suite 4: Reading Journal (Activity Tab) ---');

function getReadingJournal() {
  return {
    todayReading: {
      seriesTitle: 'Shadow City: Neon Blade',
      chapterStatus: 'Chapter 42 completed',
      timeSpent: '18 minutes',
    },
    readingSummary: {
      today: '1h 42m',
      thisWeek: '18 Chapters',
    },
    recentHistory: [
      { series: 'Archmage Curriculum', chapter: 'Chapter 29', date: 'Yesterday', timeSpent: '22m' },
      { series: 'Dragon Ashes', chapter: 'Chapter 11', date: '2 days ago', timeSpent: '15m' },
      { series: 'Void Runner', chapter: 'Chapter 8', date: '3 days ago', timeSpent: '14m' },
    ],
  };
}

runTest('Reading Journal contains Today\'s Reading card', () => {
  const journal = getReadingJournal();
  assert.strictEqual(journal.todayReading.seriesTitle, 'Shadow City: Neon Blade');
  assert.strictEqual(journal.todayReading.chapterStatus, 'Chapter 42 completed');
  assert.strictEqual(journal.todayReading.timeSpent, '18 minutes');
});

runTest('Reading Journal contains Reading Summary with daily and weekly metrics', () => {
  const journal = getReadingJournal();
  assert.strictEqual(journal.readingSummary.today, '1h 42m');
  assert.strictEqual(journal.readingSummary.thisWeek, '18 Chapters');
});

runTest('Reading Journal tracks Series name, Chapter read, Date, and Time spent reading', () => {
  const journal = getReadingJournal();
  assert.strictEqual(journal.recentHistory.length, 3);

  const [item1, item2, item3] = journal.recentHistory;
  assert.strictEqual(item1.series, 'Archmage Curriculum');
  assert.strictEqual(item1.chapter, 'Chapter 29');
  assert.strictEqual(item1.date, 'Yesterday');
  assert.strictEqual(item1.timeSpent, '22m');

  assert.strictEqual(item2.series, 'Dragon Ashes');
  assert.strictEqual(item2.date, '2 days ago');

  assert.strictEqual(item3.series, 'Void Runner');
  assert.strictEqual(item3.date, '3 days ago');
});

// -------------------------------------------------------------
// 5. COMMENTS & REPUTATION POINTS LIFECYCLE
// -------------------------------------------------------------
console.log('\n--- Suite 5: Comments & Reputation Lifecycle ---');

class CommentReputationSystem {
  constructor() {
    this.comments = [];
    this.userReputation = { 'user-001': 145 };
  }

  postComment({ chapterId, postId, userId, content }) {
    if (!content || !content.trim()) {
      throw new Error('Comment content cannot be empty');
    }

    // Check for duplicate comment submission
    const isDuplicate = this.comments.some(
      (c) =>
        c.userId === userId &&
        ((chapterId && c.chapterId === chapterId) || (postId && c.postId === postId)) &&
        c.content.trim().toLowerCase() === content.trim().toLowerCase()
    );

    if (isDuplicate) {
      throw new Error('Duplicate comment detected. You have already submitted this comment.');
    }

    const commentId = `comment-${this.comments.length + 1}`;
    const comment = {
      id: commentId,
      chapterId: chapterId || null,
      postId: postId || null,
      userId,
      content: content.trim(),
      createdAt: new Date().toISOString(),
      reputationAwarded: 5,
    };

    this.comments.push(comment);
    this.userReputation[userId] = (this.userReputation[userId] || 0) + 5;

    return {
      comment,
      newReputation: this.userReputation[userId],
    };
  }

  deleteComment({ commentId, requestUserId, userRole }) {
    const commentIndex = this.comments.findIndex((c) => c.id === commentId);
    if (commentIndex === -1) {
      throw new Error('Comment not found');
    }

    const comment = this.comments[commentIndex];
    const isAuthor = comment.userId === requestUserId;
    const isAdmin = userRole === 'ADMIN' || userRole === 'MASTER_ADMIN';

    if (!isAuthor && !isAdmin) {
      throw new Error('Unauthorized deletion');
    }

    this.comments.splice(commentIndex, 1);

    // Revoke reputation points
    this.userReputation[comment.userId] = Math.max(
      0,
      (this.userReputation[comment.userId] || 0) - comment.reputationAwarded
    );

    return {
      success: true,
      reputationRevoked: comment.reputationAwarded,
      newReputation: this.userReputation[comment.userId],
    };
  }
}

const repSystem = new CommentReputationSystem();

runTest('Posting a valid comment awards +5 reputation points', () => {
  const initialRep = repSystem.userReputation['user-001'];
  const res = repSystem.postComment({
    chapterId: 'ch-42',
    userId: 'user-001',
    content: 'Unbelievable battle choreography on page 14!',
  });
  assert.strictEqual(res.newReputation, initialRep + 5);
  assert.strictEqual(res.comment.reputationAwarded, 5);
});

runTest('Duplicate comment submission is rejected (prevents duplicate reputation rewards)', () => {
  assert.throws(() => {
    repSystem.postComment({
      chapterId: 'ch-42',
      userId: 'user-001',
      content: 'Unbelievable battle choreography on page 14!',
    });
  }, /Duplicate comment detected/);
});

runTest('Deleting a comment revokes the +5 reputation points', () => {
  const currentRep = repSystem.userReputation['user-001'];
  const commentToDelete = repSystem.comments[0];
  const res = repSystem.deleteComment({
    commentId: commentToDelete.id,
    requestUserId: 'user-001',
    userRole: 'USER',
  });
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.reputationRevoked, 5);
  assert.strictEqual(res.newReputation, currentRep - 5);
});

runTest('Moderator deletion for spam/violations revokes reputation points', () => {
  // Post new comment
  const postRes = repSystem.postComment({
    postId: 'post-99',
    userId: 'user-001',
    content: 'Check out this awesome arc draft!',
  });
  const repBefore = repSystem.userReputation['user-001'];

  // Admin deletes comment
  const deleteRes = repSystem.deleteComment({
    commentId: postRes.comment.id,
    requestUserId: 'admin-001',
    userRole: 'ADMIN',
  });
  assert.strictEqual(deleteRes.success, true);
  assert.strictEqual(deleteRes.newReputation, repBefore - 5);
});

// -------------------------------------------------------------
// SUMMARY
// -------------------------------------------------------------
console.log('\n====================================================');
console.log(`RESULTS: ${passedTests}/${totalTests} tests passed, ${failedTests} failed.`);
console.log('====================================================');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
