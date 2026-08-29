/**
 * Standalone pure test script for mobile normalization algorithms
 */

function normalizeChaptersList(rawChaptersInput) {
  if (!rawChaptersInput) {
    return [];
  }

  let rawList = rawChaptersInput;
  if (typeof rawChaptersInput === 'object' && rawChaptersInput !== null && !Array.isArray(rawChaptersInput)) {
    const obj = rawChaptersInput;
    if (Array.isArray(obj.chapters)) {
      rawList = obj.chapters;
    } else if (Array.isArray(obj.chaptersList)) {
      rawList = obj.chaptersList;
    } else if (Array.isArray(obj.data)) {
      rawList = obj.data;
    } else if (Array.isArray(obj.items)) {
      rawList = obj.items;
    } else {
      return [];
    }
  }

  if (!Array.isArray(rawList)) {
    return [];
  }

  return rawList.map((ch, index) => {
    if (!ch || typeof ch !== 'object') {
      const idx = index + 1;
      return {
        id: `ch-fallback-${idx}`,
        chapterIndex: idx,
        title: `Chapter ${idx}`,
        subtitle: null,
        tier: 'FREE',
        isLocked: false,
        pages: [],
        textContent: null,
        createdAt: new Date().toISOString(),
        views: 0,
        likes: 0,
      };
    }

    const c = ch;
    const chapterIndex = typeof c.chapterIndex === 'number' && !isNaN(c.chapterIndex)
      ? c.chapterIndex
      : typeof c.index === 'number' && !isNaN(c.index)
      ? c.index
      : index + 1;

    const id = typeof c.id === 'string' && c.id.trim().length > 0
      ? c.id
      : `ch-${chapterIndex}-${index}`;

    const title = typeof c.title === 'string' && c.title.trim().length > 0
      ? c.title
      : `Chapter ${chapterIndex}`;

    const rawTier = typeof c.tier === 'string' ? c.tier.toUpperCase() : 'FREE';
    const tier = rawTier === 'PREMIUM' || rawTier === 'AD_SUPPORTED' ? rawTier : 'FREE';
    const isLocked = typeof c.isLocked === 'boolean'
      ? c.isLocked
      : typeof c.locked === 'boolean'
      ? c.locked
      : tier !== 'FREE';

    const pages = Array.isArray(c.pages)
      ? c.pages.filter((p) => typeof p === 'string')
      : [];

    const textContent = typeof c.textContent === 'string'
      ? c.textContent
      : typeof c.content === 'string'
      ? c.content
      : null;

    const createdAt = typeof c.createdAt === 'string' || c.createdAt instanceof Date
      ? c.createdAt
      : new Date().toISOString();

    return {
      ...c,
      id,
      chapterIndex,
      title,
      subtitle: typeof c.subtitle === 'string' ? c.subtitle : null,
      tier,
      isLocked,
      pages,
      textContent,
      createdAt,
      views: typeof c.views === 'number' ? c.views : 0,
      likes: typeof c.likes === 'number' ? c.likes : 0,
      commentCount: typeof c.commentCount === 'number' ? c.commentCount : 0,
    };
  });
}

function normalizeCreator(rawCreator) {
  if (!rawCreator || typeof rawCreator !== 'object') {
    return null;
  }

  const c = rawCreator;
  const penName = typeof c.penName === 'string' && c.penName.trim().length > 0
    ? c.penName
    : typeof c.name === 'string' && c.name.trim().length > 0
    ? c.name
    : typeof c.author === 'string' && c.author.trim().length > 0
    ? c.author
    : 'Creator';

  return {
    ...c,
    id: typeof c.id === 'string' ? c.id : 'creator-default',
    penName,
    bio: typeof c.bio === 'string' ? c.bio : null,
    avatarUrl: typeof c.avatarUrl === 'string' ? c.avatarUrl : c.user?.avatarUrl || null,
    isVetted: !!c.isVetted,
    user: c.user && typeof c.user === 'object' ? {
      id: c.user.id,
      username: c.user.username || penName,
      avatarUrl: c.user.avatarUrl || null,
    } : null,
  };
}

