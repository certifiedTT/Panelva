/**
 * Realistic Mock Data Layer for Panelva Mobile
 * Matches Prisma schema types and production structures.
 */

export interface MockUser {
  id: string;
  username: string;
  email: string;
  avatarUrl: string;
  role: 'USER' | 'CREATOR' | 'ADMIN' | 'MASTER_ADMIN';
  subscription: 'NONE' | 'PLUS' | 'PREMIUM';
  creditsBalance?: number;
  wCoinBalance: number;
  bio?: string;
  createdAt: string;
}

export interface MockCreatorProfile {
  id: string;
  userId: string;
  penName: string;
  type: 'WRITER' | 'ILLUSTRATOR' | 'STUDIO' | 'ARTIST' | 'NOVELIST';
  bio: string;
  portfolioUrl: string;
  isVetted: boolean;
  followerCount: number;
  viewCount: number;
  user?: {
    username: string;
    avatarUrl?: string;
  };
  membershipTiers?: any[];
}

export interface MockPage {
  id: string;
  chapterId: string;
  pageIndex: number;
  imageUrl: string;
  width?: number;
  height?: number;
}

export interface MockChapter {
  id: string;
  seriesId: string;
  title: string;
  chapterIndex: number;
  tier: 'FREE' | 'AD_SUPPORTED' | 'PREMIUM';
  createdAt: string;
  pages?: MockPage[];
  textContent?: string;
}

export interface MockSeries {
  id: string;
  title: string;
  description: string;
  coverUrl: string;
  bannerUrl?: string;
  genre: string;
  type: 'COMIC' | 'NOVEL';
  status: 'ONGOING' | 'COMPLETED' | 'HIATUS';
  rating: string;
  views: string;
  likes: number;
  creatorId: string;
  author: string;
  creator?: MockCreatorProfile;
  chapters?: MockChapter[];
  tags?: string[];
  isHot?: boolean;
  linkedSeriesId?: string | null;
  linkedSeries?: any;
}

export interface MockPollVote {
  [optionIndex: number]: number;
}

export interface MockCreatorPost {
  id: string;
  creatorProfileId: string;
  creatorProfile?: {
    penName: string;
    isVetted: boolean;
    type: string;
    user?: {
      avatarUrl?: string;
    };
  };
  type: 'TEXT' | 'IMAGE' | 'POLL' | 'ANNOUNCEMENT' | 'SERIES_UPDATE' | 'BEHIND_THE_SCENES' | 'CONCEPT_ART' | 'QA' | 'VIDEO';
  title: string;
  content: string;
  mediaUrls: string[];
  pollOptions: string[];
  pollVotes: Record<string, number>;
  totalVotes: number;
  pollExpiresAt?: string;
  likesCount: number;
  commentsCount: number;
  comments?: any[];
  createdAt: string;
}

export interface MockNotification {
  id: string;
  type: 'CHAPTER_DROP' | 'CREATOR_POST' | 'COMMENT_REPLY' | 'FOLLOW' | 'MEMBERSHIP';
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  seriesId?: string;
  series?: {
    id: string;
    title: string;
    coverUrl: string;
  };
}

// 1. SAMPLE USERS
export const MOCK_USERS: MockUser[] = [
  {
    id: 'user-001',
    username: 'LunaBlade',
    email: 'lunablade@panelva.com',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    role: 'USER',
    subscription: 'PREMIUM',
    creditsBalance: 350,
    wCoinBalance: 350,
    bio: 'Avid reader of dark fantasy and cyberpunk webcomics.',
    createdAt: '2025-01-15T08:00:00Z',
  },
  {
    id: 'user-002',
    username: 'AidenCross',
    email: 'aiden@studiospectre.com',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    role: 'CREATOR',
    subscription: 'PLUS',
    creditsBalance: 1200,
    wCoinBalance: 1200,
    bio: 'Lead artist & story architect at Studio Spectre.',
    createdAt: '2024-11-20T10:30:00Z',
  },
];

