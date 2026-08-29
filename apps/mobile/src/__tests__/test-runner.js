/**
 * Direct Node test runner for mobile normalization and safety checks
 */
const {
  normalizeChaptersList,
  normalizeCreator,
  normalizeSeriesResponse,
} = require('../../dist-test/hooks/useSeriesDetail.js');

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

console.log('--- Testing Data Normalization Layer ---');

// 1. Chapters normalization tests
const nullChapters = normalizeChaptersList(null);
assert(Array.isArray(nullChapters), 'normalizeChaptersList(null) is array');
assert(nullChapters.length === 0, 'normalizeChaptersList(null) length is 0');
assert(typeof nullChapters.find === 'function', 'nullChapters has .find function');
assert(nullChapters.find(() => true) === undefined, '.find on nullChapters does not throw');

const undefinedChapters = normalizeChaptersList(undefined);
assert(Array.isArray(undefinedChapters), 'normalizeChaptersList(undefined) is array');
assert(typeof undefinedChapters.map === 'function', 'undefinedChapters has .map function');

const stringInput = normalizeChaptersList('malformed string');
assert(Array.isArray(stringInput) && stringInput.length === 0, 'string input safely resolves to []');

const nestedObj = normalizeChaptersList({ chapters: [{ id: 'ch-1', title: 'Chapter 1' }] });
assert(nestedObj.length === 1, 'nested { chapters: [...] } extracts 1 chapter');
assert(nestedObj[0].id === 'ch-1', 'chapter has id');
assert(nestedObj[0].chapterIndex === 1, 'chapterIndex defaults to 1');
assert(nestedObj[0].tier === 'FREE', 'tier defaults to FREE');

const malformedItems = normalizeChaptersList([null, { chapterIndex: 2 }]);
assert(malformedItems.length === 2, 'malformed array elements resolved');
assert(malformedItems[0].title === 'Chapter 1', 'null element generates fallback title');
assert(malformedItems[1].chapterIndex === 2, 'valid element preserves index');

// 2. Creator normalization tests
const nullCreator = normalizeCreator(null);
assert(nullCreator === null, 'null creator resolves to null');

const partialCreator = normalizeCreator({ name: 'StudioSpectre' });
assert(partialCreator.penName === 'StudioSpectre', 'creator penName extracted from name');
assert(partialCreator.id === 'creator-default', 'creator default id assigned');

// 3. Full series response normalization tests
const malformedSeries = normalizeSeriesResponse({
  id: 's-100',
  title: 'Test Series',
  chapters: null,
  creator: null,
});
assert(malformedSeries.series !== null, 'series extracted');
assert(Array.isArray(malformedSeries.chapters), 'chapters is array even if null in response');
assert(malformedSeries.chapters.length === 0, 'chapters length is 0');
assert(typeof malformedSeries.chapters.find === 'function', 'chapters.find is function');

const wrappedSeries = normalizeSeriesResponse({
  data: {
    id: 's-200',
    title: 'Wrapped Series',
    type: 'NOVEL',
    chaptersList: [{ id: 'c-1', title: 'Novel Ch 1', tier: 'PREMIUM' }],
  },
});
assert(wrappedSeries.series.title === 'Wrapped Series', 'wrapped series title resolved');
assert(wrappedSeries.series.type === 'NOVEL', 'wrapped series type resolved');
assert(wrappedSeries.chapters.length === 1, 'wrapped chaptersList resolved');
assert(wrappedSeries.chapters[0].tier === 'PREMIUM', 'chapter tier resolved');
assert(wrappedSeries.chapters[0].isLocked === true, 'chapter isLocked resolved');

console.log(`\nResults: ${passed} passed, ${failed} failed.`);
if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
