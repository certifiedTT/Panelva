export const LOCAL_FALLBACK_CATALOG = [
  // Comics
  { id: "1", title: "Love Bites", genre: "Romance", type: "COMIC" },
  { id: "2", title: "Star Catcher", genre: "Romance", type: "COMIC" },
  { id: "3", title: "A Spell for a Smith", genre: "Fantasy", type: "COMIC" },
  { id: "4", title: "Surviving the Game as a Barbarian", genre: "Fantasy", type: "COMIC" },
  { id: "5", title: "Swolemates", genre: "Comedy", type: "COMIC" },
  { id: "6", title: "Sweet Romance, Spicy Roommates", genre: "Romance", type: "COMIC" },
  { id: "13", title: "Being Raised by Villains", genre: "Fantasy", type: "COMIC" },
  { id: "14", title: "Darling, Why Can't We Divorce?", genre: "Romance", type: "COMIC" },
  // Novels
  { id: "7", title: "Born to be the Grand Duchess", genre: "Romance", type: "NOVEL" },
  { id: "8", title: "Life of a Demon Hunter", genre: "Action", type: "NOVEL" },
  { id: "9", title: "Girlfriend Manual", genre: "Romance", type: "NOVEL" },
  { id: "10", title: "Aiming for the Alimony", genre: "Romance", type: "NOVEL" },
  { id: "11", title: "Archmage Curriculum", genre: "Fantasy", type: "NOVEL" },
  { id: "12", title: "My Child Will Have a Different Father", genre: "Fantasy", type: "NOVEL" },
  { id: "15", title: "The Holy Power of Modern Medicine", genre: "Fantasy", type: "NOVEL" },
  { id: "16", title: "Parent-Teacher Conflict", genre: "Romance", type: "NOVEL" },
  { id: "17", title: "Anna's Tale", genre: "Drama", type: "COMIC" },
  // Binge Series
  { id: "18", title: "Moonlight Sculptor", genre: "Fantasy", type: "COMIC" },
  { id: "19", title: "Tomb Raider King", genre: "Action", type: "COMIC" },
  { id: "20", title: "Dungeon Reset", genre: "Fantasy", type: "COMIC" },
  { id: "21", title: "God of Blackfield", genre: "Action", type: "COMIC" },
  { id: "22", title: "Overgeared", genre: "Fantasy", type: "COMIC" },
  { id: "23", title: "The Great Mage", genre: "Fantasy", type: "COMIC" },
  { id: "24", title: "Second Life Ranker", genre: "Fantasy", type: "COMIC" },
  { id: "25", title: "Returner's Magic", genre: "Fantasy", type: "COMIC" },
  // Season Returns
  { id: "26", title: "Solo Leveling: Ragnarok", genre: "Action", type: "COMIC" },
  { id: "27", title: "Tower of God Season 3", genre: "Fantasy", type: "COMIC" },
  { id: "28", title: "The Boxer: Back Alley", genre: "Drama", type: "COMIC" },
  { id: "29", title: "Mercenary Enrollment S2", genre: "Action", type: "COMIC" },
  { id: "30", title: "Eleceed New Season", genre: "Action", type: "COMIC" },
  { id: "31", title: "Beginning After the End S6", genre: "Fantasy", type: "COMIC" },
  { id: "32", title: "Wind Breaker Season 4", genre: "Drama", type: "COMIC" },
  { id: "33", title: "Doom Breaker Season 2", genre: "Action", type: "COMIC" },
  // Early Access
  { id: "34", title: "Blossoming Blade", genre: "Action", type: "COMIC" },
  { id: "35", title: "Omniscient Reader", genre: "Fantasy", type: "COMIC" },
  { id: "36", title: "Doom Breaker", genre: "Action", type: "COMIC" },
  { id: "37", title: "Undercover Professor", genre: "Fantasy", type: "COMIC" },
  { id: "38", title: "S-Classes That I Raised", genre: "Fantasy", type: "COMIC" },
  { id: "39", title: "Max-Level Newbie", genre: "Action", type: "COMIC" },
  { id: "40", title: "Standard Reincarnation", genre: "Fantasy", type: "COMIC" },
  { id: "41", title: "Reaper of Drifting Moon", genre: "Action", type: "COMIC" },
  // Originals
  { id: "42", title: "Panelva Chronicles", genre: "Fantasy", type: "COMIC" },
  { id: "43", title: "Neon Genesis: Panelva", genre: "Sci-Fi", type: "COMIC" },
  { id: "44", title: "Constellation Academy", genre: "Fantasy", type: "COMIC" },
  { id: "45", title: "Legend of Northern Blade", genre: "Action", type: "COMIC" },
  { id: "46", title: "Second Life Ranker", genre: "Fantasy", type: "COMIC" },
  { id: "47", title: "The Archmage's Return", genre: "Fantasy", type: "COMIC" },
  { id: "48", title: "Shadow Sovereign", genre: "Fantasy", type: "COMIC" },
  { id: "49", title: "Leveling Up My Class", genre: "Fantasy", type: "COMIC" },
];

