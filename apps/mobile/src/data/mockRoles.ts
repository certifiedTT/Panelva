/**
 * Mock Roles & Accounts System for Development & Preview Mode
 *
 * Provides isolated in-memory mock accounts for all 12 platform roles:
 * 1. Standard User (USER)
 * 2. Creator (CREATOR)
 * 3. Master Admin (MASTER_ADMIN)
 * 4. Admin (ADMIN)
 * 5. Finance Admin (FINANCE_ADMIN)
 * 6. Community Moderator (COMMUNITY_MODERATOR)
 * 7. Trust & Safety (TRUST_AND_SAFETY)
 * 8. Customer Support (CUSTOMER_SUPPORT)
 * 9. Editorial Team (EDITORIAL_TEAM)
 * 10. Marketing Manager (MARKETING_MANAGER)
 * 11. Partnership Manager (PARTNERSHIP_MANAGER)
 * 12. Regional Administrator (REGIONAL_ADMINISTRATOR)
 */

export type MockRoleKey =
  | 'USER'
  | 'CREATOR'
  | 'MASTER_ADMIN'
  | 'ADMIN'
  | 'FINANCE_ADMIN'
  | 'COMMUNITY_MODERATOR'
  | 'TRUST_AND_SAFETY'
  | 'CUSTOMER_SUPPORT'
  | 'EDITORIAL_TEAM'
  | 'MARKETING_MANAGER'
  | 'PARTNERSHIP_MANAGER'
  | 'REGIONAL_ADMINISTRATOR';

export interface MockAccountProfile {
  id: string;
  roleKey: MockRoleKey;
  displayName: string;
  roleLabel: string;
  username: string;
  email: string;
  avatarUrl: string;
  bio: string;
  subscription: 'NONE' | 'PLUS' | 'PREMIUM';
  creditsBalance: number;
  wCoinBalance: number;
  category: 'Consumer' | 'Creator' | 'Executive Admin' | 'Finance' | 'Moderation & Safety' | 'Content & Growth' | 'Operations';
  badgeColor: string;
  description: string;
  permissions: string[];
  hasCreatorStudioAccess: boolean;
  hasAdminDashboardAccess: boolean;
  visibleAdminTabs: Array<'overview' | 'moderation' | 'creators' | 'users' | 'finance' | 'audit' | 'notifications'>;
}

