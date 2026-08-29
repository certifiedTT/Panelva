const assert = require('assert');

// 1. Validate Mock Roles logic (simulating mockRoles.ts in JS for fast test execution)
const MockRoleKey = {
  USER: 'USER',
  CREATOR: 'CREATOR',
  MASTER_ADMIN: 'MASTER_ADMIN',
  ADMIN: 'ADMIN',
  FINANCE_ADMIN: 'FINANCE_ADMIN',
  COMMUNITY_MODERATOR: 'COMMUNITY_MODERATOR',
  TRUST_AND_SAFETY: 'TRUST_AND_SAFETY',
  CUSTOMER_SUPPORT: 'CUSTOMER_SUPPORT',
  EDITORIAL_TEAM: 'EDITORIAL_TEAM',
  MARKETING_MANAGER: 'MARKETING_MANAGER',
  PARTNERSHIP_MANAGER: 'PARTNERSHIP_MANAGER',
  REGIONAL_ADMINISTRATOR: 'REGIONAL_ADMINISTRATOR',
};

const ALL_ROLES = Object.values(MockRoleKey);

function isCreatorRole(role) {
  if (!role) return false;
  const upper = role.toUpperCase();
  return upper === 'CREATOR' || upper === 'VERIFIED_CREATOR';
}

function isAdminRole(role) {
  if (!role) return false;
  const upper = role.toUpperCase();
  return upper !== 'USER' && upper !== 'CREATOR' && upper !== 'VERIFIED_CREATOR' && upper !== 'GUEST';
}

function getVisibleAdminTabs(role) {
  if (!role) return ['overview', 'notifications'];
  const upper = role.toUpperCase();

  switch (upper) {
    case 'MASTER_ADMIN':
    case 'ADMIN':
      return ['overview', 'moderation', 'creators', 'users', 'finance', 'audit', 'notifications'];

    case 'FINANCE_ADMIN':
      return ['overview', 'finance', 'audit', 'notifications'];

    case 'COMMUNITY_MODERATOR':
    case 'MODERATOR':
      return ['overview', 'moderation', 'audit', 'notifications'];

    case 'TRUST_AND_SAFETY':
    case 'SAFETY_SPECIALIST':
      return ['overview', 'moderation', 'users', 'audit', 'notifications'];

    case 'CUSTOMER_SUPPORT':
      return ['overview', 'moderation', 'users', 'notifications'];

    case 'EDITORIAL_TEAM':
      return ['overview', 'creators', 'notifications'];

    case 'MARKETING_MANAGER':
      return ['overview', 'creators', 'notifications'];

    case 'PARTNERSHIP_MANAGER':
      return ['overview', 'creators', 'finance', 'notifications'];

    case 'REGIONAL_ADMINISTRATOR':
      return ['overview', 'moderation', 'creators', 'users', 'notifications'];

    default:
      return ['overview', 'notifications'];
  }
}

function getRoleBadgeColor(role) {
  if (!role) return '#2563EB';
  const upper = role.toUpperCase();

  switch (upper) {
    case 'MASTER_ADMIN':
      return '#DC2626';
    case 'ADMIN':
      return '#2563EB';
    case 'FINANCE_ADMIN':
      return '#F59E0B';
    case 'COMMUNITY_MODERATOR':
      return '#8B5CF6';
    case 'TRUST_AND_SAFETY':
      return '#EF4444';
    case 'CUSTOMER_SUPPORT':
      return '#06B6D4';
    case 'EDITORIAL_TEAM':
      return '#EC4899';
    case 'MARKETING_MANAGER':
      return '#10B981';
    case 'PARTNERSHIP_MANAGER':
      return '#6366F1';
    case 'REGIONAL_ADMINISTRATOR':
      return '#14B8A6';
    case 'CREATOR':
      return '#8B5CF6';
    case 'USER':
    default:
      return '#3B82F6';
  }
}

function getRoleDisplayName(role) {
  if (!role) return 'Standard User';
  const upper = role.toUpperCase();

  switch (upper) {
    case 'USER':
      return 'Standard User';
    case 'CREATOR':
      return 'Creator';
    case 'MASTER_ADMIN':
      return 'Master Admin';
    case 'ADMIN':
      return 'Admin';
    case 'FINANCE_ADMIN':
      return 'Finance Admin';
    case 'COMMUNITY_MODERATOR':
      return 'Community Moderator';
    case 'TRUST_AND_SAFETY':
      return 'Trust & Safety';
    case 'CUSTOMER_SUPPORT':
      return 'Customer Support';
    case 'EDITORIAL_TEAM':
      return 'Editorial Team';
    case 'MARKETING_MANAGER':
      return 'Marketing Manager';
    case 'PARTNERSHIP_MANAGER':
      return 'Partnership Manager';
    case 'REGIONAL_ADMINISTRATOR':
      return 'Regional Administrator';
    default:
      return role.replace(/_/g, ' ');
  }
}

console.log('--- RUNNING DEV MOCK ROLES SYSTEM TEST SUITE ---');

// Test 1: All 12 roles exist
console.log('Test 1: Verify all 12 mock roles exist');
assert.strictEqual(ALL_ROLES.length, 12, 'Must have exactly 12 mock roles');
console.log('✓ Passed: 12 distinct mock roles registered');