export const comics = [
  { id: "1", title: "Love Bites", author: "Lee Jehwan", likes: "3.9M", isNew: true, genre: "Romance", chapters: 42, coverBg: "linear-gradient(135deg, #4c0519, #9f1239)" },
  { id: "2", title: "Star Catcher", author: "DrawPro", likes: "3M", isNew: true, genre: "Romance", chapters: 36, coverBg: "linear-gradient(135deg, #1e1b4b, #311042)" },
  { id: "3", title: "A Spell for a Smith", author: "MagusSmith", likes: "3.4M", isNew: true, genre: "Fantasy", chapters: 48, coverBg: "linear-gradient(135deg, #022c22, #064e3b)" },
  { id: "4", title: "Surviving the Game as a Barbarian", author: "BarbarianKing", likes: "4.4M", isNew: true, genre: "Fantasy", chapters: 78, coverBg: "linear-gradient(135deg, #450a0a, #781c1c)" },
  { id: "5", title: "Swolemates", author: "GymTons", likes: "7.6M", isNew: true, genre: "Comedy", chapters: 88, coverBg: "linear-gradient(135deg, #1f2937, #111827)" },
  { id: "6", title: "Sweet Romance, Spicy Roommates", author: "SpiceWriter", likes: "92,054", isNew: true, genre: "Romance", chapters: 24, coverBg: "linear-gradient(135deg, #831843, #db2777)" },
  { id: "13", title: "Being Raised by Villains", author: "VillainWriter", likes: "1.2M", isNew: false, genre: "Fantasy", chapters: 30, coverBg: "linear-gradient(135deg, #fef08a, #fbcfe8, #f472b6)", isNewSeries: true },
  { id: "14", title: "Darling, Why Can't We Divorce?", author: "DivorceLover", likes: "890K", isNew: false, genre: "Romance", chapters: 24, coverBg: "linear-gradient(135deg, #1e293b, #334155, #64748b)" }
];