export const MOCK_ACCOUNTS_MAP: Record<MockRoleKey, MockAccountProfile> = {
  USER: {
    id: 'mock-user-001',
    roleKey: 'USER',
    displayName: 'Luna Blade',
    roleLabel: 'Standard User',
    username: 'LunaBlade',
    email: 'lunablade@panelva.dev',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    bio: 'Avid reader of dark fantasy and cyberpunk webcomics.',
    subscription: 'PREMIUM',
    creditsBalance: 450,
    wCoinBalance: 450,
    category: 'Consumer',
    badgeColor: '#3B82F6',
    description: 'Standard reader account with premium library access, reading history, and community engagement.',
    permissions: ['Read Content', 'Post Comments', 'Bookmark Series', 'Purchase Coins', 'Vote in Polls'],
    hasCreatorStudioAccess: false,
    hasAdminDashboardAccess: false,
    visibleAdminTabs: [],
  },
  CREATOR: {
    id: 'mock-creator-001',
    roleKey: 'CREATOR',
    displayName: 'Studio Spectre',
    roleLabel: 'Verified Creator',
    username: 'StudioSpectre',
    email: 'spectre@panelva.dev',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    bio: 'Lead story architect & illustrator behind "Shadow City: Neon Blade".',
    subscription: 'PLUS',
    creditsBalance: 2450,
    wCoinBalance: 2450,
    category: 'Creator',
    badgeColor: '#10B981',
    description: 'Verified creator with full studio access: series uploads, chapter management, analytics, and revenue earnings.',
    permissions: [
      'Series Publishing',
      'Chapter Uploads',
      'Audience Analytics',
      'Revenue & Payouts',
      'Community Updates & Polls',
      'Collaboration Invites',
    ],
    hasCreatorStudioAccess: true,
    hasAdminDashboardAccess: false,
    visibleAdminTabs: [],
  },
  MASTER_ADMIN: {
    id: 'mock-master-admin-001',
    roleKey: 'MASTER_ADMIN',
    displayName: 'Alex Thorne (Master Admin)',
    roleLabel: 'Master Admin',
    username: 'AlexThorne',
    email: 'master.admin@panelva.dev',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400',
    bio: 'Executive platform administrator with full authoritative privileges across web & mobile.',
    subscription: 'PREMIUM',
    creditsBalance: 10000,
    wCoinBalance: 10000,
    category: 'Executive Admin',
    badgeColor: '#DC2626',
    description: 'Unrestricted master executive access: full admin dashboard, user roles, financial ledger, and studio preview.',
    permissions: [
      'Full Admin Dashboard',
      'Creator Studio Preview',
      'Role Assignment & Revocation',
      'User Suspensions & Bans',
      'Financial Ledger & Payout Approvals',
      'Safety & DMCA Enforcement',
      'System Audit Log Auditing',
    ],
    hasCreatorStudioAccess: false,
    hasAdminDashboardAccess: true,
    visibleAdminTabs: ['overview', 'moderation', 'creators', 'users', 'finance', 'audit', 'notifications'],
  },
  ADMIN: {
    id: 'mock-admin-001',
    roleKey: 'ADMIN',
    displayName: 'Elena Vance (Admin)',
    roleLabel: 'Platform Admin',
    username: 'ElenaVance',
    email: 'admin.elena@panelva.dev',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400',
    bio: 'Core operational administrator managing content, creators, and user safety queues.',
    subscription: 'PREMIUM',
    creditsBalance: 5000,
    wCoinBalance: 5000,
    category: 'Executive Admin',
    badgeColor: '#2563EB',
    description: 'General administrator access: moderation queues, creator applications, user management, and operational telemetry.',
    permissions: [
      'Admin Overview & Telemetry',
      'Creator Applications Review',
      'Safety Reports Resolution',
      'User Management & Warning Flags',
      'Audit Logs Inspection',
    ],
    hasCreatorStudioAccess: false,
    hasAdminDashboardAccess: true,
    visibleAdminTabs: ['overview', 'moderation', 'creators', 'users', 'audit', 'notifications'],
  },
  FINANCE_ADMIN: {
    id: 'mock-finance-admin-001',
    roleKey: 'FINANCE_ADMIN',
    displayName: 'Marcus Sterling',
    roleLabel: 'Finance Admin',
    username: 'MarcusFinance',
    email: 'marcus.finance@panelva.dev',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400',
    bio: 'Overseeing global platform transactions, coin circulation, and creator revenue disbursements.',
    subscription: 'PREMIUM',
    creditsBalance: 7500,
    wCoinBalance: 7500,
    category: 'Finance',
    badgeColor: '#F59E0B',
    description: 'Financial operations dashboard: immutable credit ledger, payout reconciliations, and revenue metrics.',
    permissions: [
      'Financial Telemetry & Circulation',
      'Creator Payout Reconciliations',
      'Immutable Ledger Auditing',
      'Revenue Stream Breakdown',
      'Financial Audit Logs',
    ],
    hasCreatorStudioAccess: false,
    hasAdminDashboardAccess: true,
    visibleAdminTabs: ['overview', 'finance', 'audit', 'notifications'],
  },
  COMMUNITY_MODERATOR: {
    id: 'mock-comm-mod-001',
    roleKey: 'COMMUNITY_MODERATOR',
    displayName: 'Chloe Bennett',
    roleLabel: 'Community Moderator',
    username: 'ChloeMod',
    email: 'chloe.mod@panelva.dev',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
    bio: 'Active community leader maintaining positive reader interactions and discussion guidelines.',
    subscription: 'PLUS',
    creditsBalance: 800,
    wCoinBalance: 800,
    category: 'Moderation & Safety',
    badgeColor: '#8B5CF6',
    description: 'Moderation dashboard: safety triage queue for spam, harassment, spoiler abuse, and comment enforcement.',
    permissions: [
      'Moderation Queue Triage',
      'Spam & Harassment Resolution',
      'Comment Deletions & Warnings',
      'Safety Alerts & Incident Logs',
    ],
    hasCreatorStudioAccess: false,
    hasAdminDashboardAccess: true,
    visibleAdminTabs: ['overview', 'moderation', 'audit', 'notifications'],
  },
  TRUST_AND_SAFETY: {
    id: 'mock-trust-safety-001',
    roleKey: 'TRUST_AND_SAFETY',
    displayName: 'Agent Roman',
    roleLabel: 'Trust & Safety Lead',
    username: 'RomanSafety',
    email: 'roman.safety@panelva.dev',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
    bio: 'Dedicated trust and safety specialist handling copyright (DMCA), fraud, and severe policy violations.',
    subscription: 'PREMIUM',
    creditsBalance: 1200,
    wCoinBalance: 1200,
    category: 'Moderation & Safety',
    badgeColor: '#EC4899',
    description: 'High-level safety workspace: DMCA copyright triage, account restriction reviews, and urgent user flags.',
    permissions: [
      'DMCA & Copyright Enforcement',
      'Emergency Account Suspensions',
      'High-Priority Incident Triage',
      'User History & Risk Assessment',
      'Safety Audit Logs',
    ],
    hasCreatorStudioAccess: false,
    hasAdminDashboardAccess: true,
    visibleAdminTabs: ['overview', 'moderation', 'users', 'audit', 'notifications'],
  },
  CUSTOMER_SUPPORT: {
    id: 'mock-support-001',
    roleKey: 'CUSTOMER_SUPPORT',
    displayName: 'Maya Lin',
    roleLabel: 'Customer Support Lead',
    username: 'MayaSupport',
    email: 'maya.support@panelva.dev',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400',
    bio: 'Customer success representative aiding users with purchase issues, unlocking, and account inquiries.',
    subscription: 'PLUS',
    creditsBalance: 600,
    wCoinBalance: 600,
    category: 'Operations',
    badgeColor: '#14B8A6',
    description: 'Support operations workspace: user search & account inspection, reported issues, and notification center.',
    permissions: [
      'User Account Lookup & Inspect',
      'Purchase / Coin Inquiries Verification',
      'Support Ticket Triage',
      'Account Warning Status Review',
      'Support Notification Alerts',
    ],
    hasCreatorStudioAccess: false,
    hasAdminDashboardAccess: true,
    visibleAdminTabs: ['overview', 'users', 'moderation', 'notifications'],
  },
  EDITORIAL_TEAM: {
    id: 'mock-editorial-001',
    roleKey: 'EDITORIAL_TEAM',
    displayName: 'Claire Dupont',
    roleLabel: 'Editorial Lead',
    username: 'ClaireEditorial',
    email: 'claire.editorial@panelva.dev',
    avatarUrl: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=400',
    bio: 'Editorial curator responsible for featured webcomics, serialized novel acquisitions, and creator vetting.',
    subscription: 'PREMIUM',
    creditsBalance: 2000,
    wCoinBalance: 2000,
    category: 'Content & Growth',
    badgeColor: '#6366F1',
    description: 'Editorial curation hub: creator application reviews, portfolio vetting, and content curation.',
    permissions: [
      'Creator Application Reviews & Vetting',
      'Featured Curation & Banner Placement',
      'Series Format Verification',
      'Editorial Alerts',
    ],
    hasCreatorStudioAccess: false,
    hasAdminDashboardAccess: true,
    visibleAdminTabs: ['overview', 'creators', 'notifications'],
  },
  MARKETING_MANAGER: {
    id: 'mock-marketing-001',
    roleKey: 'MARKETING_MANAGER',
    displayName: 'Jordan Reed',
    roleLabel: 'Marketing Manager',
    username: 'JordanMarketing',
    email: 'jordan.marketing@panelva.dev',
    avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400',
    bio: 'Leading growth campaigns, trending series promotions, and creator spotlight initiatives.',
    subscription: 'PREMIUM',
    creditsBalance: 3000,
    wCoinBalance: 3000,
    category: 'Content & Growth',
    badgeColor: '#10B981',
    description: 'Growth & marketing workspace: platform growth telemetry, creator spotlight insights, and campaign broadcasts.',
    permissions: [
      'Platform Growth & Scale Metrics',
      'Creator Spotlight & Partnerships Preview',
      'Campaign Notification Broadcasts',
    ],
    hasCreatorStudioAccess: false,
    hasAdminDashboardAccess: true,
    visibleAdminTabs: ['overview', 'creators', 'notifications'],
  },
  PARTNERSHIP_MANAGER: {
    id: 'mock-partnership-001',
    roleKey: 'PARTNERSHIP_MANAGER',
    displayName: 'Daniel Kim',
    roleLabel: 'Partnership Manager',
    username: 'DanielPartnerships',
    email: 'daniel.partnerships@panelva.dev',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400',
    bio: 'Managing studio partnerships, co-productions, and international comic licensing.',
    subscription: 'PREMIUM',
    creditsBalance: 4000,
    wCoinBalance: 4000,
    category: 'Content & Growth',
    badgeColor: '#06B6D4',
    description: 'Studio partnerships hub: creator application vetting, verification badges, and co-production workflows.',
    permissions: [
      'Studio & Partner Verification',
      'Creator Application Vetting',
      'Partnership Telemetry & Alerts',
    ],
    hasCreatorStudioAccess: false,
    hasAdminDashboardAccess: true,
    visibleAdminTabs: ['overview', 'creators', 'notifications'],
  },
  REGIONAL_ADMINISTRATOR: {
    id: 'mock-regional-admin-001',
    roleKey: 'REGIONAL_ADMINISTRATOR',
    displayName: 'Sofia Ramos',
    roleLabel: 'Regional Administrator (LATAM/EU)',
    username: 'SofiaRegional',
    email: 'sofia.regional@panelva.dev',
    avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400',
    bio: 'Regional operations head overseeing localized content compliance, regional creators, and community standards.',
    subscription: 'PREMIUM',
    creditsBalance: 3500,
    wCoinBalance: 3500,
    category: 'Operations',
    badgeColor: '#F43F5E',
    description: 'Regional administrative dashboard: regional moderation, creator reviews, localized users, and regional compliance.',
    permissions: [
      'Regional Content Compliance',
      'Regional Creator Reviews',
      'Localized User Moderation',
      'Regional Audit Logs & Alerts',
    ],
    hasCreatorStudioAccess: false,
    hasAdminDashboardAccess: true,
    visibleAdminTabs: ['overview', 'moderation', 'users', 'creators', 'audit', 'notifications'],
  },
};