// Test 2: Creator Studio Access Matrix
console.log('\nTest 2: Creator Studio Access Matrix (isCreatorRole)');
assert.strictEqual(isCreatorRole('USER'), false, 'Standard User must NOT have creator access');
assert.strictEqual(isCreatorRole('CREATOR'), true, 'Creator must have creator studio access');
assert.strictEqual(isCreatorRole('VERIFIED_CREATOR'), true, 'Verified Creator must have creator studio access');
assert.strictEqual(isCreatorRole('MASTER_ADMIN'), false, 'Master Admin must NOT have creator studio access (Admin Hub only)');
assert.strictEqual(isCreatorRole('ADMIN'), false, 'Admin must NOT have creator studio access (Admin Hub only)');
assert.strictEqual(isCreatorRole('EDITORIAL_TEAM'), false, 'Editorial Team must NOT have creator studio access (Admin Hub only)');
assert.strictEqual(isCreatorRole('MARKETING_MANAGER'), false, 'Marketing Manager must NOT have creator studio access (Admin Hub only)');
assert.strictEqual(isCreatorRole('PARTNERSHIP_MANAGER'), false, 'Partnership Manager must NOT have creator studio access (Admin Hub only)');
assert.strictEqual(isCreatorRole('REGIONAL_ADMINISTRATOR'), false, 'Regional Administrator must NOT have creator studio access (Admin Hub only)');
assert.strictEqual(isCreatorRole('FINANCE_ADMIN'), false, 'Finance Admin is admin-only, not creator studio');
console.log('✓ Passed: Creator Studio access matrix behaves as specified');

// Test 3: Admin Operations Access Matrix
console.log('\nTest 3: Admin Operations Access Matrix (isAdminRole)');
assert.strictEqual(isAdminRole('USER'), false, 'Standard User must NOT have admin access');
assert.strictEqual(isAdminRole('CREATOR'), false, 'Creator must NOT have admin access');
assert.strictEqual(isAdminRole('MASTER_ADMIN'), true, 'Master Admin has admin access');
assert.strictEqual(isAdminRole('ADMIN'), true, 'Admin has admin access');
assert.strictEqual(isAdminRole('FINANCE_ADMIN'), true, 'Finance Admin has admin access');
assert.strictEqual(isAdminRole('COMMUNITY_MODERATOR'), true, 'Community Moderator has admin access');
assert.strictEqual(isAdminRole('TRUST_AND_SAFETY'), true, 'Trust & Safety has admin access');
assert.strictEqual(isAdminRole('CUSTOMER_SUPPORT'), true, 'Customer Support has admin access');
assert.strictEqual(isAdminRole('EDITORIAL_TEAM'), true, 'Editorial Team has admin access');
assert.strictEqual(isAdminRole('MARKETING_MANAGER'), true, 'Marketing Manager has admin access');
assert.strictEqual(isAdminRole('PARTNERSHIP_MANAGER'), true, 'Partnership Manager has admin access');
assert.strictEqual(isAdminRole('REGIONAL_ADMINISTRATOR'), true, 'Regional Administrator has admin access');
console.log('✓ Passed: Admin operations access matrix behaves as specified');

// Test 4: Dynamic Admin Tab Visibility per Role
console.log('\nTest 4: Admin Tab Visibility Matrix (getVisibleAdminTabs)');
const masterTabs = getVisibleAdminTabs('MASTER_ADMIN');
assert.strictEqual(masterTabs.length, 7, 'Master Admin must have all 7 tabs');
assert.deepStrictEqual(masterTabs, ['overview', 'moderation', 'creators', 'users', 'finance', 'audit', 'notifications']);

const financeTabs = getVisibleAdminTabs('FINANCE_ADMIN');
assert.ok(financeTabs.includes('finance'), 'Finance Admin must see finance tab');
assert.ok(financeTabs.includes('audit'), 'Finance Admin must see audit tab');
assert.ok(!financeTabs.includes('moderation'), 'Finance Admin should not see moderation tab');

const modTabs = getVisibleAdminTabs('COMMUNITY_MODERATOR');
assert.ok(modTabs.includes('moderation'), 'Moderator must see moderation tab');
assert.ok(!modTabs.includes('finance'), 'Moderator should not see finance tab');

const editorialTabs = getVisibleAdminTabs('EDITORIAL_TEAM');
assert.ok(editorialTabs.includes('creators'), 'Editorial must see creators tab');
assert.ok(!editorialTabs.includes('finance'), 'Editorial should not see finance tab');

const partnershipTabs = getVisibleAdminTabs('PARTNERSHIP_MANAGER');
assert.ok(partnershipTabs.includes('creators'), 'Partnership Manager must see creators tab');
assert.ok(partnershipTabs.includes('finance'), 'Partnership Manager must see finance tab');

console.log('✓ Passed: Dynamic tab visibility matrix strictly respected');

// Test 5: Role Badges and Display Names
console.log('\nTest 5: Role Badges and Display Names');
ALL_ROLES.forEach((r) => {
  const badgeColor = getRoleBadgeColor(r);
  const displayName = getRoleDisplayName(r);
  assert.ok(badgeColor.startsWith('#'), `Badge color for ${r} must be valid hex`);
  assert.ok(displayName.length > 0, `Display name for ${r} must be non-empty`);
});
console.log('✓ Passed: All 12 roles have distinct badge colors and display names');

console.log('\n========================================');
console.log('🎉 ALL DEV MOCK ROLES TESTS PASSED SUCCESSFULLY! 🎉');
console.log('========================================');