export const novels = [
  { id: "7", title: "Born to be the Grand Duchess", author: "DuchessPen", likes: "549,934", isNew: true, genre: "Romance", chapters: 52, coverBg: "linear-gradient(135deg, #0c4a6e, #0369a1)" },
  { id: "8", title: "Life of a Demon Hunter", author: "HunterJong", likes: "25,011", isNew: true, genre: "Action", chapters: 30, coverBg: "linear-gradient(135deg, #062f4f, #000000)" },
  { id: "9", title: "Girlfriend Manual", author: "ManualMaker", likes: "2.2M", isNew: false, genre: "Romance", chapters: 64, coverBg: "linear-gradient(135deg, #581c87, #3b0764)" },
  { id: "10", title: "Aiming for the Alimony", author: "LawyerLover", likes: "919,423", isNew: true, genre: "Romance", chapters: 45, coverBg: "linear-gradient(135deg, #111827, #1f2937)" },
  { id: "11", title: "Archmage Curriculum", author: "MageTeacher", likes: "61,697", isNew: true, genre: "Fantasy", chapters: 34, coverBg: "linear-gradient(135deg, #065f46, #047857)" },
  { id: "12", title: "My Child Will Have a Different Father", author: "FatedPath", likes: "2.1M", isNew: true, genre: "Fantasy", chapters: 58, coverBg: "linear-gradient(135deg, #451a03, #78350f)" },
  { id: "15", title: "The Holy Power of Modern Medicine", author: "DocMage", likes: "2.1M", isNew: false, genre: "Fantasy", chapters: 35, coverBg: "linear-gradient(135deg, #e2e8f0, #cbd5e1, #fbbf24)" },
  { id: "16", title: "Parent-Teacher Conflict", author: "ConflictWriter", likes: "450K", isNew: false, genre: "Romance", chapters: 20, coverBg: "linear-gradient(135deg, #4c0519, #881337, #f43f5e)" }
];

export const bingeSeries = [
  { id: "18", title: "Moonlight Sculptor", author: "SculptKing", likes: "5.6M", genre: "Fantasy", chapters: 215, coverBg: "linear-gradient(135deg, #311042, #1e1b4b)" },
  { id: "19", title: "Tomb Raider King", author: "RaiderAuthor", likes: "4.2M", genre: "Action", chapters: 184, coverBg: "linear-gradient(135deg, #0f172a, #334155)" },
  { id: "20", title: "Dungeon Reset", author: "ResetWriter", likes: "3.8M", genre: "Fantasy", chapters: 152, coverBg: "linear-gradient(135deg, #065f46, #064e3b)" },
  { id: "21", title: "God of Blackfield", author: "BlackfieldDoc", likes: "4.9M", genre: "Action", chapters: 167, coverBg: "linear-gradient(135deg, #450a0a, #1f2937)" },
  { id: "22", title: "Overgeared", author: "GridLover", likes: "8.1M", genre: "Fantasy", chapters: 198, coverBg: "linear-gradient(135deg, #781c1c, #4c0519)" },
  { id: "23", title: "The Great Mage", author: "MageWriter", likes: "3.1M", genre: "Fantasy", chapters: 172, coverBg: "linear-gradient(135deg, #1e3a8a, #0c4a6e)" },
  { id: "24", title: "Second Life Ranker", author: "RankerAuthor", likes: "4.7M", genre: "Fantasy", chapters: 158, coverBg: "linear-gradient(135deg, #3b0764, #18181b)" },
  { id: "25", title: "Returner's Magic", author: "MagicReturn", likes: "5.2M", genre: "Fantasy", chapters: 205, coverBg: "linear-gradient(135deg, #1f2937, #0f172a)" }
];

export const seasonReturns = [
  { id: "26", title: "Solo Leveling: Ragnarok", author: "Chugong", likes: "12M", genre: "Action", chapters: 140, coverBg: "linear-gradient(135deg, #062f4f, #1e1b4b)", isSeasonReturn: true },
  { id: "27", title: "Tower of God Season 3", author: "SIU", likes: "15M", genre: "Fantasy", chapters: 185, coverBg: "linear-gradient(135deg, #78350f, #3b0764)", isSeasonReturn: true },
  { id: "28", title: "The Boxer: Back Alley", author: "JH", likes: "9.4M", genre: "Drama", chapters: 104, coverBg: "linear-gradient(135deg, #111827, #000000)", isSeasonReturn: true },
  { id: "29", title: "Mercenary Enrollment S2", author: "EnrollWriter", likes: "8.6M", genre: "Action", chapters: 112, coverBg: "linear-gradient(135deg, #334155, #1e293b)", isSeasonReturn: true },
  { id: "30", title: "Eleceed New Season", author: "EleceedTeam", likes: "11M", genre: "Action", chapters: 156, coverBg: "linear-gradient(135deg, #022c22, #047857)", isSeasonReturn: true },
  { id: "31", title: "Beginning After the End S6", author: "TurtleMe", likes: "10.4M", genre: "Fantasy", chapters: 175, coverBg: "linear-gradient(135deg, #0c4a6e, #581c87)", isSeasonReturn: true },
  { id: "32", title: "Wind Breaker Season 4", author: "Yongseok", likes: "9.9M", genre: "Drama", chapters: 210, coverBg: "linear-gradient(135deg, #4c0519, #111827)", isSeasonReturn: true },
  { id: "33", title: "Doom Breaker Season 2", author: "DoomWriter", likes: "6.7M", genre: "Action", chapters: 95, coverBg: "linear-gradient(135deg, #450a0a, #3f3f46)", isSeasonReturn: true }
];

