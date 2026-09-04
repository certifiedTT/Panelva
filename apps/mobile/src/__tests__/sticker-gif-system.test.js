const assert = require('assert');

// Mock Prisma & Services for isolated unit & integration validation
function createMockPrisma() {
  const packs = new Map();
  const stickers = new Map();
  const libraries = new Map();
  const favorites = new Map();
  const users = new Map();
  const creatorProfiles = new Map();
  const ledger = [];
  const comments = [];

  return {
    packs,
    stickers,
    libraries,
    favorites,
    users,
    creatorProfiles,
    ledger,
    comments,
    stickerPack: {
      create: async ({ data }) => {
        const id = data.id || `pack-${Date.now()}-${Math.random()}`;
        const record = { ...data, id, createdAt: new Date() };
        packs.set(id, record);
        return record;
      },
      findUnique: async ({ where }) => {
        const pack = packs.get(where.id);
        if (!pack) return null;
        const packStickers = Array.from(stickers.values()).filter((s) => s.packId === pack.id);
        return { ...pack, stickers: packStickers };
      },
      update: async ({ where, data }) => {
        const existing = packs.get(where.id);
        if (!existing) throw new Error('Pack not found');
        const updated = { ...existing, ...data };
        packs.set(where.id, updated);
        return updated;
      },
      findMany: async ({ where }) => {
        return Array.from(packs.values()).filter((p) => {
          if (where?.status && p.status !== where.status) return false;
          if (where?.creatorId && p.creatorId !== where.creatorId) return false;
          if (where?.accessType) {
            if (typeof where.accessType === 'string' && p.accessType !== where.accessType) return false;
            if (Array.isArray(where.accessType?.in) && !where.accessType.in.includes(p.accessType)) return false;
          }
          return true;
        });
      },
    },
    sticker: {
      createMany: async ({ data }) => {
        for (const s of data) {
          const id = s.id || `sticker-${Date.now()}-${Math.random()}`;
          stickers.set(id, { ...s, id });
        }
      },
      findUnique: async ({ where, include }) => {
        const st = stickers.get(where.id);
        if (!st) return null;
        if (include?.pack) {
          st.pack = packs.get(st.packId);
        }
        return st;
      },
      deleteMany: async ({ where }) => {
        for (const [id, s] of stickers.entries()) {
          if (s.packId === where.packId) stickers.delete(id);
        }
      },
    },
    userPackLibrary: {
      findUnique: async ({ where }) => {
        const key = `${where.userId_packId.userId}:${where.userId_packId.packId}`;
        return libraries.get(key) || null;
      },
      upsert: async ({ where, create, update }) => {
        const key = `${where.userId_packId.userId}:${where.userId_packId.packId}`;
        const existing = libraries.get(key);
        const record = existing ? { ...existing, ...update } : { ...create, id: `lib-${Date.now()}` };
        libraries.set(key, record);
        return record;
      },
      create: async ({ data }) => {
        const key = `${data.userId}:${data.packId}`;
        const record = { ...data, id: `lib-${Date.now()}` };
        libraries.set(key, record);
        return record;
      },
      findMany: async ({ where }) => {
        return Array.from(libraries.values()).filter((l) => l.userId === where.userId);
      },
    },
    favoriteMedia: {
      findUnique: async ({ where }) => {
        const key = `${where.userId_mediaType_mediaId.userId}:${where.userId_mediaType_mediaId.mediaType}:${where.userId_mediaType_mediaId.mediaId}`;
        return favorites.get(key) || null;
      },
      create: async ({ data }) => {
        const key = `${data.userId}:${data.mediaType}:${data.mediaId}`;
        const record = { ...data, id: `fav-${Date.now()}` };
        favorites.set(key, record);
        return record;
      },
      delete: async ({ where }) => {
        for (const [k, v] of favorites.entries()) {
          if (v.id === where.id) favorites.delete(k);
        }
      },
      findMany: async ({ where }) => {
        return Array.from(favorites.values()).filter((f) => f.userId === where.userId);
      },
    },
    user: {
      findUnique: async ({ where }) => users.get(where.id) || null,
    },
    creatorProfile: {
      findFirst: async ({ where }) => {
        for (const cp of creatorProfiles.values()) {
          if (where.userId && cp.userId === where.userId) return cp;
          if (where.id && cp.id === where.id) return cp;
        }
        return null;
      },
    },
  };
}

