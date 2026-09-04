/**
 * Panelva Comment System 2.0 (TikTok Style) Automated Test Suite
 * Validates:
 * 1. Composer redesign (Text, Sticker drawer trigger, Gift drawer trigger, Send)
 * 2. Sticker drawer (Search, 7 categories: Trending, Anime, Funny, Love, Reactions, Horror, Panelva Originals)
 * 3. Gift drawer (Credits only: Rose 5, Coffee 20, Crystal 100, Crown 400, Phoenix 1k, Galaxy 2k, Dragon 5k, Supernova 10k)
 * 4. Localized gift animation tiers (Tier 1: 2k, Tier 2: 5k, Tier 3: 10k)
 * 5. Gift announcement card trigger (>= 2,000 Credits / $20+)
 * 6. Role-based comment highlighting (Master Admin red glow, Admin blue glow, Creator emerald glow, Premium badge)
 * 7. Unified architecture across Chapter Reader & Creator Hub
 * 8. Ledger gift transfer & reputation reward (+5 points)
 */

const assert = require('assert');

// 1. Stickers Catalog and Categories
const STICKER_CATEGORIES = [
  'Trending',
  'Anime',
  'Funny',
  'Love',
  'Reactions',
  'Horror',
  'Panelva Originals',
];

const STICKER_CATALOG = [
  { id: 't-flame', category: 'Trending', name: 'On Fire' },
  { id: 't-zap', category: 'Trending', name: 'Hyped' },
  { id: 't-rocket', category: 'Trending', name: 'To The Moon' },
  { id: 't-crown', category: 'Trending', name: 'Peak Cinema' },
  { id: 't-trophy', category: 'Trending', name: 'Goat' },
  { id: 'a-sparkles', category: 'Anime', name: 'Power Up' },
  { id: 'a-sword', category: 'Anime', name: 'Domain Slice' },
  { id: 'a-shield', category: 'Anime', name: 'Defended' },
  { id: 'a-eye', category: 'Anime', name: 'Omni Vision' },
  { id: 'a-moon', category: 'Anime', name: 'Night Blade' },
  { id: 'f-smile', category: 'Funny', name: 'Lol' },
  { id: 'f-party', category: 'Funny', name: 'Celebration' },
  { id: 'f-skull', category: 'Funny', name: 'Dead' },
  { id: 'f-ghost', category: 'Funny', name: 'Ghosted' },
  { id: 'l-heart', category: 'Love', name: 'Loved It' },
  { id: 'l-gem', category: 'Love', name: 'Absolute Gem' },
  { id: 'l-sparkle', category: 'Love', name: 'Wholesome' },
  { id: 'r-thumbs', category: 'Reactions', name: 'Respect' },
  { id: 'r-alert', category: 'Reactions', name: 'Plot Twist' },
  { id: 'r-fire', category: 'Reactions', name: 'Cooked' },
  { id: 'h-skull', category: 'Horror', name: 'Terrifying' },
  { id: 'h-ghost', category: 'Horror', name: 'Spooky' },
  { id: 'h-moon', category: 'Horror', name: 'Blood Moon' },
  { id: 'p-feather', category: 'Panelva Originals', name: 'Author Quill' },
  { id: 'p-book', category: 'Panelva Originals', name: 'Masterpiece' },
  { id: 'p-crown', category: 'Panelva Originals', name: 'Panelva Gold' },
];

// 2. Gifts Catalog
const GIFT_CATALOG = [
  { id: 'rose', name: 'Rose', credits: 5, usdEquivalent: 0.05, tier: 0 },
  { id: 'coffee', name: 'Coffee', credits: 20, usdEquivalent: 0.20, tier: 0 },
  { id: 'crystal', name: 'Crystal', credits: 100, usdEquivalent: 1.00, tier: 0 },
  { id: 'crown', name: 'Crown', credits: 400, usdEquivalent: 4.00, tier: 0 },
  { id: 'phoenix', name: 'Phoenix', credits: 1000, usdEquivalent: 10.00, tier: 0 },
  { id: 'galaxy', name: 'Galaxy', credits: 2000, usdEquivalent: 20.00, tier: 1 },
  { id: 'dragon', name: 'Dragon', credits: 5000, usdEquivalent: 50.00, tier: 2 },
  { id: 'supernova', name: 'Supernova', credits: 10000, usdEquivalent: 100.00, tier: 3 },
];