export const earlyAccess = [
  { id: "34", title: "Blossoming Blade", author: "BladeAuthor", likes: "7.1M", genre: "Action", chapters: 92, coverBg: "linear-gradient(135deg, #db2777, #4c0519)", isEarlyAccess: true },
  { id: "35", title: "Omniscient Reader", author: "SingShong", likes: "14M", genre: "Fantasy", chapters: 198, coverBg: "linear-gradient(135deg, #0f172a, #1d4ed8)", isEarlyAccess: true },
  { id: "36", title: "Doom Breaker", author: "BlueWriter", likes: "6.9M", genre: "Action", chapters: 84, coverBg: "linear-gradient(135deg, #1e3a8a, #111827)", isEarlyAccess: true },
  { id: "37", title: "Undercover Professor", author: "ProfAuthor", likes: "5.4M", genre: "Fantasy", chapters: 76, coverBg: "linear-gradient(135deg, #064e3b, #1e293b)", isEarlyAccess: true },
  { id: "38", title: "S-Classes That I Raised", author: "ClassWriter", likes: "6.2M", genre: "Fantasy", chapters: 110, coverBg: "linear-gradient(135deg, #581c87, #db2777)", isEarlyAccess: true },
  { id: "39", title: "Max-Level Newbie", author: "NewbieAuthor", likes: "8.3M", genre: "Action", chapters: 125, coverBg: "linear-gradient(135deg, #062f4f, #065f46)", isEarlyAccess: true },
  { id: "40", title: "Standard Reincarnation", author: "ReincWriter", likes: "4.1M", genre: "Fantasy", chapters: 68, coverBg: "linear-gradient(135deg, #781c1c, #111827)", isEarlyAccess: true },
  { id: "41", title: "Reaper of Drifting Moon", author: "MoonReaper", likes: "5.8M", genre: "Action", chapters: 96, coverBg: "linear-gradient(135deg, #1e1b4b, #000000)", isEarlyAccess: true }
];

export const originals = [
  { id: "42", title: "Panelva Chronicles", author: "PanelvaStudio", likes: "9.2M", genre: "Fantasy", chapters: 150, coverBg: "linear-gradient(135deg, #1d4ed8, #4c0519)", isOriginal: true },
  { id: "43", title: "Neon Genesis: Panelva", author: "NeonWriter", likes: "7.4M", genre: "Sci-Fi", chapters: 85, coverBg: "linear-gradient(135deg, #3b0764, #1e1b4b)", isOriginal: true },
  { id: "44", title: "Constellation Academy", author: "StarMage", likes: "6.1M", genre: "Fantasy", chapters: 94, coverBg: "linear-gradient(135deg, #064e3b, #0c4a6e)", isOriginal: true },
  { id: "45", title: "Legend of Northern Blade", author: "NorthernWriter", likes: "10M", genre: "Action", chapters: 130, coverBg: "linear-gradient(135deg, #111827, #334155)", isOriginal: true },
  { id: "46", title: "Second Life Ranker", author: "RankerTeam", likes: "8.7M", genre: "Fantasy", chapters: 158, coverBg: "linear-gradient(135deg, #581c87, #062f4f)", isOriginal: true },
  { id: "47", title: "The Archmage's Return", author: "ReturnMage", likes: "5.9M", genre: "Fantasy", chapters: 112, coverBg: "linear-gradient(135deg, #0f172a, #047857)", isOriginal: true },
  { id: "48", title: "Shadow Sovereign", author: "ShadowKing", likes: "12M", genre: "Fantasy", chapters: 180, coverBg: "linear-gradient(135deg, #311042, #111827)", isOriginal: true },
  { id: "49", title: "Leveling Up My Class", author: "ClassLeveler", likes: "4.8M", genre: "Fantasy", chapters: 74, coverBg: "linear-gradient(135deg, #450a0a, #78350f)", isOriginal: true }
];