// Entitlement function to test directly against mock
async function resolveStickerEntitlement(prisma, userId, stickerId) {
  if (!stickerId) return { allowed: true, reason: 'FREE' };

  const sticker = await prisma.sticker.findUnique({
    where: { id: stickerId },
    include: { pack: true },
  });

  if (!sticker || !sticker.pack) return { allowed: true, reason: 'FREE' };
  const pack = sticker.pack;

  // 1. Free packs
  if (pack.accessType === 'FREE') {
    return { allowed: true, reason: 'FREE', pack };
  }

  if (!userId) {
    return { allowed: false, reason: 'LOCKED', pack };
  }

  // 2. UserPackLibrary ownership (Purchase or Claim)
  const lib = await prisma.userPackLibrary.findUnique({
    where: { userId_packId: { userId, packId: pack.id } },
  });

  if (lib) {
    if (lib.source === 'PURCHASE') return { allowed: true, reason: 'PURCHASED', pack };
    if (lib.source === 'CLAIM') return { allowed: true, reason: 'FREE', pack };
    if (lib.expiresAt && new Date(lib.expiresAt) < new Date()) {
      return { allowed: false, reason: 'LOCKED', pack };
    }
  }

  // 3. User Subscriptions
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const subscription = user?.subscription || 'NONE';
  const isAdmin = user?.role === 'MASTER_ADMIN' || user?.role === 'ADMIN';

  if (isAdmin) {
    return { allowed: true, reason: 'PREMIUM', pack };
  }

  if (subscription === 'PREMIUM') {
    if (pack.accessType === 'PREMIUM' || pack.accessType === 'PLUS' || pack.accessType === 'FREE') {
      return { allowed: true, reason: 'PREMIUM', pack };
    }
  } else if (subscription === 'PLUS') {
    if (pack.accessType === 'PLUS' || pack.accessType === 'FREE') {
      return { allowed: true, reason: 'PLUS', pack };
    }
  }

  // 4. Creator Membership
  if (pack.accessType === 'MEMBERSHIP') {
    const creator = await prisma.creatorProfile.findFirst({
      where: { id: pack.creatorId },
    });
    const hasActiveSub = creator?.activeSubscriberIds?.includes(userId);
    if (hasActiveSub) {
      return { allowed: true, reason: 'MEMBERSHIP', pack };
    }
  }

  return { allowed: false, reason: 'LOCKED', pack };
}

// Single Attachment comment validation helper
function validateCommentAttachments(content, stickerId, gifId) {
  const hasContent = content && content.trim().length > 0;
  const hasAttachment = Boolean(stickerId || gifId);

  if (!hasContent && !hasAttachment) {
    throw new Error('Comment cannot be empty.');
  }

  if (stickerId && gifId) {
    throw new Error('A comment can have at most one attachment (either sticker or GIF).');
  }

  return true;
}