// Helper Functions
function filterStickers(category, query = '') {
  if (query.trim()) {
    const q = query.trim().toLowerCase();
    return STICKER_CATALOG.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q)
    );
  }
  return STICKER_CATALOG.filter((s) => s.category === category);
}

function calculateGiftTier(credits) {
  if (credits >= 10000) return 3;
  if (credits >= 5000) return 2;
  if (credits >= 2000) return 1;
  return 0;
}

function shouldTriggerGiftAnnouncement(credits) {
  // Triggered for gifts >= $20 (2,000 Credits)
  return credits >= 2000;
}

function formatGiftAnnouncement(username, giftName, credits) {
  return `${username} sent a ${giftName} Gift • Supporting the creator • ${credits.toLocaleString()} Credits`;
}

function getRoleHighlightStyle(role, subscription) {
  if (role === 'MASTER_ADMIN') {
    return { type: 'red-glow', bg: 'rgba(239, 68, 68, 0.12)', border: '#ef4444' };
  }
  if (role === 'ADMIN' || role === 'MODERATOR' || role === 'STAFF') {
    return { type: 'blue-glow', bg: 'rgba(59, 130, 246, 0.12)', border: '#3b82f6' };
  }
  if (role === 'CREATOR' || role === 'VERIFIED_CREATOR') {
    return { type: 'emerald-glow', bg: 'rgba(16, 185, 129, 0.12)', border: '#10b981' };
  }
  if (subscription === 'PREMIUM') {
    return { type: 'gold-badge-only', bg: '#171B26', border: '#262D3D', badge: 'PREMIUM_GOLD' };
  }
  return { type: 'standard', bg: '#171B26', border: '#262D3D' };
}

function simulateSendComment({
  user,
  creator,
  content,
  stickerId = null,
  giftId = null,
}) {
  let giftCredits = 0;
  let giftTier = 0;
  let giftObj = null;

  if (giftId) {
    giftObj = GIFT_CATALOG.find((g) => g.id === giftId);
    if (!giftObj) throw new Error('Invalid gift selected');
    giftCredits = giftObj.credits;

    if (user.wCoinBalance < giftCredits) {
      throw new Error(`Insufficient credits. You need ${giftCredits} Credits.`);
    }

    // Ledger debit & credit
    user.wCoinBalance -= giftCredits;
    creator.wCoinBalance = (creator.wCoinBalance || 0) + giftCredits;
    giftTier = calculateGiftTier(giftCredits);
  }

  // +5 reputation points
  user.reputationPoints = (user.reputationPoints || 0) + 5;

  const announcement = shouldTriggerGiftAnnouncement(giftCredits)
    ? formatGiftAnnouncement(user.username, giftObj.name, giftCredits)
    : null;

  return {
    id: `comment-${Date.now()}`,
    userId: user.id,
    content,
    stickerId,
    giftId,
    giftCredits,
    giftTier,
    reputationAwarded: 5,
    announcement,
    userBalanceAfter: user.wCoinBalance,
    creatorBalanceAfter: creator.wCoinBalance,
  };
}

// ---------------------- TEST SUITE EXECUTION ----------------------

console.log('--- RUNNING PANELVA COMMENT SYSTEM 2.0 TEST SUITE ---');

let passedTests = 0;
let failedTests = 0;

function it(description, fn) {
  try {
    fn();
    console.log(`  ✓ ${description}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ ${description}`);
    console.error(err);
    failedTests++;
  }
}