export const MOCK_ACCOUNTS_LIST: MockAccountProfile[] = Object.values(MOCK_ACCOUNTS_MAP);

/**
 * Helper to test if a role has access to Creator Studio tools.
 * Exclusively for CREATOR and VERIFIED_CREATOR roles.
 */
export function isCreatorRole(role: string | undefined | null): boolean {
  if (!role) return false;
  const upper = role.toUpperCase();
  return upper === 'CREATOR' || upper === 'VERIFIED_CREATOR';
}

/**
 * Helper to test if a role has access to the Admin Dashboard Hub.
 * Excludes standard USER and CREATOR roles.
 */
export function isAdminRole(role: string | undefined | null): boolean {
  if (!role) return false;
  const upper = role.toUpperCase();
  return upper !== 'USER' && upper !== 'CREATOR' && upper !== 'VERIFIED_CREATOR' && upper !== 'GUEST';
}

/**
 * Get visible Admin Hub navigation tabs for a given role.
 */
export function getVisibleAdminTabs(role: string | undefined | null): Array<'overview' | 'moderation' | 'creators' | 'users' | 'finance' | 'audit' | 'notifications'> {
  if (!role) return [];
  const upper = role.toUpperCase() as MockRoleKey;
  if (MOCK_ACCOUNTS_MAP[upper]) {
    return MOCK_ACCOUNTS_MAP[upper].visibleAdminTabs;
  }
  // Generic fallbacks for standard roles
  if (upper === 'MASTER_ADMIN') {
    return ['overview', 'moderation', 'creators', 'users', 'finance', 'audit', 'notifications'];
  }
  if (upper === 'ADMIN' || upper.includes('ADMIN')) {
    return ['overview', 'moderation', 'creators', 'users', 'audit', 'notifications'];
  }
  if (upper.includes('MOD') || upper.includes('SAFETY')) {
    return ['overview', 'moderation', 'audit', 'notifications'];
  }
  if (upper.includes('FINANCE')) {
    return ['overview', 'finance', 'audit', 'notifications'];
  }
  return ['overview', 'notifications'];
}

/**
 * Get role badge color.
 */
export function getRoleBadgeColor(role: string | undefined | null): string {
  if (!role) return '#3B82F6';
  const upper = role.toUpperCase() as MockRoleKey;
  return MOCK_ACCOUNTS_MAP[upper]?.badgeColor || '#3B82F6';
}

/**
 * Get user-friendly role display name.
 */
export function getRoleDisplayName(role: string | undefined | null): string {
  if (!role) return 'Standard User';
  const upper = role.toUpperCase() as MockRoleKey;
  return MOCK_ACCOUNTS_MAP[upper]?.roleLabel || role.replace(/_/g, ' ');
}
