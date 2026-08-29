const {
  getEarlyAccessSchedule,
  checkEarlyAccessPermission,
  formatEarlyAccessDuration,
} = require('./earlyAccess.js');

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

console.log('--- Testing Early Access System ---');

const pubTime = new Date('2026-08-20T12:00:00Z');
const t0 = new Date('2026-08-20T12:00:00Z');
const t1 = new Date('2026-08-20T13:00:00Z');
const t2 = new Date('2026-08-20T14:30:00Z');
const t4 = new Date('2026-08-20T16:30:00Z');

// Schedule tests
const sched = getEarlyAccessSchedule(pubTime, t0);
assert(sched.isEarlyAccessActive === true, 'Early access is active at T0');
assert(sched.plusWaitFormatted === '2h', 'Plus wait is 2h at T0');
assert(sched.freeWaitFormatted === '4h', 'Free wait is 4h at T0');

// Premium tests
assert(checkEarlyAccessPermission(pubTime, 'PREMIUM', 'USER', false, t0).hasAccess === true, 'Premium has immediate access at T0');
assert(checkEarlyAccessPermission(pubTime, 'PREMIUM', 'USER', false, t1).hasAccess === true, 'Premium has access at T1');

// Plus tests
const plusT1 = checkEarlyAccessPermission(pubTime, 'PLUS', 'USER', false, t1);
assert(plusT1.hasAccess === false && plusT1.requiredTier === 'PREMIUM', 'Plus blocked at T1 (+1h)');
const plusT2 = checkEarlyAccessPermission(pubTime, 'PLUS', 'USER', false, t2);
assert(plusT2.hasAccess === true, 'Plus allowed at T2 (+2.5h)');

// Free tests
const freeT1 = checkEarlyAccessPermission(pubTime, 'NONE', 'USER', false, t1);
assert(freeT1.hasAccess === false && freeT1.requiredTier === 'PREMIUM', 'Free blocked at T1');
const freeT2 = checkEarlyAccessPermission(pubTime, 'NONE', 'USER', false, t2);
assert(freeT2.hasAccess === false && freeT2.requiredTier === 'PLUS', 'Free blocked at T2, upgrade to Plus');
const freeT4 = checkEarlyAccessPermission(pubTime, 'NONE', 'USER', false, t4);
assert(freeT4.hasAccess === true && freeT4.isEarlyAccessActive === false, 'Free allowed at T4 (+4.5h)');

// Admin/Creator bypass
assert(checkEarlyAccessPermission(pubTime, 'NONE', 'ADMIN', false, t0).hasAccess === true, 'Admin bypasses early access');
assert(checkEarlyAccessPermission(pubTime, 'NONE', 'USER', true, t0).hasAccess === true, 'Creator bypasses early access');

console.log(`\nEarly Access Results: ${passed} passed, ${failed} failed.\n`);
if (failed > 0) process.exit(1);