// 2. SAMPLE CREATOR PROFILES
export const MOCK_CREATORS: MockCreatorProfile[] = [
  {
    id: 'creator-001',
    userId: 'user-002',
    penName: 'Studio Spectre',
    type: 'STUDIO',
    bio: 'High-octane action and sci-fi comic production team behind "Shadow City: Neon Blade".',
    portfolioUrl: 'https://spectre.artstation.com',
    isVetted: true,
    followerCount: 14850,
    viewCount: 382000,
    user: {
      username: 'StudioSpectre',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    },
    membershipTiers: [
      {
        id: 'tier-1',
        name: 'Neon Initiate',
        priceCoins: 50,
        description: 'Read 2 chapters ahead of public release & view weekly sketch dumps.',
        benefits: ['Early chapter access (2 eps)', 'Weekly character concept sketches', 'Discord supporter badge'],
      },
      {
        id: 'tier-2',
        name: 'Cyber Patron',
        priceCoins: 150,
        description: 'Full early access, high-res desktop wallpapers, and monthly Q&A polls.',
        benefits: ['Early chapter access (5 eps)', '4K layered illustration files', 'Direct storyline voting polls'],
      },
    ],
  },
  {
    id: 'creator-002',
    userId: 'user-003',
    penName: 'Lady Seraphina',
    type: 'NOVELIST',
    bio: 'Romance & historical fantasy novelist. Author of "Born to be Grand Duchess".',
    portfolioUrl: 'https://seraphinabooks.com',
    isVetted: true,
    followerCount: 22400,
    viewCount: 510000,
    user: {
      username: 'SeraphinaRomance',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
    },
  },
  {
    id: 'creator-003',
    userId: 'user-004',
    penName: 'MageCraft Studios',
    type: 'ILLUSTRATOR',
    bio: 'Bringing magical array systems to life. Crafting "Archmage Curriculum".',
    portfolioUrl: 'https://magecraft.art',
    isVetted: true,
    followerCount: 9600,
    viewCount: 175000,
    user: {
      username: 'MageCraft',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
    },
  },
];