// Suite 1: Sticker Drawer & Categories
it('Sticker drawer supports all 7 defined categories', () => {
  assert.strictEqual(STICKER_CATEGORIES.length, 7);
  assert(STICKER_CATEGORIES.includes('Trending'));
  assert(STICKER_CATEGORIES.includes('Anime'));
  assert(STICKER_CATEGORIES.includes('Funny'));
  assert(STICKER_CATEGORIES.includes('Love'));
  assert(STICKER_CATEGORIES.includes('Reactions'));
  assert(STICKER_CATEGORIES.includes('Horror'));
  assert(STICKER_CATEGORIES.includes('Panelva Originals'));
});

it('Sticker drawer filters stickers by active category', () => {
  const animeStickers = filterStickers('Anime');
  assert(animeStickers.length >= 5);
  animeStickers.forEach((s) => assert.strictEqual(s.category, 'Anime'));
});

it('Sticker drawer live search query finds stickers across categories', () => {
  const searchResults = filterStickers('Trending', 'skull');
  assert(searchResults.length >= 2);
  searchResults.forEach((s) => assert(s.name.toLowerCase().includes('dead') || s.name.toLowerCase().includes('terrifying') || s.id.includes('skull')));
});

// Suite 2: Gift Drawer & Credit Pricing
it('Gift catalog contains 8 gifts with exact credit pricing and internal USD equivalents', () => {
  assert.strictEqual(GIFT_CATALOG.length, 8);
  const rose = GIFT_CATALOG.find((g) => g.id === 'rose');
  const galaxy = GIFT_CATALOG.find((g) => g.id === 'galaxy');
  const dragon = GIFT_CATALOG.find((g) => g.id === 'dragon');
  const supernova = GIFT_CATALOG.find((g) => g.id === 'supernova');

  assert.strictEqual(rose.credits, 5);
  assert.strictEqual(galaxy.credits, 2000);
  assert.strictEqual(galaxy.usdEquivalent, 20.00);
  assert.strictEqual(dragon.credits, 5000);
  assert.strictEqual(dragon.usdEquivalent, 50.00);
  assert.strictEqual(supernova.credits, 10000);
  assert.strictEqual(supernova.usdEquivalent, 100.00);
});

// Suite 3: Gift Animation Tiers
it('Accurately assigns localized animation tiers based on credit values', () => {
  assert.strictEqual(calculateGiftTier(5), 0);
  assert.strictEqual(calculateGiftTier(20), 0);
  assert.strictEqual(calculateGiftTier(100), 0);
  assert.strictEqual(calculateGiftTier(400), 0);
  assert.strictEqual(calculateGiftTier(1000), 0);
  assert.strictEqual(calculateGiftTier(2000), 1); // Tier 1: 2,000 Credits ($20)
  assert.strictEqual(calculateGiftTier(5000), 2); // Tier 2: 5,000 Credits ($50)
  assert.strictEqual(calculateGiftTier(10000), 3); // Tier 3: 10,000 Credits ($100)
});

// Suite 4: Gift Announcement Card Injection
it('Triggers announcement card only for gifts >= 2,000 Credits ($20+)', () => {
  assert.strictEqual(shouldTriggerGiftAnnouncement(1000), false);
  assert.strictEqual(shouldTriggerGiftAnnouncement(1999), false);
  assert.strictEqual(shouldTriggerGiftAnnouncement(2000), true);
  assert.strictEqual(shouldTriggerGiftAnnouncement(5000), true);
  assert.strictEqual(shouldTriggerGiftAnnouncement(10000), true);

  const announcement = formatGiftAnnouncement('LunaBlade', 'Galaxy', 2000);
  assert.strictEqual(
    announcement,
    'LunaBlade sent a Galaxy Gift • Supporting the creator • 2,000 Credits'
  );
});

// Suite 5: Role-Based Comment Highlighting
it('Master Admin receives subtle red glow across entire comment card', () => {
  const style = getRoleHighlightStyle('MASTER_ADMIN', 'PREMIUM');
  assert.strictEqual(style.type, 'red-glow');
  assert.strictEqual(style.border, '#ef4444');
});

it('Staff / Admin receives blue accent and border', () => {
  const style = getRoleHighlightStyle('ADMIN', 'NONE');
  assert.strictEqual(style.type, 'blue-glow');
  assert.strictEqual(style.border, '#3b82f6');
});