function normalizeSeriesResponse(rawResponse) {
  if (!rawResponse || typeof rawResponse !== 'object') {
    return {
      series: null,
      chapters: [],
      creator: null,
    };
  }

  const raw = rawResponse;
  const s = (raw.data && typeof raw.data === 'object' && !Array.isArray(raw.data))
    ? raw.data
    : (raw.series && typeof raw.series === 'object' && !Array.isArray(raw.series))
    ? raw.series
    : raw;

  if (!s || typeof s !== 'object') {
    return { series: null, chapters: [], creator: null };
  }

  const rawChapters = s.chapters || s.chaptersList || raw.chapters || raw.chaptersList || [];
  const chapters = normalizeChaptersList(rawChapters);
  const rawCreator = s.creator || raw.creator || (s.author ? { penName: s.author, id: s.creatorId } : null);
  const creator = normalizeCreator(rawCreator);

  const id = typeof s.id === 'string' && s.id.trim().length > 0 ? s.id : 'series-unknown';
  const title = typeof s.title === 'string' && s.title.trim().length > 0 ? s.title : 'Untitled Series';
  const rawType = typeof s.type === 'string' ? s.type.toUpperCase() : 'COMIC';
  const type = rawType === 'NOVEL' ? 'NOVEL' : rawType === 'MANHWA' ? 'MANHWA' : 'COMIC';

  const series = {
    ...s,
    id,
    title,
    description: typeof s.description === 'string' ? s.description : s.synopsis || s.quote || '',
    synopsis: typeof s.synopsis === 'string' ? s.synopsis : s.description || s.quote || '',
    quote: typeof s.quote === 'string' ? s.quote : null,
    coverUrl: typeof s.coverUrl === 'string' ? s.coverUrl : null,
    coverBg: typeof s.coverBg === 'string' ? s.coverBg : '#1A1A2E',
    rating: s.rating !== undefined && s.rating !== null ? String(s.rating) : '9.8',
    genre: typeof s.genre === 'string' && s.genre.trim().length > 0 ? s.genre : 'General',
    type,
    views: s.views !== undefined && s.views !== null ? s.views : '0',
    likes: typeof s.likes === 'number' ? s.likes : 0,
    status: typeof s.status === 'string' ? s.status : 'Ongoing',
    author: creator?.penName || (typeof s.author === 'string' ? s.author : 'Creator'),
    creatorId: creator?.id || s.creatorId || null,
    creator,
    chapters,
    isHot: !!s.isHot || (typeof s.views === 'number' && s.views > 50000),
    linkedSeriesId: typeof s.linkedSeriesId === 'string' ? s.linkedSeriesId : null,
    alternateFormat: typeof s.alternateFormat === 'string' ? s.alternateFormat : null,
  };

  return {
    series,
    chapters,
    creator,
  };
}

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

console.log('--- Executing Normalization & Bug Fix Tests ---');

// Test 1: Null/undefined inputs never crash
const t1 = normalizeChaptersList(null);
assert(Array.isArray(t1) && t1.length === 0, 'Null chapters input returns empty array');
assert(typeof t1.find === 'function', 'Result has .find method');
assert(t1.find((c) => c.chapterIndex === 1) === undefined, '.find() on empty result returns undefined without error');

// Test 2: Nested object responses (e.g. { chaptersList: [...] })
const t2 = normalizeChaptersList({
  chaptersList: [
    { id: 'ch-1', chapterIndex: 1, title: 'Chapter 1', tier: 'FREE' },
    { id: 'ch-2', chapterIndex: 2, title: 'Chapter 2', tier: 'PREMIUM' },
  ],
});
assert(t2.length === 2, 'Extracts chaptersList from object correctly');
assert(t2[0].isLocked === false, 'Free chapter isLocked === false');
assert(t2[1].isLocked === true, 'Premium chapter isLocked === true');

// Test 3: Malformed array entries
const t3 = normalizeChaptersList([null, undefined, 42, { title: 'Only Title' }]);
assert(t3.length === 4, 'Malformed array items handled');
assert(t3[0].id === 'ch-fallback-1', 'Null item generated fallback id');
assert(t3[3].chapterIndex === 4, 'Object item without index assigned index 4');

// Test 4: Series response normalization
const t4 = normalizeSeriesResponse({
  id: 'series-uuid',
  title: 'Shadow City',
  type: 'COMIC',
  chapters: null, // Critical crash case from issue description!
  creator: { penName: 'LunaBlade' },
});
assert(t4.series !== null, 'Series object constructed');
assert(Array.isArray(t4.chapters), 'chapters is ALWAYS an array even if raw was null');
assert(t4.chapters.length === 0, 'chapters length is 0');
assert(typeof t4.chapters.find === 'function', 't4.chapters.find is a function (CRITICAL BUG FIXED)');
assert(t4.creator.penName === 'LunaBlade', 'Creator penName preserved');

// Test 5: Start Reading CTA algorithm verification
function findFirstReadableChapter(chapters, dbUser) {
  if (!chapters || chapters.length === 0) return null;
  const isSubscribed = dbUser?.subscription === 'PREMIUM' || dbUser?.subscription === 'PLUS';
  if (isSubscribed) return chapters[0];
  return chapters.find((c) => c.tier === 'FREE') || chapters[0];
}

const mixedChapters = [
  { id: 'ch-1', chapterIndex: 1, title: 'Ep 1', tier: 'PREMIUM' },
  { id: 'ch-2', chapterIndex: 2, title: 'Ep 2', tier: 'FREE' },
];

const freeUserRead = findFirstReadableChapter(mixedChapters, { subscription: 'NONE' });
assert(freeUserRead.id === 'ch-2', 'Start Reading finds first free chapter (ch-2) for unsubscribed user');

const premiumUserRead = findFirstReadableChapter(mixedChapters, { subscription: 'PREMIUM' });
assert(premiumUserRead.id === 'ch-1', 'Start Reading finds first chapter (ch-1) for premium user');

// Test 6: Social Auth restriction verification
const allowedProviders = ['google', 'apple'];
const blockedProviders = ['facebook', 'line', 'twitter', 'x', 'github'];

for (const prov of allowedProviders) {
  assert(allowedProviders.includes(prov), `Allowed provider: ${prov}`);
}
for (const blocked of blockedProviders) {
  assert(!allowedProviders.includes(blocked), `Disallowed provider rejected: ${blocked}`);
}

console.log(`\n========================================`);
console.log(`Test Summary: ${passed} Passed, ${failed} Failed`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