// 3. SAMPLE CHAPTERS
export const MOCK_CHAPTERS_SERIES_1: MockChapter[] = [
  {
    id: 'ch-101',
    seriesId: 'series-001',
    title: 'Prologue: Rain on Neon Glass',
    chapterIndex: 1,
    tier: 'FREE',
    createdAt: '2026-02-01T12:00:00Z',
    pages: [
      { id: 'p1', chapterId: 'ch-101', pageIndex: 0, imageUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800' },
      { id: 'p2', chapterId: 'ch-101', pageIndex: 1, imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800' },
      { id: 'p3', chapterId: 'ch-101', pageIndex: 2, imageUrl: 'https://images.unsplash.com/photo-1618005198143-d866a1a1f11e?w=800' },
    ],
  },
  {
    id: 'ch-102',
    seriesId: 'series-001',
    title: 'Episode 2: The Cybernetic Edge',
    chapterIndex: 2,
    tier: 'FREE',
    createdAt: '2026-02-08T12:00:00Z',
    pages: [
      { id: 'p4', chapterId: 'ch-102', pageIndex: 0, imageUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800' },
      { id: 'p5', chapterId: 'ch-102', pageIndex: 1, imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800' },
    ],
  },
  {
    id: 'ch-103',
    seriesId: 'series-001',
    title: 'Episode 3: Syndicate Patrols',
    chapterIndex: 3,
    tier: 'AD_SUPPORTED',
    createdAt: '2026-02-15T12:00:00Z',
    pages: [
      { id: 'p6', chapterId: 'ch-103', pageIndex: 0, imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800' },
      { id: 'p7', chapterId: 'ch-103', pageIndex: 1, imageUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800' },
    ],
  },
  {
    id: 'ch-104',
    seriesId: 'series-001',
    title: 'Episode 4: Overdrive Resonance (Early Access)',
    chapterIndex: 4,
    tier: 'PREMIUM',
    createdAt: '2026-02-22T12:00:00Z',
    pages: [
      { id: 'p8', chapterId: 'ch-104', pageIndex: 0, imageUrl: 'https://images.unsplash.com/photo-1618005198143-d866a1a1f11e?w=800' },
      { id: 'p9', chapterId: 'ch-104', pageIndex: 1, imageUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800' },
    ],
  },
];

export const MOCK_CHAPTERS_NOVEL_1: MockChapter[] = [
  {
    id: 'ch-201',
    seriesId: 'series-002',
    title: 'Chapter 1: The Executioner’s Ball',
    chapterIndex: 1,
    tier: 'FREE',
    createdAt: '2026-01-10T10:00:00Z',
    textContent:
      'The grand ballroom of the Solaris Palace echoed with orchestral violins and silver wine chalices. Lady Evelyn adjusted the crimson satin of her corset, feeling the cold weight of the poison vial hidden in her ring.\n\n"In my past life," she whispered to the marble mirror, "I bled on the palace steps for trusting their smiles. This time, I will buy the empire before they can crown their puppet prince."',
  },
  {
    id: 'ch-202',
    seriesId: 'series-002',
    title: 'Chapter 2: The Contract of Rebirth',
    chapterIndex: 2,
    tier: 'FREE',
    createdAt: '2026-01-17T10:00:00Z',
    textContent:
      'Duke Caelum stepped out from the shadows of the royal balcony. His obsidian coat was dusted with winter frost, and his gaze was sharp as a rapier.\n\n"You sought an alliance, Lady Evelyn," he murmured, taking a seat at the chess table. "Tell me what a disgraced heiress can offer the Northern Vanguard."\n\nShe looked directly into his eyes without flinching: "Victory without bloodshed, and the secret wealth of the fallen dynasty."',
  },
  {
    id: 'ch-203',
    seriesId: 'series-002',
    title: 'Chapter 3: Golden Treaties',
    chapterIndex: 3,
    tier: 'AD_SUPPORTED',
    createdAt: '2026-01-24T10:00:00Z',
    textContent:
      'By dawn, three trade syndicates had signed the northern transport pact. The silver seals glistened under the fireplace light. For the first time in ten years, the northern ports were free from royal tariffs.\n\n"This is only our first move," Evelyn stated, rolling up the parchment. "Tomorrow, we buy the banking guild."',
  },
  {
    id: 'ch-204',
    seriesId: 'series-002',
    title: 'Chapter 4: The Emperor’s Suspicion (Premium)',
    chapterIndex: 4,
    tier: 'PREMIUM',
    createdAt: '2026-01-31T10:00:00Z',
    textContent:
      'A royal decree arrived sealed in imperial wax. The imperial guard was mobilized along the capital gates. Someone had leaked the ledger.\n\nEvelyn smiled quietly. Everything was proceeding exactly according to the design she had drafted.',
  },
];

// 4. SAMPLE SERIES
export const MOCK_PLATFORM_SERIES: MockSeries[] = [
  {
    id: 'series-001',
    title: 'Shadow City: Neon Blade',
    description: 'In a dystopian metropolis ruled by digital syndicates, an exiled cyber-samurai returns with an experimental energy blade to avenge his fallen clan.',
    coverUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800',
    bannerUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200',
    genre: 'Action',
    type: 'COMIC',
    status: 'ONGOING',
    rating: '9.9',
    views: '142k',
    likes: 28400,
    creatorId: 'creator-001',
    author: 'Studio Spectre',
    creator: MOCK_CREATORS[0],
    chapters: MOCK_CHAPTERS_SERIES_1,
    tags: ['Cyberpunk', 'Samurai', 'Sci-Fi', 'High Octane', 'Revenge'],
    isHot: true,
    linkedSeriesId: 'series-001-novel',
  },
  {
    id: 'series-001-novel',
    title: 'Shadow City: Neon Blade (Novel)',
    description: 'The definitive text manuscript of the Shadow City saga, featuring expanded lore, deeper internal monologues, and uncensored faction intrigue.',
    coverUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800',
    bannerUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200',
    genre: 'Action',
    type: 'NOVEL',
    status: 'ONGOING',
    rating: '9.9',
    views: '84k',
    likes: 18400,
    creatorId: 'creator-001',
    author: 'Studio Spectre',
    creator: MOCK_CREATORS[0],
    chapters: MOCK_CHAPTERS_NOVEL_1,
    tags: ['Cyberpunk', 'Samurai', 'Novel', 'High Octane', 'Sci-Fi'],
    isHot: true,
    linkedSeriesId: 'series-001',
  },
  {
    id: 'series-002',
    title: 'Born to be Grand Duchess',
    description: 'Executed on false charges of treason, she wakes up ten years in the past with total recall of the imperial finances and politics. Time to build an unassailable financial empire.',
    coverUrl: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=800',
    bannerUrl: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=1200',
    genre: 'Romance',
    type: 'NOVEL',
    status: 'ONGOING',
    rating: '9.8',
    views: '98k',
    likes: 19200,
    creatorId: 'creator-002',
    author: 'Lady Seraphina',
    creator: MOCK_CREATORS[1],
    chapters: MOCK_CHAPTERS_NOVEL_1,
    tags: ['Reincarnation', 'Historical', 'Romance', 'Scheming', 'Royalty'],
    isHot: true,
  },
  {
    id: 'series-003',
    title: 'Archmage Curriculum',
    description: 'At the Imperial Academy of Rune Arrays, the youngest scholar unlocks a forbidden tier of elemental geometry that turns the world order upside down.',
    coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800',
    genre: 'Fantasy',
    type: 'COMIC',
    status: 'ONGOING',
    rating: '9.7',
    views: '76k',
    likes: 14300,
    creatorId: 'creator-003',
    author: 'MageCraft Studios',
    creator: MOCK_CREATORS[2],
    chapters: MOCK_CHAPTERS_SERIES_1,
    tags: ['Magic Academy', 'Progression', 'Runes', 'Fantasy'],
    isHot: false,
  },
  {
    id: 'series-004',
    title: 'Solo Leveling: Reawakened',
    description: 'The world-famous hunter returns as the Monarch of Shadows in this special side-story saga.',
    coverUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800',
    genre: 'Action',
    type: 'COMIC',
    status: 'COMPLETED',
    rating: '9.9',
    views: '540k',
    likes: 88000,
    creatorId: 'creator-001',
    author: 'Chugong & DUBU',
    creator: MOCK_CREATORS[0],
    chapters: MOCK_CHAPTERS_SERIES_1,
    tags: ['Hunter', 'Dungeons', 'Monarch', 'Action'],
    isHot: true,
  },
];

// 5. SAMPLE CREATOR POSTS & POLLS
export const MOCK_CREATOR_POSTS: MockCreatorPost[] = [
  {
    id: 'post-001',
    creatorProfileId: 'creator-001',
    creatorProfile: {
      penName: 'Studio Spectre',
      isVetted: true,
      type: 'STUDIO',
      user: {
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
      },
    },
    type: 'POLL',
    title: 'Which weapon design should Ren wield in the Episode 5 boss fight?',
    content: 'We drafted two experimental energy blades for the climax of Arc 1. Vote below on your favorite combat aesthetic!',
    mediaUrls: ['https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800'],
    pollOptions: ['Dual Plasma Wakizashi', 'High-Frequency Odachi', 'Overcharged Kinetic Bow'],
    pollVotes: { '0': 142, '1': 389, '2': 84 },
    totalVotes: 615,
    pollExpiresAt: new Date(Date.now() + 86400000 * 3).toISOString(),
    likesCount: 230,
    commentsCount: 45,
    createdAt: '2026-02-17T14:00:00Z',
    comments: [
      { id: 'c1', user: { username: 'LunaBlade' }, content: 'High-Frequency Odachi fits the cyberpunk samurai vibe so well!' },
      { id: 'c2', user: { username: 'AidenFan' }, content: 'Whatever he uses, that color palette is insane.' },
    ],
  },
  {
    id: 'post-002',
    creatorProfileId: 'creator-002',
    creatorProfile: {
      penName: 'Lady Seraphina',
      isVetted: true,
      type: 'NOVELIST',
      user: {
        avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
      },
    },
    type: 'CONCEPT_ART',
    title: 'Character Design Reveal: Duke Caelum in his Northern Regalia',
    content: 'Special preview illustration for our upcoming companion webcomic adaptation! Let us know your thoughts.',
    mediaUrls: ['https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=800'],
    pollOptions: [],
    pollVotes: {},
    totalVotes: 0,
    likesCount: 412,
    commentsCount: 68,
    createdAt: '2026-02-16T18:30:00Z',
  },
  {
    id: 'post-003',
    creatorProfileId: 'creator-003',
    creatorProfile: {
      penName: 'MageCraft Studios',
      isVetted: true,
      type: 'ILLUSTRATOR',
      user: {
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
      },
    },
    type: 'SERIES_UPDATE',
    title: 'Schedule Update: Episode 18 releasing 1 day early for all Supporters',
    content: 'We finished the rune animation sequence ahead of time! Tier 1 and Tier 2 members can read right now.',
    mediaUrls: [],
    pollOptions: [],
    pollVotes: {},
    totalVotes: 0,
    likesCount: 178,
    commentsCount: 19,
    createdAt: '2026-02-15T09:15:00Z',
  },
];

// 6. SAMPLE NOTIFICATIONS
export const MOCK_NOTIFICATIONS: MockNotification[] = [
  {
    id: 'notif-001',
    type: 'CHAPTER_DROP',
    title: 'New Episode Published',
    message: 'Shadow City: Neon Blade published Episode 4: Overdrive Resonance.',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    isRead: false,
    seriesId: 'series-001',
    series: {
      id: 'series-001',
      title: 'Shadow City: Neon Blade',
      coverUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800',
    },
  },
  {
    id: 'notif-002',
    type: 'CREATOR_POST',
    title: 'Studio Spectre posted a new poll',
    message: '"Which weapon design should Ren wield in the Episode 5 boss fight?"',
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    isRead: false,
  },
  {
    id: 'notif-003',
    type: 'COMMENT_REPLY',
    title: 'Reply to your reaction',
    message: '@StudioSpectre replied: "Glad you noticed the background easter eggs!"',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    isRead: true,
  },
];

// 7. CREATOR STUDIO EXTENDED MOCK DATA
export const MOCK_AUDIENCE_INSIGHTS = {
  followers: 14850,
  newReaders: 620,
  returningReaders: 1840,
  readerRetention: 78,
  avgReadingTimeMinutes: 9.2,
  topDevices: [
    { device: 'iOS (iPhone / iPad)', percentage: 58 },
    { device: 'Android (Phone / Tablet)', percentage: 34 },
    { device: 'Desktop Web', percentage: 8 },
  ],
  weeklyReadsTrend: [
    { day: 'Mon', count: 1200 },
    { day: 'Tue', count: 1450 },
    { day: 'Wed', count: 2100 },
    { day: 'Thu', count: 1980 },
    { day: 'Fri', count: 3200 },
    { day: 'Sat', count: 4800 },
    { day: 'Sun', count: 4100 },
  ],
};

export const MOCK_REVENUE_BREAKDOWN = [
  { source: 'Coin Chapter Unlocks', amount: 342.50, pct: 45 },
  { source: 'Direct Supporter Tiers', amount: 268.00, pct: 35 },
  { source: 'Ad-Supported Revenue Split', amount: 114.20, pct: 15 },
  { source: 'Creator Spotlight Grant', amount: 38.00, pct: 5 },
];

export const MOCK_PAYOUT_DETAILS = {
  payoutBalance: 76270,
  payoutBalanceUsd: 762.70,
  lastPayoutDate: '2026-02-01T00:00:00Z',
  nextPayoutDate: '2026-03-01T00:00:00Z',
  payoutStatus: 'PROCESSING',
  payoutMethod: 'Stripe Direct Connect',
  accountIdentifier: '•••• •••• •••• 4242',
};

export const MOCK_COLLABORATION_INVITATIONS = [
  {
    id: 'collab-001',
    series: { id: 'series-001', title: 'Shadow City: Neon Blade' },
    role: 'CO_ILLUSTRATOR',
    shareRatio: 25,
    message: 'Hey Spectre! Would love to assist with background painting and vehicle linework for Arc 2.',
    inviter: { username: 'MageCraft', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400' },
    status: 'PENDING',
    createdAt: '2026-02-18T11:20:00Z',
  },
  {
    id: 'collab-002',
    series: { id: 'series-002', title: 'Born to be Grand Duchess' },
    role: 'COLORIST',
    shareRatio: 15,
    message: 'Offering high-end watercolor lighting treatment for the companion comic cover.',
    inviter: { username: 'ColorStudioX', avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400' },
    status: 'PENDING',
    createdAt: '2026-02-19T14:45:00Z',
  },
];

// 8. ADMIN DASHBOARD MOCK TELEMETRY & WORKSPACE DATA
export const MOCK_ADMIN_METRICS = {
  totalUsers: 142850,
  totalCreators: 3420,
  publishedSeries: 1890,
  totalChapters: 42800,
  unresolvedReports: 6,
  pendingApplications: 4,
  unreadNotifications: 3,
  ledgerTransactions: 894200,
  systemLatencyMs: 38,
  activeReadersNow: 4120,
};

export const MOCK_SAFETY_REPORTS = [
  {
    id: 'rep-001',
    type: 'COMMENT',
    reason: 'Harassment & hostile language in Chapter 4 comments',
    severity: 'HIGH',
    status: 'UNRESOLVED',
    reporter: { username: 'LunaBlade', email: 'lunablade@panelva.com' },
    reportedTarget: { username: 'ToxicTroll99', content: 'Offensive hate comment directed at creator' },
    createdAt: '2026-02-22T08:15:00Z',
    seriesId: 'series-001',
    seriesTitle: 'Shadow City: Neon Blade',
  },
  {
    id: 'rep-002',
    type: 'DMCA_COPYRIGHT',
    reason: 'DMCA Notice: Unauthorized artwork re-upload from DeviantArt',
    severity: 'CRITICAL',
    status: 'UNRESOLVED',
    reporter: { username: 'CopyrightAgent', email: 'dmca@studiolegal.com' },
    reportedTarget: { username: 'BootlegArtist', content: 'Episode 1 cover art infringes original IP #4928' },
    createdAt: '2026-02-21T19:30:00Z',
    seriesId: 'series-003',
    seriesTitle: 'Archmage Curriculum',
  },
  {
    id: 'rep-003',
    type: 'SPAM',
    reason: 'Automated phishing link spam across 5 series comments',
    severity: 'MEDIUM',
    status: 'UNRESOLVED',
    reporter: { username: 'SeraphinaFan', email: 'fan@panelva.com' },
    reportedTarget: { username: 'CoinBot9000', content: 'Free coins click here -> bit.ly/fakecoins' },
    createdAt: '2026-02-22T10:05:00Z',
    seriesId: 'series-002',
    seriesTitle: 'Born to be Grand Duchess',
  },
  {
    id: 'rep-004',
    type: 'USER_CONDUCT',
    reason: 'Repeated spoiler spam without spoiler warning tags',
    severity: 'LOW',
    status: 'RESOLVED',
    reporter: { username: 'MangaLover', email: 'manga@panelva.com' },
    reportedTarget: { username: 'SpoilerDan', content: 'Character dies in episode 10' },
    createdAt: '2026-02-20T14:10:00Z',
    seriesId: 'series-004',
    seriesTitle: 'Solo Leveling: Reawakened',
  },
];

export const MOCK_CREATOR_APPLICATIONS = [
  {
    id: 'app-001',
    penName: 'IronForge Studios',
    creatorType: 'STUDIO',
    applicantEmail: 'contact@ironforgestudios.com',
    portfolioUrl: 'https://ironforge.artstation.com',
    sampleWorkTitle: 'Aegis Vanguard (Mecha Webcomic)',
    bio: 'Team of 4 artists with 5+ years experience in serialized sci-fi and action comics.',
    submittedAt: '2026-02-21T09:00:00Z',
    status: 'PENDING',
    monthlyTargetEpisodes: 4,
  },
  {
    id: 'app-002',
    penName: 'Aria Sterling',
    creatorType: 'NOVELIST',
    applicantEmail: 'aria.books@gmail.com',
    portfolioUrl: 'https://ariasterlingauthor.com',
    sampleWorkTitle: 'The Alchemist’s Vow (Light Novel)',
    bio: 'Published author of 3 historical romance fantasy novels looking to serialize on Panelva.',
    submittedAt: '2026-02-21T14:30:00Z',
    status: 'PENDING',
    monthlyTargetEpisodes: 8,
  },
  {
    id: 'app-003',
    penName: 'PixelBlade Art',
    creatorType: 'ILLUSTRATOR',
    applicantEmail: 'pixelblade@yahoo.com',
    portfolioUrl: 'https://instagram.com/pixelblade_art',
    sampleWorkTitle: 'Cyber Neon Genesis',
    bio: 'Digital illustrator specializing in Korean manhwa action scroll layouts.',
    submittedAt: '2026-02-20T17:15:00Z',
    status: 'PENDING',
    monthlyTargetEpisodes: 4,
  },
];

export const MOCK_VERIFICATION_REQUESTS = [
  {
    id: 'verif-001',
    creatorProfile: {
      id: 'creator-001',
      penName: 'Studio Spectre',
      followerCount: 14850,
      totalViews: 382000,
      user: { username: 'StudioSpectre' },
    },
    verificationType: 'OFFICIAL_STUDIO_BADGE',
    status: 'APPROVED',
    vettedAt: '2026-01-15T00:00:00Z',
  },
  {
    id: 'verif-002',
    creatorProfile: {
      id: 'creator-002',
      penName: 'Lady Seraphina',
      followerCount: 22400,
      totalViews: 510000,
      user: { username: 'SeraphinaRomance' },
    },
    verificationType: 'TOP_AUTHOR_BADGE',
    status: 'APPROVED',
    vettedAt: '2026-01-20T00:00:00Z',
  },
];

export const MOCK_ADMIN_USERS_DIRECTORY = [
  {
    id: 'usr-001',
    username: 'LunaBlade',
    email: 'lunablade@panelva.com',
    role: 'USER',
    subscription: 'PREMIUM',
    creditsBalance: 450,
    wCoinBalance: 450,
    status: 'ACTIVE',
    warningCount: 0,
    createdAt: '2025-01-15T08:00:00Z',
    lastActive: '10 mins ago',
  },
  {
    id: 'usr-002',
    username: 'StudioSpectre',
    email: 'aiden@studiospectre.com',
    role: 'CREATOR',
    subscription: 'PLUS',
    creditsBalance: 2450,
    wCoinBalance: 2450,
    status: 'ACTIVE',
    warningCount: 0,
    createdAt: '2024-11-20T10:30:00Z',
    lastActive: '2 mins ago',
  },
  {
    id: 'usr-003',
    username: 'AlexThorne',
    email: 'master.admin@panelva.dev',
    role: 'MASTER_ADMIN',
    subscription: 'PREMIUM',
    creditsBalance: 10000,
    wCoinBalance: 10000,
    status: 'ACTIVE',
    warningCount: 0,
    createdAt: '2024-01-01T00:00:00Z',
    lastActive: 'Now',
  },
  {
    id: 'usr-004',
    username: 'MarcusFinance',
    email: 'marcus.finance@panelva.dev',
    role: 'FINANCE_ADMIN',
    subscription: 'PREMIUM',
    creditsBalance: 7500,
    wCoinBalance: 7500,
    status: 'ACTIVE',
    warningCount: 0,
    createdAt: '2024-03-10T09:00:00Z',
    lastActive: '15 mins ago',
  },
  {
    id: 'usr-005',
    username: 'ChloeMod',
    email: 'chloe.mod@panelva.dev',
    role: 'COMMUNITY_MODERATOR',
    subscription: 'PLUS',
    creditsBalance: 800,
    wCoinBalance: 800,
    status: 'ACTIVE',
    warningCount: 0,
    createdAt: '2024-06-01T12:00:00Z',
    lastActive: '5 mins ago',
  },
  {
    id: 'usr-006',
    username: 'ToxicTroll99',
    email: 'troll99@fake.com',
    role: 'USER',
    subscription: 'NONE',
    creditsBalance: 0,
    wCoinBalance: 0,
    status: 'SUSPENDED',
    warningCount: 3,
    createdAt: '2026-02-10T11:00:00Z',
    lastActive: '3 days ago',
  },
];

export const MOCK_FINANCIAL_OVERVIEW = {
  totalCirculationEstimate: 2489000,
  totalCoinVolumeUsd: 24890.00,
  monthlyGrossRevenue: 148200.00,
  creatorPayoutObligations: 88920.00,
  platformFeeReserve: 59280.00,
  recentTransactions: [
    {
      id: 'tx-001',
      type: 'COIN_PURCHASE',
      amountCoins: 500,
      amountUsd: 4.99,
      username: 'LunaBlade',
      status: 'SETTLED',
      createdAt: '2026-02-22T14:12:00Z',
    },
    {
      id: 'tx-002',
      type: 'CREATOR_PAYOUT',
      amountCoins: 42000,
      amountUsd: 420.00,
      username: 'StudioSpectre',
      status: 'PROCESSED',
      createdAt: '2026-02-21T18:00:00Z',
    },
    {
      id: 'tx-003',
      type: 'PREMIUM_SUBSCRIPTION',
      amountCoins: 1200,
      amountUsd: 11.99,
      username: 'AidenFan',
      status: 'SETTLED',
      createdAt: '2026-02-21T09:40:00Z',
    },
    {
      id: 'tx-004',
      type: 'CHAPTER_UNLOCK_ROYALTY',
      amountCoins: 20,
      amountUsd: 0.20,
      username: 'WebcomicFan42',
      status: 'LEDGER_RECORDED',
      createdAt: '2026-02-22T16:05:00Z',
    },
  ],
};

export const MOCK_AUDIT_LOGS = [
  {
    id: 'log-001',
    actorUsername: 'AlexThorne',
    actorRole: 'MASTER_ADMIN',
    action: 'USER_ROLE_CHANGE',
    target: 'StudioSpectre -> CREATOR',
    ipAddress: '192.168.1.1',
    timestamp: '2026-02-22T15:30:00Z',
  },
  {
    id: 'log-002',
    actorUsername: 'ChloeMod',
    actorRole: 'COMMUNITY_MODERATOR',
    action: 'SAFETY_REPORT_RESOLVED',
    target: 'Report #rep-004 (Spoiler Spam)',
    ipAddress: '10.0.0.42',
    timestamp: '2026-02-22T14:15:00Z',
  },
  {
    id: 'log-003',
    actorUsername: 'MarcusFinance',
    actorRole: 'FINANCE_ADMIN',
    action: 'PAYOUT_BATCH_AUTHORIZED',
    target: 'Batch #PAY-2026-02 ($18,450.00 USD)',
    ipAddress: '172.16.0.8',
    timestamp: '2026-02-21T18:00:00Z',
  },
  {
    id: 'log-004',
    actorUsername: 'ClaireEditorial',
    actorRole: 'EDITORIAL_TEAM',
    action: 'CREATOR_APPLICATION_APPROVED',
    target: 'IronForge Studios (Official Creator Status)',
    ipAddress: '192.168.1.88',
    timestamp: '2026-02-21T11:20:00Z',
  },
  {
    id: 'log-005',
    actorUsername: 'RomanSafety',
    actorRole: 'TRUST_AND_SAFETY',
    action: 'ACCOUNT_SUSPENDED',
    target: 'ToxicTroll99 (Hate Speech Violation)',
    ipAddress: '10.0.0.99',
    timestamp: '2026-02-20T16:45:00Z',
  },
];

export const MOCK_ADMIN_NOTIFICATIONS = [
  {
    id: 'adm-notif-001',
    title: 'High Severity Safety Report',
    message: 'New DMCA copyright report filed against Archmage Curriculum.',
    category: 'SAFETY',
    severity: 'HIGH',
    createdAt: '2026-02-22T12:00:00Z',
    isRead: false,
  },
  {
    id: 'adm-notif-002',
    title: 'New Creator Application',
    message: 'IronForge Studios submitted a creator application with mecha comic sample.',
    category: 'EDITORIAL',
    severity: 'MEDIUM',
    createdAt: '2026-02-21T09:00:00Z',
    isRead: false,
  },
  {
    id: 'adm-notif-003',
    title: 'Monthly Payout Reconciliations Ready',
    message: '48 creator payout requests ready for finance verification.',
    category: 'FINANCE',
    severity: 'INFO',
    createdAt: '2026-02-20T18:00:00Z',
    isRead: true,
  },
];