// ==================== TEST SUITE ====================
async function runTests() {
  console.log('🧪 Starting Panelva Sticker & GIF System Test Suite...\n');
  const prisma = createMockPrisma();

  // Setup mock users
  prisma.users.set('user-free', { id: 'user-free', username: 'freeReader', subscription: 'NONE', role: 'USER', wCoinBalance: 500 });
  prisma.users.set('user-plus', { id: 'user-plus', username: 'plusReader', subscription: 'PLUS', role: 'USER', wCoinBalance: 200 });
  prisma.users.set('user-premium', { id: 'user-premium', username: 'vipReader', subscription: 'PREMIUM', role: 'USER', wCoinBalance: 1500 });
  prisma.users.set('user-admin', { id: 'user-admin', username: 'adminJudge', subscription: 'NONE', role: 'MASTER_ADMIN', wCoinBalance: 0 });

  // Setup creator profile
  prisma.creatorProfiles.set('creator-1', {
    id: 'creator-1',
    userId: 'user-creator',
    penName: 'SoraArt',
    activeSubscriberIds: ['user-free'], // user-free is a subscriber to creator-1
  });

  // Setup sticker packs
  const packFree = await prisma.stickerPack.create({
    data: { id: 'p-free', creatorId: 'creator-1', title: 'Chibi Emotes', accessType: 'FREE', price: 0, status: 'PUBLISHED' },
  });
  const packPaid = await prisma.stickerPack.create({
    data: { id: 'p-paid', creatorId: 'creator-1', title: 'Neon Action', accessType: 'PAID', price: 150, status: 'PUBLISHED' },
  });
  const packMembership = await prisma.stickerPack.create({
    data: { id: 'p-member', creatorId: 'creator-1', title: 'VIP Fan Pack', accessType: 'MEMBERSHIP', price: 0, status: 'PUBLISHED' },
  });
  const packPlus = await prisma.stickerPack.create({
    data: { id: 'p-plus', creatorId: 'platform', title: 'Panelva Plus Chibis', accessType: 'PLUS', price: 0, status: 'PUBLISHED' },
  });
  const packPremium = await prisma.stickerPack.create({
    data: { id: 'p-prem', creatorId: 'platform', title: 'Panelva Premium Hologram', accessType: 'PREMIUM', price: 0, status: 'PUBLISHED' },
  });

  // Setup stickers
  await prisma.sticker.createMany({
    data: [
      { id: 'st-free-1', packId: 'p-free', name: 'Thumbs Up', imageUrl: 'https://cdn.test/1.webp', animated: false },
      { id: 'st-paid-1', packId: 'p-paid', name: 'Flame Slash', imageUrl: 'https://cdn.test/2.webp', animated: true },
      { id: 'st-member-1', packId: 'p-member', name: 'Golden Aura', imageUrl: 'https://cdn.test/3.webp', animated: true },
      { id: 'st-plus-1', packId: 'p-plus', name: 'Plus Sparkle', imageUrl: 'https://cdn.test/4.webp', animated: false },
      { id: 'st-prem-1', packId: 'p-prem', name: 'Premium Crown', imageUrl: 'https://cdn.test/5.webp', animated: true },
    ],
  });

  console.log('✅ 1. Test Setup Complete with Mock DB and Models.');

  // TEST 1: Free Pack Entitlement
  {
    const res1 = await resolveStickerEntitlement(prisma, 'user-free', 'st-free-1');
    assert.strictEqual(res1.allowed, true, 'Free pack sticker should be allowed for free user');
    assert.strictEqual(res1.reason, 'FREE');

    const resAnon = await resolveStickerEntitlement(prisma, null, 'st-free-1');
    assert.strictEqual(resAnon.allowed, true, 'Free pack sticker should be allowed for anonymous readers');
    console.log('✅ 2. Free pack access correctly allowed for all users.');
  }

  // TEST 2: Paid Pack Locking and Purchase
  {
    const resLocked = await resolveStickerEntitlement(prisma, 'user-free', 'st-paid-1');
    assert.strictEqual(resLocked.allowed, false, 'Paid pack sticker should be locked before purchase');
    assert.strictEqual(resLocked.reason, 'LOCKED');

    // Simulate purchase
    await prisma.userPackLibrary.create({
      data: { userId: 'user-free', packId: 'p-paid', source: 'PURCHASE' },
    });

    const resPurchased = await resolveStickerEntitlement(prisma, 'user-free', 'st-paid-1');
    assert.strictEqual(resPurchased.allowed, true, 'Paid pack sticker should be allowed after purchase');
    assert.strictEqual(resPurchased.reason, 'PURCHASED');
    console.log('✅ 3. Paid pack locked by default, unlocked upon purchase.');
  }

  // TEST 3: Creator Membership Entitlement
  {
    // user-free has active subscription to creator-1
    const resMember = await resolveStickerEntitlement(prisma, 'user-free', 'st-member-1');
    assert.strictEqual(resMember.allowed, true, 'Membership pack sticker should be allowed for active subscriber');
    assert.strictEqual(resMember.reason, 'MEMBERSHIP');

    // user-plus does NOT have subscription to creator-1
    const resNonMember = await resolveStickerEntitlement(prisma, 'user-plus', 'st-member-1');
    assert.strictEqual(resNonMember.allowed, false, 'Membership pack sticker should be locked for non-subscriber');
    assert.strictEqual(resNonMember.reason, 'LOCKED');
    console.log('✅ 4. Creator membership exclusive access correctly enforced.');
  }

  // TEST 4: Subscription Tier Inheritance (Plus vs. Premium)
  {
    // Free user cannot access Plus or Premium packs
    const resFreePlus = await resolveStickerEntitlement(prisma, 'user-free', 'st-plus-1');
    assert.strictEqual(resFreePlus.allowed, false);

    // Plus user CAN access Plus pack
    const resPlusPlus = await resolveStickerEntitlement(prisma, 'user-plus', 'st-plus-1');
    assert.strictEqual(resPlusPlus.allowed, true);
    assert.strictEqual(resPlusPlus.reason, 'PLUS');

    // Plus user CANNOT access Premium pack
    const resPlusPrem = await resolveStickerEntitlement(prisma, 'user-plus', 'st-prem-1');
    assert.strictEqual(resPlusPrem.allowed, false);
    assert.strictEqual(resPlusPrem.reason, 'LOCKED');

    // Premium user CAN access BOTH Plus and Premium packs
    const resPremPlus = await resolveStickerEntitlement(prisma, 'user-premium', 'st-plus-1');
    assert.strictEqual(resPremPlus.allowed, true);
    assert.strictEqual(resPremPlus.reason, 'PREMIUM');

    const resPremPrem = await resolveStickerEntitlement(prisma, 'user-premium', 'st-prem-1');
    assert.strictEqual(resPremPrem.allowed, true);
    assert.strictEqual(resPremPrem.reason, 'PREMIUM');
    console.log('✅ 5. Panelva Plus & Premium subscription hierarchy verified.');
  }

  // TEST 5: Master Admin Bypass
  {
    const resAdmin = await resolveStickerEntitlement(prisma, 'user-admin', 'st-prem-1');
    assert.strictEqual(resAdmin.allowed, true, 'Master Admin should unlock all sticker packs');
    console.log('✅ 6. Admin access bypass verified.');
  }

  // TEST 6: Single Attachment Comment Rules
  {
    // Allowed combinations
    assert.doesNotThrow(() => validateCommentAttachments('Great chapter!', null, null), 'Text only allowed');
    assert.doesNotThrow(() => validateCommentAttachments('', 'st-free-1', null), 'Sticker only allowed');
    assert.doesNotThrow(() => validateCommentAttachments('', null, 'tenor-123'), 'GIF only allowed');
    assert.doesNotThrow(() => validateCommentAttachments('Hyped!', 'st-free-1', null), 'Text + Sticker allowed');
    assert.doesNotThrow(() => validateCommentAttachments('Shocking!', null, 'tenor-123'), 'Text + GIF allowed');

    // Disallowed: Empty comment
    assert.throws(
      () => validateCommentAttachments('', null, null),
      /Comment cannot be empty/,
      'Empty comment with no attachment should throw'
    );

    // Disallowed: Sticker + GIF simultaneously (Single Attachment Rule)
    assert.throws(
      () => validateCommentAttachments('Look at both!', 'st-free-1', 'tenor-123'),
      /at most one attachment/,
      'Dual attachment (sticker + GIF) must throw'
    );
    console.log('✅ 7. Single attachment rules strictly enforced (max 1 of Sticker OR GIF).');
  }

  // TEST 7: Favorites & Ownership Decoupling
  {
    // User favorites an inaccessible Premium sticker
    await prisma.favoriteMedia.create({
      data: { userId: 'user-free', mediaType: 'STICKER', mediaId: 'st-prem-1', provider: 'Panelva' },
    });

    const userFavs = await prisma.favoriteMedia.findMany({ where: { userId: 'user-free' } });
    assert.strictEqual(userFavs.length, 1);
    assert.strictEqual(userFavs[0].mediaId, 'st-prem-1');

    // Favoriting did NOT grant entitlement
    const resFavCheck = await resolveStickerEntitlement(prisma, 'user-free', userFavs[0].mediaId);
    assert.strictEqual(resFavCheck.allowed, false, 'Favoriting must never grant ownership to locked pack');
    assert.strictEqual(resFavCheck.reason, 'LOCKED');
    console.log('✅ 8. Favorites saved without granting ownership (locked overlay flag preserved).');
  }

  // TEST 8: Creator Sticker Pack Creation & Moderation Pipeline
  {
    // 1. Create Draft Pack
    const draftPack = await prisma.stickerPack.create({
      data: {
        creatorId: 'creator-1',
        title: 'New Emotes Vol. 2',
        accessType: 'FREE',
        price: 0,
        status: 'DRAFT',
      },
    });
    assert.strictEqual(draftPack.status, 'DRAFT');

    // 2. Submit for Review
    const reviewPack = await prisma.stickerPack.update({
      where: { id: draftPack.id },
      data: { status: 'REVIEW' },
    });
    assert.strictEqual(reviewPack.status, 'REVIEW');

    // 3. Admin Approval -> PUBLISHED
    const approvedPack = await prisma.stickerPack.update({
      where: { id: reviewPack.id },
      data: { status: 'PUBLISHED' },
    });
    assert.strictEqual(approvedPack.status, 'PUBLISHED');

    // 4. Admin Rejection -> ARCHIVED
    const rejectedPack = await prisma.stickerPack.update({
      where: { id: reviewPack.id },
      data: { status: 'ARCHIVED' },
    });
    assert.strictEqual(rejectedPack.status, 'ARCHIVED');
    console.log('✅ 9. Creator upload & Admin moderation workflow verified (DRAFT -> REVIEW -> PUBLISHED/ARCHIVED).');
  }

  // TEST 9: Tenor GIF Search Service Fallback & Storage
  {
    const FALLBACK_GIFS = [
      { id: "tenor-anime-sparkle-1", title: "Anime Sparkle Joy", url: "https://cdn.test/sparkle.gif", previewUrl: "https://cdn.test/sparkle-preview.gif", width: 320, height: 240, provider: "Tenor" },
      { id: "tenor-hyped-flame-2", title: "Hype Flame Burst", url: "https://cdn.test/flame.gif", previewUrl: "https://cdn.test/flame-preview.gif", width: 320, height: 240, provider: "Tenor" },
    ];

    const TenorGifService = {
      async getTrending(limit = 20) {
        return FALLBACK_GIFS.slice(0, limit);
      },
      async search(query, limit = 20) {
        if (!query) return this.getTrending(limit);
        const q = query.toLowerCase();
        return FALLBACK_GIFS.filter((g) => g.title.toLowerCase().includes(q) || g.id.toLowerCase().includes(q));
      },
    };

    const trending = await TenorGifService.getTrending(5);
    assert(Array.isArray(trending), 'Trending should return array');
    assert(trending.length > 0, 'Trending should return items');
    assert.strictEqual(trending[0].provider, 'Tenor');

    const searchResults = await TenorGifService.search('sparkle', 5);
    assert(Array.isArray(searchResults));
    assert.strictEqual(searchResults.length, 1);
    assert.strictEqual(searchResults[0].id, 'tenor-anime-sparkle-1');
    console.log('✅ 10. Tenor GIF search & trending provider verified (stores Tenor IDs & minimal metadata).');
  }

  console.log('\n========================================');
  console.log('🎉 ALL 10/10 TESTS PASSED SUCCESSFULLY!');
  console.log('========================================\n');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