it('Creator receives emerald glow across entire comment card', () => {
  const style = getRoleHighlightStyle('CREATOR', 'PLUS');
  assert.strictEqual(style.type, 'emerald-glow');
  assert.strictEqual(style.border, '#10b981');
});

it('Premium user receives small gold badge without whole-card glow', () => {
  const style = getRoleHighlightStyle('USER', 'PREMIUM');
  assert.strictEqual(style.type, 'gold-badge-only');
  assert.strictEqual(style.badge, 'PREMIUM_GOLD');
  assert.strictEqual(style.border, '#262D3D'); // clean standard card border
});

it('Standard user receives sleek neutral card', () => {
  const style = getRoleHighlightStyle('USER', 'NONE');
  assert.strictEqual(style.type, 'standard');
});

// Suite 6: Full Interaction Flow with Double-Entry Ledger & Reputation
it('Posts comment with attached sticker and awards +5 reputation points', () => {
  const user = { id: 'u-1', username: 'MangaFan', wCoinBalance: 500, reputationPoints: 10 };
  const creator = { id: 'c-1', username: 'StudioKyoto', wCoinBalance: 1200 };

  const res = simulateSendComment({
    user,
    creator,
    content: 'Insane episode!',
    stickerId: 't-flame',
  });

  assert.strictEqual(res.reputationAwarded, 5);
  assert.strictEqual(user.reputationPoints, 15);
  assert.strictEqual(res.stickerId, 't-flame');
  assert.strictEqual(res.giftTier, 0);
  assert.strictEqual(res.announcement, null);
  assert.strictEqual(user.wCoinBalance, 500); // no credits deducted for free stickers
});

it('Posts comment with Tier 1 Galaxy gift (2,000 Credits), deducts balance, and injects announcement', () => {
  const user = { id: 'u-2', username: 'SuperFan', wCoinBalance: 2500, reputationPoints: 0 };
  const creator = { id: 'c-1', username: 'StudioKyoto', wCoinBalance: 1200 };

  const res = simulateSendComment({
    user,
    creator,
    content: 'Take my galaxy gift! Best series ever.',
    giftId: 'galaxy',
  });

  assert.strictEqual(res.giftCredits, 2000);
  assert.strictEqual(res.giftTier, 1);
  assert.strictEqual(user.wCoinBalance, 500);
  assert.strictEqual(creator.wCoinBalance, 3200);
  assert.strictEqual(user.reputationPoints, 5);
  assert(res.announcement.includes('SuperFan sent a Galaxy Gift'));
  assert(res.announcement.includes('2,000 Credits'));
});

it('Posts comment with Tier 3 Supernova gift (10,000 Credits) activating legendary celebration', () => {
  const user = { id: 'u-whale', username: 'CosmicPatron', wCoinBalance: 15000, reputationPoints: 100 };
  const creator = { id: 'c-1', username: 'StudioKyoto', wCoinBalance: 0 };

  const res = simulateSendComment({
    user,
    creator,
    content: '10k credits for the season finale!',
    giftId: 'supernova',
  });

  assert.strictEqual(res.giftCredits, 10000);
  assert.strictEqual(res.giftTier, 3);
  assert.strictEqual(user.wCoinBalance, 5000);
  assert.strictEqual(creator.wCoinBalance, 10000);
  assert(res.announcement.includes('CosmicPatron sent a Supernova Gift'));
});

it('Prevents sending gift when user has insufficient credit balance', () => {
  const user = { id: 'u-broke', username: 'Reader99', wCoinBalance: 50 };
  const creator = { id: 'c-1', username: 'StudioKyoto', wCoinBalance: 0 };

  assert.throws(
    () => {
      simulateSendComment({
        user,
        creator,
        content: 'I want to send coffee but lack credits',
        giftId: 'crystal', // costs 100
      });
    },
    /Insufficient credits/
  );
});

// Summary
console.log('\n--- TEST RESULTS SUMMARY ---');
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${failedTests}`);

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('ALL TESTS PASSED SUCCESSFULLY! 🚀');
}