export const EPISODE_TITLES = [
  "Erasure",
  "Confirmation",
  "The First Scheme",
  "When Light Falls",
  "Midnight Rendezvous",
  "Blood Moon Rising",
  "Shadow Play",
  "Fated Paths",
  "Constellation Array",
  "Tides of Change",
  "Unspoken Promise",
  "The Last Forging",
  "Crimson Bond",
  "Secret Agenda",
  "Broken Lock",
  "Silent Whispers",
  "After the Storm",
  "A New Light",
  "The Duke's Offer",
  "Betrayal at Dawn",
  "Celestial Sign",
  "Deeper Underground",
  "Truth Exposed",
  "Revenge Declared",
  "Final Standoff",
  "A New Tomorrow"
];

export const SERIES_DATA: Record<string, any> = {
  "1": { title: "Love Bites", alt: "러브 바이트", description: "Step into a world of visual romance and sweet bloodthirsty bites, where secrets of vampires and humans intertwine in an unexpected sweet roommate setup.", likes: "3.9M", rating: "8.8", chapters: 42, subscribers: "75.4K", views: "3.9M", status: "Ongoing", type: "MANHWA", author: "Lee Jehwan", artist: "Park Bumjin", tags: ["Romance", "Vampire", "Drama", "School Life"], coverBg: "linear-gradient(135deg, #4c0519, #9f1239)" },
  "2": { title: "Star Catcher", alt: "별을 잡는 자", description: "Catching stars and chasing hearts in the dark night sky. A heartwarming story about young astronomy students searching for their path through cosmic connections.", likes: "3M", rating: "8.5", chapters: 36, subscribers: "54.1K", views: "3.0M", status: "Ongoing", type: "MANHWA", author: "DrawPro", artist: "AstroArt", tags: ["Romance", "Slice of Life", "Drama"], coverBg: "linear-gradient(135deg, #1e1b4b, #311042)" },
  "3": { title: "A Spell for a Smith", alt: "대장장이의 마법", description: "A blacksmith receives a magical spell that changes his forging forever, charting a path through elemental constellation arrays.", likes: "3.4M", rating: "8.7", chapters: 48, subscribers: "62.2K", views: "3.4M", status: "Ongoing", type: "MANHWA", author: "MagusSmith", artist: "IronArt", tags: ["Fantasy", "Action", "Adventure"], coverBg: "linear-gradient(135deg, #022c22, #064e3b)" },
  "4": { title: "Surviving the Game as a Barbarian", alt: "야만전사로 게임에서 살아남기", description: "Trapped inside a hardcore game as a weak barbarian. In this brutal world of dungeon crawlers, survival is the only option and splits are immutable.", likes: "4.4M", rating: "8.9", chapters: 78, subscribers: "88.0K", views: "4.4M", status: "Ongoing", type: "MANHWA", author: "BarbarianKing", artist: "GigaStudio", tags: ["Fantasy", "Action", "Dungeon", "System"], coverBg: "linear-gradient(135deg, #450a0a, #781c1c)" },
  "5": { title: "Swolemates", icon: "💪", alt: "스월메이트", description: "Working out and finding love in the local community center. A hilarious workout comedy about fitness, splits, and protein shakes.", likes: "7.6M", rating: "9.2", chapters: 88, subscribers: "120K", views: "7.6M", status: "Ongoing", type: "MANHWA", author: "GymTons", artist: "LifterArt", tags: ["Comedy", "Romance", "Slice of Life"], coverBg: "linear-gradient(135deg, #1f2937, #111827)" },
  "6": { title: "Sweet Romance, Spicy Roommates", alt: "달콤한 로맨스, 매콤한 룸메이트", description: "Two roommates with spicy secrets find sweet romance after agreeing on splits and sharing bills under a cozy roof.", likes: "92,054", rating: "8.2", chapters: 24, subscribers: "25.5K", views: "920K", status: "Ongoing", type: "MANHWA", author: "SpiceWriter", artist: "RoommateArt", tags: ["Romance", "Comedy", "Drama"], coverBg: "linear-gradient(135deg, #831843, #db2777)" },
  "7": { title: "Born to be the Grand Duchess", alt: "태생부터 대공녀", description: "Reborn into royalty, she must claim her throne as the grand duchess, navigating waiting lists and premium splits.", likes: "549,934", rating: "8.4", chapters: 52, subscribers: "44.8K", views: "5.4M", status: "Ongoing", type: "MANHWA", author: "DuchessPen", artist: "RoyalArt", tags: ["Romance", "Fantasy", "Drama"], coverBg: "linear-gradient(135deg, #0c4a6e, #0369a1)" },
  "8": { title: "Life of a Demon Hunter", alt: "악마 사냥꾼의 삶", description: "A demon hunter struggles to balance his normal life and the underworld. Action-packed battles, system leveling, and hidden splits.", likes: "25,011", rating: "8.1", chapters: 30, subscribers: "12.0K", views: "250K", status: "Ongoing", type: "MANHWA", author: "HunterJong", artist: "SlashArt", tags: ["Action", "Fantasy", "System"], coverBg: "linear-gradient(135deg, #062f4f, #000000)" },
  "9": { title: "Girlfriend Manual", alt: "여친 설명서", description: "A guide to understanding love, heartbreaks, and relationships. Exploring waiting-for-free schedules and premium chapters.", likes: "2.2M", rating: "8.6", chapters: 64, subscribers: "51.2K", views: "2.2M", status: "Completed", type: "MANHWA", author: "ManualMaker", artist: "LoveArt", tags: ["Romance", "Drama", "Comedy"], coverBg: "linear-gradient(135deg, #581c87, #3b0764)" },
  "10": { title: "Aiming for the Alimony", alt: "위자료를 노려라", description: "A high-stakes divorce turns into an unexpected romance. Navigating splits, payouts, and legal challenges.", likes: "919,423", rating: "8.5", chapters: 45, subscribers: "31.9K", views: "919K", status: "Ongoing", type: "MANHWA", author: "LawyerLover", artist: "CourtArt", tags: ["Romance", "Drama", "Slice of Life"], coverBg: "linear-gradient(135deg, #111827, #1f2937)" },
  "11": { title: "Archmage Curriculum", alt: "대마법사 커리큘럼", description: "Teaching magic to the next generation of visual spellcasters inside a school of elemental arrays.", likes: "61,697", rating: "8.3", chapters: 34, subscribers: "15.4K", views: "610K", status: "Ongoing", type: "MANHWA", author: "MageTeacher", artist: "SpellArt", tags: ["Fantasy", "Action", "School Life"], coverBg: "linear-gradient(135deg, #065f46, #047857)" },
  "12": { title: "My Child Will Have a Different Father", alt: "내 아이는 다른 아버지를 가질 것이다", description: "A mother changes her child's destiny by rewriting the past, avoiding tragic locks and premium wait schedules.", likes: "2.1M", rating: "8.7", chapters: 58, subscribers: "64.0K", views: "2.1M", status: "Ongoing", type: "MANHWA", author: "FatedPath", artist: "MomArt", tags: ["Fantasy", "Drama", "Romance"], coverBg: "linear-gradient(135deg, #451a03, #78350f)" },
  "13": { title: "Being Raised by Villains", alt: "악당들에게 길러지는 중입니다", description: "Reborn as a character destined for a tragic end, she gets adopted by the most notorious villain family. Can she survive and live a peaceful life?", likes: "1.2M", rating: "8.9", chapters: 30, subscribers: "42.1K", views: "1.2M", status: "Ongoing", type: "MANHWA", author: "VillainWriter", artist: "VillainArtist", tags: ["Fantasy", "Comedy", "Drama"], coverBg: "linear-gradient(135deg, #fef08a, #fbcfe8, #f472b6)", isNewSeries: true },
  "14": { title: "Darling, Why Can't We Divorce?", alt: "여보, 왜 이혼은 안 되나요?", description: "She entered the body of a villainess who was married to a cold duke. She tries to divorce him to save her life, but he suddenly refuses!", likes: "890K", rating: "8.6", chapters: 24, subscribers: "28.5K", views: "890K", status: "Ongoing", type: "MANHWA", author: "DivorceLover", artist: "DivorceArt", tags: ["Romance", "Drama", "Fantasy"], coverBg: "linear-gradient(135deg, #1e293b, #334155, #64748b)" },
  "15": { title: "The Holy Power of Modern Medicine", alt: "현대 의학의 신성한 힘", description: "A genius surgeon is reincarnated into a fantasy world where healing magic is rare. Using modern medical knowledge, he starts performing miracles.", likes: "2.1M", rating: "8.8", chapters: 35, subscribers: "68.2K", views: "2.1M", status: "Ongoing", type: "MANHWA", author: "DocMage", artist: "DocArt", tags: ["Fantasy", "Action", "Medical"], coverBg: "linear-gradient(135deg, #e2e8f0, #cbd5e1, #fbbf24)" },
  "16": { title: "Parent-Teacher Conflict", alt: "학부모 교사 갈등", description: "A single father and a dedicated teacher get off on the wrong foot, but their mutual concern for the child begins to bring them closer.", likes: "450K", rating: "8.4", chapters: 20, subscribers: "15.0K", views: "450K", status: "Ongoing", type: "MANHWA", author: "ConflictWriter", artist: "ConflictArt", tags: ["Romance", "Drama", "Slice of Life"], coverBg: "linear-gradient(135deg, #4c0519, #881337, #f43f5e)" },
  "17": { title: "Anna's Tale", alt: "안나의 이야기", description: "Anna's journey to find her missing family leads her through political intrigue, dark secrets, and a forbidden romance in the high society.", likes: "310K", rating: "8.5", chapters: 22, subscribers: "11.2K", views: "310K", status: "Ongoing", type: "MANHWA", author: "AnnaWriter", artist: "AnnaArt", tags: ["Drama", "Romance", "Mystery"], coverBg: "linear-gradient(135deg, #ffedd5, #fdedd5, #fbcfe8)" }
};

export const DEFAULT_SERIES = {
  title: "When My Enemies Weep",
  alt: "적들이 눈물 흘릴 때",
  description: "Given a chance to redo her sad, short life, neglected noble daughter Panora Celsius swears to live only for revenge against all who wronged her... until she meets the cold duke who holds the key to her family's downfall.",
  likes: "3.6K",
  rating: "8.6",
  chapters: 26,
  subscribers: "3.6K",
  views: "77.8K",
  status: "Ongoing",
  type: "MANHWA",
  author: "MAMAKOTO",
  artist: "CelsiusArt",
  tags: ["Action", "Adventure", "Fantasy", "Revenge"],
  coverBg: "linear-gradient(135deg, #0f172a, #1e293b)"
};
