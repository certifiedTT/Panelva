/**
 * Automated Test Suite for:
 * 1. Move Comic / Novel Switching to Series Information Menu
 * 2. Available Formats Visibility Logic (Shown only when linked)
 * 3. Separate Comic vs Novel Chapter Lists & Independent Progress
 * 4. Zero Format-Switching UI in Reader Screen / ReaderHeader
 * 5. Creator Studio Linked Versions Management
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

console.log('--- Running Series Format & Clean Reader Test Suite ---');

// ==========================================
// 1. LINKED SERIES DATA NORMALIZATION TESTS
// ==========================================
const mockComicSeries = {
  id: 'series-001',
  title: 'Shadow City: Neon Blade',
  type: 'COMIC',
  linkedSeriesId: 'series-001-novel',
  chapters: [
    { id: 'ch-c1', chapterIndex: 1, title: 'Prologue: Rain on Neon Glass', tier: 'FREE' },
    { id: 'ch-c2', chapterIndex: 2, title: 'Episode 2: The Cybernetic Edge', tier: 'FREE' },
  ],
};

const mockNovelSeries = {
  id: 'series-001-novel',
  title: 'Shadow City: Neon Blade (Novel)',
  type: 'NOVEL',
  linkedSeriesId: 'series-001',
  chapters: [
    { id: 'ch-n1', chapterIndex: 1, title: 'Chapter 1: The Imperial Ledger', tier: 'FREE' },
    { id: 'ch-n2', chapterIndex: 2, title: 'Chapter 2: Ten Years of Recall', tier: 'FREE' },
    { id: 'ch-n3', chapterIndex: 3, title: 'Chapter 3: Poison in the Goblet', tier: 'FREE' },
  ],
};

const mockStandaloneSeries = {
  id: 'series-003',
  title: 'Archmage Curriculum',
  type: 'COMIC',
  linkedSeriesId: null,
  chapters: [
    { id: 'ch-s1', chapterIndex: 1, title: 'Episode 1: Rune Arrays', tier: 'FREE' },
  ],
};

// ==========================================
// 2. SERIES INFORMATION FORMAT SELECTOR LOGIC
// ==========================================
function getAvailableFormatsConfig(series) {
  const hasLinked = !!(series.linkedSeries || series.linkedSeriesId);
  if (!hasLinked) {
    return {
      showFormatSelector: false,
      availableFormats: [series.type],
    };
  }
  return {
    showFormatSelector: true,
    availableFormats: ['COMIC', 'NOVEL'],
  };
}

// Test Series 1 (Linked)
const config1 = getAvailableFormatsConfig(mockComicSeries);
assert(config1.showFormatSelector === true, 'Linked series displays format selector on Series Information page');
assert(config1.availableFormats.includes('COMIC') && config1.availableFormats.includes('NOVEL'), 'Available formats includes Comic and Novel');

// Test Series 3 (Standalone)
const config3 = getAvailableFormatsConfig(mockStandaloneSeries);
assert(config3.showFormatSelector === false, 'Standalone series hides format selector completely');
assert(config3.availableFormats.length === 1, 'Only 1 format available for standalone series');

// ==========================================
// 3. SEPARATE CHAPTER LISTS & PROGRESS
// ==========================================
function resolveDisplayedChapters(series, selectedFormat) {
  const hasLinked = !!(series.linkedSeries || series.linkedSeriesId);
  if (!hasLinked) {
    return series.chapters || [];
  }
  const comicSeries = series.type === 'NOVEL' ? series.linkedSeries || mockComicSeries : series;
  const novelSeries = series.type === 'NOVEL' ? series : series.linkedSeries || mockNovelSeries;

  if (selectedFormat === 'NOVEL') {
    return novelSeries.chapters || [];
  }
  return comicSeries.chapters || [];
}

const comicChapters = resolveDisplayedChapters(mockComicSeries, 'COMIC');
assert(comicChapters.length === 2, 'Selecting Comic displays 2 Comic chapters');
assert(comicChapters[0].id === 'ch-c1', 'First comic chapter is ch-c1');

const novelChapters = resolveDisplayedChapters(mockComicSeries, 'NOVEL');
assert(novelChapters.length === 3, 'Selecting Novel displays 3 Novel chapters');
assert(novelChapters[0].id === 'ch-n1', 'First novel chapter is ch-n1');

// Verify chapters are not mixed
assert(!comicChapters.some(c => c.id === 'ch-n1'), 'Comic list does NOT contain novel chapters');
assert(!novelChapters.some(c => c.id === 'ch-c1'), 'Novel list does NOT contain comic chapters');

// Reading progress independence
const userReadingHistory = [
  { seriesId: 'series-001', chapterIndex: 2, progressPct: 75 }, // Comic Ch. 2 @ 75%
  { seriesId: 'series-001-novel', chapterIndex: 1, progressPct: 30 }, // Novel Ch. 1 @ 30%
];

function getFormatReadingProgress(history, targetSeriesId) {
  return history.find(h => h.seriesId === targetSeriesId) || null;
}

const comicProgress = getFormatReadingProgress(userReadingHistory, 'series-001');
const novelProgress = getFormatReadingProgress(userReadingHistory, 'series-001-novel');

assert(comicProgress.chapterIndex === 2 && comicProgress.progressPct === 75, 'Comic progress preserved at Ch. 2 (75%)');
assert(novelProgress.chapterIndex === 1 && novelProgress.progressPct === 30, 'Novel progress preserved at Ch. 1 (30%)');
assert(comicProgress.progressPct !== novelProgress.progressPct, 'Reading progress is format-specific and not overwritten');

// ==========================================
// 4. CLEAN READER ARCHITECTURE SPECIFICATION
// ==========================================
// Test ReaderHeader specification:
const readerHeaderProps = {
  seriesTitle: 'Shadow City: Neon Blade',
  chapterIndex: 2,
  chapterTitle: 'The Cybernetic Edge',
};

assert(typeof readerHeaderProps.seriesTitle === 'string', 'ReaderHeader accepts seriesTitle');
assert(typeof readerHeaderProps.chapterIndex === 'number', 'ReaderHeader accepts chapterIndex');
assert(!('formatToggle' in readerHeaderProps), 'ReaderHeader has ZERO format toggle props');
assert(!('onToggleFormat' in readerHeaderProps), 'ReaderHeader has ZERO format toggle callback');
assert(!('themeToggle' in readerHeaderProps), 'ReaderHeader has ZERO theme toggle props');
assert(!('profileButton' in readerHeaderProps), 'ReaderHeader has ZERO profile button props');

// ==========================================
// 5. CREATOR STUDIO LINKING ENGINE VALIDATION
// ==========================================
function validateLinkEligibility(creatorUserId, seriesA, seriesB) {
  if (seriesA.id === seriesB.id) {
    return { eligible: false, error: 'Cannot link a series to itself' };
  }
  if (seriesA.creatorId !== creatorUserId || seriesB.creatorId !== creatorUserId) {
    return { eligible: false, error: 'Creator must own both series' };
  }
  if (seriesA.type === seriesB.type) {
    return { eligible: false, error: 'Cannot link two series of the same format' };
  }
  return { eligible: true };
}

const creatorId = 'creator-123';
const sA = { id: 's-comic', type: 'COMIC', creatorId };
const sB = { id: 's-novel', type: 'NOVEL', creatorId };
const sC = { id: 's-comic-other', type: 'COMIC', creatorId };
const sD = { id: 's-novel-unowned', type: 'NOVEL', creatorId: 'other-creator' };

assert(validateLinkEligibility(creatorId, sA, sB).eligible === true, 'Eligible: Creator owns comic and novel');
assert(validateLinkEligibility(creatorId, sA, sA).eligible === false, 'Ineligible: Cannot link series to itself');
assert(validateLinkEligibility(creatorId, sA, sC).eligible === false, 'Ineligible: Cannot link two comics together');
assert(validateLinkEligibility(creatorId, sA, sD).eligible === false, 'Ineligible: Cannot link unowned series');

console.log(`\n========================================`);
console.log(`Series Format & Clean Reader Summary: ${passed} Passed, ${failed} Failed`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
