"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { trpc } from "../../../lib/trpc";
import { ContentAccessModal } from "../../../components/ContentAccessModal";
import CommentsSection from "../../../components/CommentsSection";
import RecommendationsSection from "../../../components/RecommendationsSection";
import { 
  ArrowLeft, Star, Heart, Bookmark, Eye, Download, ArrowUpDown, 
  Search, MessageSquare, Info, Mail, Send, ThumbsUp, ThumbsDown, 
  ChevronDown, ChevronUp, Lock, Sparkles, Settings, MoreVertical, 
  BookOpen, User, Maximize2, Minimize2, List, ChevronRight
} from "lucide-react";

import { SERIES_DATA, DEFAULT_SERIES, EPISODE_TITLES } from "@/lib/mockData";

const COMMUNITY_RULES = [
  {
    title: "1. Be Respectful",
    description: "Do not harass, threaten, impersonate, or target other users. Hate speech, racism, sexism, death threats, and abusive profile content are strictly prohibited. Negative opinions about a series are allowed; personal attacks are not."
  },
  {
    title: "2. Keep Comments Clean",
    description: "No pornography, nudity, explicit sexual content, gore, NSFL content, or suggestive bait. Sexualizing minors, including jokes about it, is strictly prohibited."
  },
  {
    title: "3. Stay On Topic",
    description: "Use the comment section to discuss the chapter or series. Do not spam, troll, derail threads, start irrelevant political arguments, spoiler-bait, or try to bypass moderation systems."
  },
  {
    title: "4. Do Not Abuse the Platform",
    description: "No advertising, referral links, begging for money or Premium, mini-modding, or contacting staff through comments or unrelated platforms for moderation issues. Report rule-breaking content instead."
  },
  {
    title: "5. English Only",
    description: "Comments must be in English so they can be reviewed consistently by moderation."
  },
  {
    title: "6. Enforcement",
    description: "We may remove content or restrict accounts for rule violations, including alternate accounts used to evade moderation."
  },
  {
    title: "7. Use Common Sense",
    description: "Not every abusive or disruptive behavior can be listed in advance. Moderators may act on conduct that clearly undermines the comment section, even if it is not covered word-for-word above."
  }
];

export default function ReaderPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params?.id as string;

  // Retrieve query overrides
  const queryTitle = searchParams?.get("title") || "";
  const queryGenre = searchParams?.get("genre") || "";
  const queryChapters = searchParams?.get("chapters") ? parseInt(searchParams.get("chapters")!) : null;
  const queryLikes = searchParams?.get("likes") || "";

  const [currentUser, setCurrentUser] = useState("Guest");
  const [isReading, setIsReading] = useState(true); // Default to Reader View
  const [currentChapter, setCurrentChapter] = useState(2); // Default to Episode 2: Confirmation

  // tRPC queries
  const { data: dbSeries } = trpc.series.getById.useQuery(
    { id: id || "" },
    { enabled: !!id && id.length === 36 }
  );

  const activeChapterData = dbSeries?.chapters?.find((ch: any) => ch.chapterIndex === currentChapter);

  const { data: dbChapter } = trpc.chapter.getChapter.useQuery(
    { chapterId: activeChapterData?.id || "" },
    { enabled: !!activeChapterData?.id }
  );

  const { data: dbComments, refetch: refetchComments } = trpc.chapter.getComments.useQuery(
    { chapterId: activeChapterData?.id || "" },
    { enabled: !!activeChapterData?.id }
  );

  const utils = trpc.useContext();
  const postCommentMutation = trpc.chapter.postComment.useMutation({
    onMutate: async (newComment) => {
      await utils.chapter.getComments.cancel({ chapterId: activeChapterData?.id || "" });
      const previousComments = utils.chapter.getComments.getData({ chapterId: activeChapterData?.id || "" });
      
      if (previousComments) {
        utils.chapter.getComments.setData({ chapterId: activeChapterData?.id || "" }, [
          {
            id: `temp-${Date.now()}`,
            content: newComment.content,
            priorityScore: 0,
            userId: currentUser,
            chapterId: activeChapterData?.id || "",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            user: { id: currentUser, username: currentUser, role: "USER", subscription: "NONE", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as any
          },
          ...previousComments,
        ]);
      }
      return { previousComments };
    },
    onError: (err, newComment, context) => {
      if (context?.previousComments) {
        utils.chapter.getComments.setData({ chapterId: activeChapterData?.id || "" }, context.previousComments);
      }
    },
    onSettled: () => {
      utils.chapter.getComments.invalidate({ chapterId: activeChapterData?.id || "" });
    },
    onSuccess: () => {
      setNewCommentText("");
    },
  });

  const incrementViewMutation = trpc.chapter.incrementView.useMutation();
  const updateReadingProgressMutation = trpc.chapter.updateReadingProgress.useMutation();

  useEffect(() => {
    if (activeChapterData?.id) {
      incrementViewMutation.mutate({ chapterId: activeChapterData.id });
    }
  }, [activeChapterData?.id]);

  useEffect(() => {
    if (!activeChapterData?.id || typeof window === "undefined") return;

    let timeoutId: NodeJS.Timeout;

    const handleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
        const clientHeight = document.documentElement.clientHeight || window.innerHeight;
        
        let progress = (scrollTop / (scrollHeight - clientHeight)) * 100;
        progress = Math.min(100, Math.max(0, Math.round(progress)));
        
        updateReadingProgressMutation.mutate({ 
          chapterId: activeChapterData.id, 
          scrollProgress: progress 
        });
      }, 5000); // debounce to 5 seconds
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(timeoutId);
    };
  }, [activeChapterData?.id]);
  
  const [chapterSearch, setChapterSearch] = useState("");

  // Ad unlock & subscription states
  const [unlockedAdChapters, setUnlockedAdChapters] = useState<Record<number, boolean>>({});
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);
  const [adTimer, setAdTimer] = useState(15);
  const [adCompleted, setAdCompleted] = useState(false);
  const [userSubscription, setUserSubscription] = useState("NONE");

  useEffect(() => {
    const sub = localStorage.getItem("panelva_user_subscription") || "NONE";
    setUserSubscription(sub);
  }, []);

  const hasSubscription = userSubscription === "PREMIUM" || userSubscription === "PLUS";
  const isAdLocked = (String(dbChapter?.tier) === "AD_SUPPORTED" || String(activeChapterData?.tier) === "AD_SUPPORTED" || currentChapter === 3)
                     && !hasSubscription 
                     && !unlockedAdChapters[currentChapter];
  const isPremiumLocked = (String(dbChapter?.tier) === "PREMIUM" || String(activeChapterData?.tier) === "PREMIUM" || currentChapter === 4)
                     && userSubscription !== "PREMIUM";

  const [isAccessModalOpen, setIsAccessModalOpen] = useState(true);

  useEffect(() => {
    setIsAccessModalOpen(true);
  }, [currentChapter]);

  const handleUpgradeSubscription = (tier: "PLUS" | "PREMIUM") => {
    localStorage.setItem("panelva_user_subscription", tier);
    setUserSubscription(tier);
    setIsAccessModalOpen(false);
    alert(`Success! You have upgraded to Panelva ${tier === "PREMIUM" ? "Premium" : "Plus"}.`);
  };

  const handleUnlockWithAds = () => {
    setIsAccessModalOpen(false);
    startRewardedAd();
  };

  const startRewardedAd = () => {
    setIsAdModalOpen(true);
    setAdTimer(15);
    setAdCompleted(false);

    const interval = setInterval(() => {
      setAdTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setAdCompleted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleCloseAdModal = () => {
    if (adCompleted) {
      setUnlockedAdChapters((prev) => ({ ...prev, [currentChapter]: true }));
      // Log unlock to backend Express server
      fetch("http://localhost:3001/api/chapters/unlock-ad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chapterId: activeChapterData?.id || "mock-chapter-id", userId: currentUser })
      }).catch(err => console.error("Ad log unlock failed:", err));
    }
    setIsAdModalOpen(false);
  };
  
  // Custom states for interactive reader overhauls
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isImmersive, setIsImmersive] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  
  // Like simulation states
  const [likesCount, setLikesCount] = useState(436);
  const [hasLiked, setHasLiked] = useState(false);
  const [viewsCount, setViewsCount] = useState("12.2k");
  const [commentsCount, setCommentsCount] = useState(29);
  
  // Simulated verifications
  const [isVerified, setIsVerified] = useState(false);
  const [showRulesNotice, setShowRulesNotice] = useState(true);

  // Panelva Guidelines States
  const [activeAccordionIndex, setActiveAccordionIndex] = useState<number | null>(0);
  const [showWebRulesModal, setShowWebRulesModal] = useState(false);
  const [hasAgreedToRules, setHasAgreedToRules] = useState(false);
  const [shakeRulesBanner, setShakeRulesBanner] = useState(false);
  // Auto-advance continuous scrolling states
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdownValue, setCountdownValue] = useState(3);
  const [countdownActive, setCountdownActive] = useState(false);
  const [isInfiniteScrollEnabled, setIsInfiniteScrollEnabled] = useState(false);
  const justAdvancedRef = useRef(false);

  // Sync infinite scroll settings on mount
  useEffect(() => {
    const saved = localStorage.getItem("panelva_infinite_scroll");
    if (saved !== null) {
      setIsInfiniteScrollEnabled(saved === "true");
    }
  }, []);

  // Set up transitional locking and countdown resets on chapter changes
  useEffect(() => {
    setCountdownActive(false);
    setShowCountdown(false);
    setCountdownValue(3);
    
    justAdvancedRef.current = true;
    const timer = setTimeout(() => {
      justAdvancedRef.current = false;
    }, 800);
    return () => clearTimeout(timer);
  }, [currentChapter]);

  // dropdown states
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  // Ref for scrolling to comments section
  const commentsSectionRef = useRef<HTMLDivElement>(null);

  // comments sorting & posting states
  const [commentSort, setCommentSort] = useState<"best" | "newest" | "oldest">("best");
  const [newCommentText, setNewCommentText] = useState("");
  const [commentsList, setCommentsList] = useState<any[]>([
    {
      id: "c-1",
      author: "Brouhaha",
      isPremium: true,
      text: "I wonder if the people creating these stories ever get tired of writing and drawing and reading the same basic web comics. Over and over and over again.",
      likes: 119,
      dislikes: 2,
      timeAgo: "2d ago",
      avatar: "B",
      replies: [
        {
          id: "cr-1",
          author: "OldManGoryeo",
          isPremium: true,
          text: "End and go back to what? A crappy story with a crappy plot? Honestly the filler is the best part of this story because at least it's boring and not crappy.",
          likes: 45,
          dislikes: 2,
          timeAgo: "2d ago (edited)",
          avatar: "O"
        }
      ],
      showReplies: false
    }
  ]);

  // Load specific metadata
  const getFallbackChapters = (title: string): number => {
    const match = Object.values(SERIES_DATA).find((s: any) => s.title.toLowerCase() === title.toLowerCase());
    return match ? match.chapters : 24;
  };

  const dbSeriesMapped = dbSeries ? {
    title: dbSeries.title,
    alt: dbSeries.title,
    description: dbSeries.description,
    likes: dbSeries.likes >= 1000000 ? (dbSeries.likes / 1000000).toFixed(1).replace(/\.0$/, "") + "M" : dbSeries.likes.toString(),
    rating: "9.0",
    chapters: dbSeries.chapters && dbSeries.chapters.length > 0 
      ? dbSeries.chapters.length 
      : getFallbackChapters(dbSeries.title),
    subscribers: "10K",
    views: dbSeries.views >= 1000 ? `${(dbSeries.views/1000).toFixed(1)}k` : dbSeries.views.toString(),
    status: dbSeries.status === "COMPLETED" ? "Completed" : "Ongoing",
    type: dbSeries.type === "COMIC" ? "MANHWA" : "NOVEL",
    author: dbSeries.creator?.penName || "Unknown Creator",
    artist: "Artist",
    tags: [dbSeries.genre],
    coverBg: dbSeries.coverUrl?.startsWith("http") ? `url(${dbSeries.coverUrl}) center/cover no-repeat` : "linear-gradient(135deg, #0f172a, #1e293b)"
  } : null;

  const seriesData = dbSeriesMapped || SERIES_DATA[id] || DEFAULT_SERIES;
  const series = {
    ...seriesData,
    ...(queryTitle ? { title: queryTitle } : {}),
    ...(queryGenre ? { tags: [queryGenre, ...(seriesData.tags || [])] } : {}),
    ...(queryChapters ? { chapters: queryChapters } : {}),
    ...(queryLikes ? { likes: queryLikes } : {})
  };

  useEffect(() => {
    const user = localStorage.getItem("panelva_user") || "Guest";
    setCurrentUser(user);

    // Sync bookmark status
    try {
      const saved = localStorage.getItem(`panelva_bookmarks_${user}`) || localStorage.getItem("panelva_bookmarks") || "[]";
      const list = JSON.parse(saved);
      setIsBookmarked(list.includes(id));
    } catch (e) {}

    // Initialize immersive mode setting
    const storedImmersive = localStorage.getItem("panelva_reader_immersive") === "true";
    setIsImmersive(storedImmersive);
  }, [id]);

  // Keyboard navigation arrow keys listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore keypress if the user is typing in comments or input boxes
      const activeEl = document.activeElement as HTMLElement | null;
      if (activeEl && (
        activeEl.tagName === "INPUT" || 
        activeEl.tagName === "TEXTAREA" || 
        activeEl.isContentEditable
      )) {
        return;
      }

      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        if (currentChapter < series.chapters) {
          setCurrentChapter(prev => prev + 1);
          window.scrollTo({ top: 0 });
        }
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        if (currentChapter > 1) {
          setCurrentChapter(prev => prev - 1);
          window.scrollTo({ top: 0 });
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentChapter, series.chapters]);

  // Continuous scrolling auto-advance timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdownActive) {
      timer = setInterval(() => {
        setCountdownValue(prev => {
          if (prev <= 1) {
            setCountdownActive(false);
            setShowCountdown(false);
            if (currentChapter < series.chapters) {
              setCurrentChapter(prevCh => prevCh + 1);
              window.scrollTo({ top: 0 });
            }
            return 3;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdownActive, currentChapter, series.chapters]);

  // Scroll position detector for auto-advance
  useEffect(() => {
    const handleScroll = () => {
      if (justAdvancedRef.current) return;
      if (!isInfiniteScrollEnabled) return;
      if (currentChapter >= series.chapters) return; // No next chapter to load

      const threshold = 150; // pixels from bottom of document
      const position = window.innerHeight + window.scrollY;
      const docHeight = document.documentElement.scrollHeight;

      if (docHeight - position < threshold) {
        if (!showCountdown && !countdownActive) {
          setShowCountdown(true);
          setCountdownValue(3);
          setCountdownActive(true);
        }
      } else if (docHeight - position > threshold + 200) {
        // Cancel countdown if scrolled back up
        if (countdownActive) {
          setCountdownActive(false);
          setShowCountdown(false);
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [currentChapter, series.chapters, showCountdown, countdownActive, isInfiniteScrollEnabled]);

  // Update Stats when Chapter changes
  useEffect(() => {
    // Mock changing views/likes for different chapters
    if (currentChapter === 1) {
      setLikesCount(485);
      setViewsCount("14k");
      setCommentsCount(49);
    } else if (currentChapter === 2) {
      setLikesCount(436);
      setViewsCount("12.2k");
      setCommentsCount(29);
    } else {
      setLikesCount(200 + Math.floor(Math.random() * 200));
      setViewsCount(`${(5 + Math.random() * 8).toFixed(1)}k`);
      setCommentsCount(10 + Math.floor(Math.random() * 30));
    }
    setHasLiked(false);
  }, [currentChapter]);

  const handleToggleBookmark = () => {
    try {
      const saved = localStorage.getItem(`panelva_bookmarks_${currentUser}`) || localStorage.getItem("panelva_bookmarks") || "[]";
      let list = JSON.parse(saved);
      let nextState = false;

      if (list.includes(id)) {
        list = list.filter((item: string) => item !== id);
        nextState = false;
      } else {
        list.push(id);
        nextState = true;
      }

      setIsBookmarked(nextState);
      localStorage.setItem(`panelva_bookmarks_${currentUser}`, JSON.stringify(list));
      localStorage.setItem("panelva_bookmarks", JSON.stringify(list));
    } catch (e) {}
  };

  const handleSimulateVerification = () => {
    setIsVerified(true);
    alert("Email verification successful! Token claims and comments unlocked.");
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    // Phase 2 Validation: Enforce guidelines agreement
    if (!hasAgreedToRules) {
      setShowRulesNotice(true); // Reshow if they dismissed it
      setShakeRulesBanner(true);
      setTimeout(() => setShakeRulesBanner(false), 500);
      return;
    }

    if (activeChapterData?.id) {
      postCommentMutation.mutate({
        chapterId: activeChapterData.id,
        content: newCommentText
      });
      return;
    }

    const newComment = {
      id: `c-${Date.now()}`,
      author: currentUser === "Guest" ? "ReaderUser" : currentUser,
      isPremium: true,
      text: newCommentText,
      likes: 0,
      dislikes: 0,
      timeAgo: "Just now",
      avatar: currentUser === "Guest" ? "R" : currentUser.charAt(0).toUpperCase(),
      replies: [],
      showReplies: false
    };

    setCommentsList([newComment, ...commentsList]);
    setCommentsCount(prev => prev + 1);
    setNewCommentText("");
  };

  const commentsFeed = dbComments && dbComments.length > 0
    ? dbComments.map(c => ({
        id: c.id,
        author: c.user?.username || "ReaderUser",
        isPremium: c.priorityScore >= 2,
        role: c.user?.role,
        subscription: c.user?.subscription,
        text: c.content,
        likes: c.priorityScore * 12 + 4,
        dislikes: 0,
        timeAgo: new Date(c.createdAt).toLocaleDateString() === new Date().toLocaleDateString() ? "Just now" : new Date(c.createdAt).toLocaleDateString(),
        avatar: (c.user?.username || "ReaderUser").charAt(0).toUpperCase(),
        replies: [],
        showReplies: false
      }))
    : commentsList.map(c => ({
        ...c,
        role: (c.author === "notjud3" || c.author === "iseniyijude" || c.author === "iseniyijude_gmail") ? "MASTER_ADMIN" : c.author === "TO30" ? "ADMIN" : "USER",
        subscription: c.isPremium ? "PREMIUM" : "NONE",
      }));

  const displayCommentsCount = dbComments && dbComments.length > 0 ? dbComments.length : commentsCount;

  const toggleRepliesVisibility = (commentId: string) => {
    setCommentsList(prev => prev.map(c => c.id === commentId ? { ...c, showReplies: !c.showReplies } : c));
  };

  const handleLikeComment = (commentId: string) => {
    setCommentsList(prev => prev.map(c => c.id === commentId ? { ...c, likes: c.likes + 1 } : c));
  };

  const handleDislikeComment = (commentId: string) => {
    setCommentsList(prev => prev.map(c => c.id === commentId ? { ...c, dislikes: c.dislikes + 1 } : c));
  };

  const toggleImmersiveMode = () => {
    const nextImmersive = !isImmersive;
    setIsImmersive(nextImmersive);
    localStorage.setItem("panelva_reader_immersive", nextImmersive ? "true" : "false");
    window.dispatchEvent(new Event("panelva_immersive_update"));
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleLikeEpisode = () => {
    if (hasLiked) {
      setLikesCount(prev => prev - 1);
      setHasLiked(false);
    } else {
      setLikesCount(prev => prev + 1);
      setHasLiked(true);
    }
  };

  // Generate chapters array based on series.chapters count
  const allChapters = Array.from({ length: series.chapters }, (_, i) => {
    const chNum = i + 1; // 1-indexed for chapters
    const name = EPISODE_TITLES[chNum - 1] || `Chapter Secret ${chNum}`;
    return {
      number: chNum,
      title: `${chNum}. ${name}`,
      date: chNum === series.chapters ? "2 days ago" : chNum === series.chapters - 1 ? "last week" : chNum === series.chapters - 2 ? "2 weeks ago" : "Jun 10, 2026",
      thumbnailBg: `linear-gradient(135deg, ${series.coverBg.split(" ")[2].replace(")", "")}, #111)`
    };
  });

  const filteredChapters = allChapters.filter(ch => ch.title.toLowerCase().includes(chapterSearch.toLowerCase()));

  // ─── READER VIEW SCREEN ───
  if (isReading) {
    return (
      <div className="reader-page" style={{ minHeight: "100vh", backgroundColor: "var(--bg-color)", color: "var(--text-color)", fontFamily: "var(--font-sans)", display: "flex", flexDirection: "column" }}>
        
        {/* Main Workspace: 2 Column Layout matching mockups */}
        <div style={{ display: "flex", flex: 1, width: "100%", position: "relative" }}>
          
          {/* LEFT/CENTER WORKSPACE: Comic panels and comments */}
          <div style={{ 
            flex: 1, 
            display: "flex", 
            flexDirection: "column", 
            alignItems: "center", 
            padding: isImmersive ? "2rem 1rem 120px 1rem" : "2rem 2rem 120px 2rem", 
            boxSizing: "border-box",
            width: "100%",
            transition: "all 0.2s"
          }}>
            
            {/* Episode Title Header inside reading content */}
            <div style={{ width: "100%", maxWidth: "800px", display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "1px solid var(--border-color)", paddingBottom: "1rem", marginBottom: "2rem" }}>
              <h2 style={{ fontSize: "1.75rem", fontWeight: 800, margin: 0 }}>
                {EPISODE_TITLES[currentChapter - 1] ? `${currentChapter}. ${EPISODE_TITLES[currentChapter - 1]}` : `Episode ${currentChapter}`}
              </h2>
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted-color)" }}>Jun 10, 2026</span>
            </div>

            <div style={{ width: "100%", maxWidth: "800px", display: "flex", flexDirection: "column", gap: "1.5rem", marginBottom: "3rem" }}>
              {isAdLocked || isPremiumLocked ? (
                <div style={{
                  padding: "4rem 2rem",
                  borderRadius: "16px",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  background: "rgba(30, 41, 59, 0.3)",
                  backdropFilter: "blur(12px)",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "1.5rem",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
                }}>
                  <div style={{ fontSize: "3.5rem" }}>{isPremiumLocked ? "👑" : "📺"}</div>
                  <h3 style={{ fontSize: "1.6rem", fontWeight: 800, margin: 0, color: "#fff", fontFamily: "var(--font-display)" }}>
                    {isPremiumLocked ? "Episode Locked (Premium Only)" : "Episode Locked (Ad-Supported)"}
                  </h3>
                  <p style={{ color: "#94a3b8", maxWidth: "450px", margin: 0, fontSize: "0.95rem", lineHeight: "1.6" }}>
                    {isPremiumLocked 
                      ? "This chapter is exclusive to Panelva Premium subscribers. Upgrade your subscription to read instantly!" 
                      : "This chapter belongs to the Ad-Unlockable tier. Watch a short rewarded video or go Premium for instant access!"}
                  </p>
                  <button
                    style={{
                      background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                      color: "#fff",
                      border: "none",
                      padding: "12px 28px",
                      borderRadius: "8px",
                      fontSize: "1rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "transform 0.2s, box-shadow 0.2s",
                      boxShadow: "0 4px 14px rgba(124, 58, 237, 0.4)"
                    }}
                    onClick={() => setIsAccessModalOpen(true)}
                  >
                    Unlock Episode
                  </button>
                </div>
              ) : dbChapter?.textContent ? (
                <div style={{
                  fontSize: "1.15rem",
                  lineHeight: "1.85",
                  color: "var(--text-color, #e4e6eb)",
                  maxWidth: "700px",
                  margin: "1.5rem auto",
                  whiteSpace: "pre-wrap",
                  fontFamily: "Georgia, serif",
                  textAlign: "justify",
                  padding: "0 1rem"
                }}>
                  {dbChapter.textContent}
                </div>
              ) : dbChapter?.pages && dbChapter.pages.length > 0 ? (
                dbChapter.pages.map((page: any) => (
                  <div key={page.id} style={{ width: "100%", position: "relative", borderRadius: "12px", overflow: "hidden", border: "1px solid var(--border-color)" }}>
                    <Image src={page.imageUrl} alt={`Page ${page.pageIndex}`} width={800} height={1200} style={{ width: "100%", height: "auto", display: "block" }} />
                  </div>
                ))
              ) : (
                <>
                  {/* Cover panel */}
                  <div style={{ 
                    width: "100%", 
                    height: "500px", 
                    background: `linear-gradient(180deg, ${series.coverBg.split(" ")[2].replace(")", "")}, var(--panel-color))`, 
                    borderRadius: "12px", 
                    border: "1px solid var(--border-color)", 
                    display: "flex", 
                    flexDirection: "column",
                    justifyContent: "center", 
                    alignItems: "center",
                    position: "relative"
                  }}>
                    <div style={{ width: "160px", height: "40px", backgroundColor: "#fff", color: "#000", display: "flex", justifyContent: "center", alignItems: "center", borderRadius: "8px", fontWeight: 900, fontSize: "1rem", boxShadow: "0 4px 10px rgba(0,0,0,0.3)", marginBottom: "1rem" }}>
                      CONTENTS LAB.
                    </div>
                    <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#2563eb", letterSpacing: "0.15em", textTransform: "uppercase" }}>
                      BLUE
                    </div>

                    {/* Subtitle */}
                    <div style={{ position: "absolute", bottom: "20px", color: "rgba(255,255,255,0.4)", fontSize: "0.75rem" }}>
                      MOCKUP ILLUSTRATION &bull; TAPAS ENGINE
                    </div>
                  </div>

                  {/* Panel 1 */}
                  <div style={{ width: "100%", height: "600px", background: "linear-gradient(to bottom, #111827, #020617)", borderRadius: "12px", border: "1px solid var(--border-color)", display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <span style={{ fontSize: "1.2rem", fontWeight: 800, color: "#fff", opacity: 0.8 }}>[ Panel 1: {series.title} Episode {currentChapter} ]</span>
                  </div>

                  {/* Panel 2 */}
                  <div style={{ width: "100%", height: "600px", background: "linear-gradient(to bottom, #020617, #090d16)", borderRadius: "12px", border: "1px solid var(--border-color)", display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <span style={{ fontSize: "1.2rem", fontWeight: 800, color: "#fff", opacity: 0.8 }}>[ Panel 2: Revenge Unfolds ]</span>
                  </div>
                </>
              )}
            </div>

            {/* Countdown Overlay for Continuous Advance */}
            {showCountdown && (
              <div className="glass-panel" style={{
                position: "fixed",
                bottom: "100px",
                left: "50%",
                transform: "translateX(-50%)",
                backgroundColor: "rgba(13, 14, 18, 0.95)",
                border: "1px solid #8b5cf6",
                padding: "1rem 2rem",
                borderRadius: "30px",
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                zIndex: 3000,
                color: "#fff"
              }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#8b5cf6", display: "inline-block" }} className="animate-ping"></span>
                <span style={{ fontSize: "0.95rem", fontWeight: 700 }}>
                  Advancing to Chapter {currentChapter + 1} in <strong style={{ color: "#8b5cf6" }}>{countdownValue}s</strong>...
                </span>
                <button 
                  onClick={() => { setCountdownActive(false); setShowCountdown(false); }}
                  style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "0.8rem", fontWeight: 700, marginLeft: "10px" }}
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Creator signature card under panels */}
            <div style={{ width: "100%", maxWidth: "800px", display: "flex", alignItems: "center", gap: "14px", padding: "1.5rem 0", borderTop: "1px solid var(--border-color)", borderBottom: "1px solid var(--border-color)", marginBottom: "3rem" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "50%", backgroundColor: "var(--border-color)", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "1.2rem", fontWeight: 700 }}>
                {series.author ? series.author.charAt(0).toUpperCase() : "M"}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontWeight: 750, fontSize: "1rem" }}>{series.author || "MAMAKOTO"}</span>
                  <span style={{ fontSize: "0.65rem", background: "#f59e0b", color: "#000", padding: "2px 6px", borderRadius: "4px", fontWeight: 800 }}>
                    Creator
                  </span>
                </div>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted-color)" }}>Thanks for reading! Please support the creators by liking.</span>
              </div>
            </div>

            {/* ─── QUICK COMMENTS SUMMARY BLOCK (MOCKUP 7) ─── */}
            <div style={{ width: "100%", maxWidth: "800px", display: "flex", flexDirection: "column", gap: "1.25rem", marginBottom: "3rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0 }}>
                  Comments ({displayCommentsCount})
                </h3>
                <button 
                  onClick={() => commentsSectionRef.current?.scrollIntoView({ behavior: "smooth" })}
                  style={{ background: "none", border: "none", color: "#2563eb", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer" }}
                >
                  See all
                </button>
              </div>

              {/* Sample Top Comment Card */}
              {commentsFeed.length > 0 && (
                <div className="glass-panel" style={{ padding: "1.25rem", display: "flex", gap: "12px", background: "var(--panel-color)", border: "1px solid var(--border-color)", borderRadius: "12px" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "#e0f2fe", color: "#0284c7", display: "flex", justifyContent: "center", alignItems: "center", fontWeight: 700, fontSize: "0.85rem", flexShrink: 0 }}>
                    {commentsFeed[0].avatar}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontWeight: 750, fontSize: "0.85rem" }}>{commentsFeed[0].author}</span>
                      <span style={{ fontSize: "0.55rem", background: "rgba(37,99,235,0.1)", color: "#2563eb", padding: "2px 6px", borderRadius: "4px", fontWeight: 800 }}>
                        Top comment
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: "0.85rem", lineHeight: 1.4 }}>{commentsFeed[0].text}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--text-muted-color)", fontSize: "0.75rem", marginTop: "4px" }}>
                      <Heart size={12} style={{ fill: "var(--text-muted-color)" }} />
                      <span>{commentsFeed[0].likes}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Add a comment trigger */}
              <button 
                onClick={() => commentsSectionRef.current?.scrollIntoView({ behavior: "smooth" })}
                style={{ width: "100%", background: "none", border: "1px solid var(--border-color)", padding: "12px 1.5rem", borderRadius: "12px", color: "var(--text-muted-color)", fontSize: "0.9rem", textAlign: "left", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                className="hover:border-primary transition"
              >
                <span>Add a comment</span>
                <span>❯</span>
              </button>
            </div>

            {/* ─── RECOMMENDATIONS SYSTEM ─── */}
            <RecommendationsSection seriesId={series.id} />

            {/* ─── FULL COMMENT SYSTEM (MOCKUP 8) ─── */}
            <CommentsSection chapterId={activeChapterData?.id || ""} currentUser={currentUser} />

          </div>

          {/* RIGHT SIDEBAR COLUMN: Series details & Episodes list */}
          {isSidebarOpen && !isImmersive && (
            <aside style={{ 
              width: "340px", 
              borderLeft: "1px solid var(--border-color)", 
              background: "var(--panel-color)", 
              display: "flex", 
              flexDirection: "column", 
              flexShrink: 0,
              boxSizing: "border-box",
              position: "sticky",
              top: "64px",
              height: "calc(100vh - 64px)",
              overflowY: "auto",
              zIndex: 10
            }}>
              
              {/* Cover and details card */}
              <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem", borderBottom: "1px solid var(--border-color)" }}>
                <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                  <div style={{ width: "90px", aspectRatio: "3/4", borderRadius: "8px", background: series.coverBg, flexShrink: 0, boxShadow: "0 4px 10px rgba(0,0,0,0.3)" }} />
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <h4 style={{ fontSize: "1.05rem", fontWeight: 800, margin: 0, lineHeight: 1.3 }}>{series.title}</h4>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted-color)" }}>{series.views} views &bull; {series.subscribers} subs</span>
                  </div>
                </div>

                {/* Login unlock / Account status banner */}
                {currentUser === "Guest" ? (
                  <Link href="/auth" style={{ textDecoration: "none", color: "inherit" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--input-bg)", padding: "10px 12px", borderRadius: "8px", fontSize: "0.8rem", border: "1px solid var(--border-color)", cursor: "pointer" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-muted-color)" }}>
                        <Lock size={12} />
                        <span>Login to unlock free episodes!</span>
                      </div>
                      <ChevronRight size={14} color="var(--text-muted-color)" />
                    </div>
                  </Link>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(16, 185, 129, 0.08)", padding: "10px 12px", borderRadius: "8px", fontSize: "0.8rem", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
                    <span style={{ color: "#10b981", display: "flex", alignItems: "center", gap: "6px", fontWeight: 600 }}>
                      <span style={{ fontSize: "1rem" }}>✓</span> Account Active: {currentUser}
                    </span>
                  </div>
                )}

                <p style={{ margin: 0, fontSize: "0.8rem", lineHeight: 1.5, color: "var(--text-muted-color)" }}>
                  {series.description.length > 140 ? `${series.description.substring(0, 140)}...` : series.description}
                </p>

                <button 
                  onClick={() => alert(`Subscribed to "${series.title}" successfully!`)}
                  style={{ width: "100%", background: "#fff", color: "#000", border: "none", padding: "10px", borderRadius: "8px", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}
                >
                  Subscribe
                </button>
              </div>

              {/* Episodes List Directory */}
              <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.5rem 0.5rem 1.5rem" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 800 }}>{series.chapters} episodes</span>
                  <ArrowUpDown size={14} color="var(--text-muted-color)" style={{ cursor: "pointer" }} />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "1px", padding: "0.5rem" }}>
                  {filteredChapters.map((ch) => {
                    const isActive = ch.number === currentChapter;
                    return (
                      <div 
                        key={ch.number}
                        onClick={() => { setCurrentChapter(ch.number); window.scrollTo({ top: 0 }); }}
                        style={{
                          display: "flex",
                          gap: "12px",
                          padding: "10px",
                          borderRadius: "8px",
                          cursor: "pointer",
                          backgroundColor: isActive ? "rgba(37, 99, 235, 0.1)" : "transparent",
                          border: isActive ? "1px solid rgba(37,99,235,0.2)" : "1px solid transparent",
                          transition: "background-color 0.2s"
                        }}
                        className="hover:bg-primary-alpha"
                      >
                        {/* Chapter Thumbnail */}
                        <div style={{
                          width: "70px",
                          height: "48px",
                          borderRadius: "6px",
                          background: ch.thumbnailBg,
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          fontSize: "0.65rem",
                          fontWeight: "bold",
                          color: "#fff",
                          flexShrink: 0
                        }}>
                          Ep {ch.number}
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: "2px" }}>
                          <span style={{ fontSize: "0.85rem", fontWeight: isActive ? 750 : 600, color: isActive ? "#2563eb" : "inherit" }}>
                            {ch.title}
                          </span>
                          <span style={{ fontSize: "0.7rem", color: "var(--text-muted-color)" }}>
                            Episode {ch.number} &bull; {ch.date}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </aside>
          )}

        </div>

        {/* ─── STICKY BOTTOM BAR (MOCKUP 7/9) ─── */}
        <div style={{ 
          position: "fixed", 
          bottom: 0, 
          left: 0, 
          right: 0, 
          height: "75px", 
          backgroundColor: "#0d0e12", 
          borderTop: "1px solid var(--border-color)", 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          padding: "0 2rem", 
          zIndex: 2000,
          boxShadow: "0 -8px 24px rgba(0,0,0,0.4)"
        }}>
          
          {/* Left: Thumbnail and Chapter Stats */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", width: "300px" }}>
            <div style={{ 
              width: "55px", 
              height: "42px", 
              borderRadius: "4px", 
              background: series.coverBg, 
              display: "flex", 
              justifyContent: "center", 
              alignItems: "center", 
              color: "#fff", 
              fontSize: "0.65rem", 
              fontWeight: "bold",
              flexShrink: 0
            }}>
              Ep {currentChapter}
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
              <span style={{ fontWeight: 800, fontSize: "0.85rem", color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "200px" }}>
                {EPISODE_TITLES[currentChapter - 1] ? `${currentChapter}. ${EPISODE_TITLES[currentChapter - 1]}` : `Chapter ${currentChapter}`}
              </span>
              <span style={{ fontSize: "0.7rem", color: "var(--text-muted-color)" }}>
                {viewsCount} views &bull; {likesCount} likes &bull; {displayCommentsCount} comments
              </span>
            </div>
          </div>

          {/* Right/Center: Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {/* More dots dropdown trigger */}
            <div style={{ position: "relative" }}>
              <button 
                onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                style={{ width: "42px", height: "42px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", background: "none", border: "none", color: "#8a8d98", cursor: "pointer" }}
                className="hover:text-white"
                title="More Options"
              >
                <MoreVertical size={18} />
                <span style={{ fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", marginTop: "2px" }}>More</span>
              </button>

              {isMoreMenuOpen && (
                <div className="glass-panel" style={{
                  position: "absolute",
                  bottom: "calc(100% + 10px)",
                  left: 0,
                  width: "180px",
                  padding: "8px",
                  background: "#0d0e12",
                  border: "1px solid var(--border-color)",
                  borderRadius: "8px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                  zIndex: 2500
                }}>
                  <button 
                    onClick={() => {
                      const nextState = !isInfiniteScrollEnabled;
                      setIsInfiniteScrollEnabled(nextState);
                      localStorage.setItem("panelva_infinite_scroll", nextState ? "true" : "false");
                    }} 
                    style={{ 
                      width: "100%", 
                      padding: "8px", 
                      textAlign: "left", 
                      color: isInfiniteScrollEnabled ? "#10b981" : "#8a8d98", 
                      fontSize: "0.8rem", 
                      background: "none", 
                      border: "none", 
                      cursor: "pointer", 
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between"
                    }}
                  >
                    <span>Infinite Scroll</span>
                    <span style={{ 
                      fontSize: "0.65rem", 
                      padding: "2px 6px", 
                      borderRadius: "10px", 
                      fontWeight: 800,
                      color: isInfiniteScrollEnabled ? "#10b981" : "#8a8d98",
                      backgroundColor: isInfiniteScrollEnabled ? "rgba(16, 185, 129, 0.12)" : "rgba(255,255,255,0.05)" 
                    }}>
                      {isInfiniteScrollEnabled ? "ON" : "OFF"}
                    </span>
                  </button>
                  <div style={{ height: "1px", backgroundColor: "var(--border-color)", margin: "4px 0" }} />
                  <button onClick={() => { setIsMoreMenuOpen(false); alert("Flagged content reported successfully."); }} style={{ width: "100%", padding: "8px", textAlign: "left", color: "#ef4444", fontSize: "0.8rem", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Report Content</button>
                  <button onClick={() => { setIsMoreMenuOpen(false); alert("Downloading chapter for offline reading..."); }} style={{ width: "100%", padding: "8px", textAlign: "left", color: "#fff", fontSize: "0.8rem", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Download Offline</button>
                  <button onClick={() => { setIsMoreMenuOpen(false); alert("Link copied to clipboard!"); }} style={{ width: "100%", padding: "8px", textAlign: "left", color: "#fff", fontSize: "0.8rem", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Share Episode</button>
                </div>
              )}
            </div>

            {/* Like Episode button */}
            <button 
              onClick={handleLikeEpisode}
              style={{ width: "52px", height: "42px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", background: "none", border: "none", color: hasLiked ? "#10b981" : "#8a8d98", cursor: "pointer" }}
              className="hover:text-white"
              title="Like this episode"
            >
              <Heart size={18} style={{ fill: hasLiked ? "#10b981" : "none" }} />
              <span style={{ fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", marginTop: "2px" }}>Like</span>
            </button>

            <div style={{ width: "1px", height: "24px", backgroundColor: "var(--border-color)", margin: "0 8px" }} />

            {/* List toggle sidebar button */}
            <button 
              onClick={toggleSidebar}
              style={{ width: "52px", height: "42px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", background: "none", border: "none", color: isSidebarOpen && !isImmersive ? "#2563eb" : "#8a8d98", cursor: "pointer" }}
              className="hover:text-white"
              title="Toggle Chapters Sidebar"
            >
              <List size={18} />
              <span style={{ fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", marginTop: "2px" }}>List</span>
            </button>

            {/* Scroll to comment trigger */}
            <button 
              onClick={() => commentsSectionRef.current?.scrollIntoView({ behavior: "smooth" })}
              style={{ width: "52px", height: "42px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", background: "none", border: "none", color: "#8a8d98", cursor: "pointer" }}
              className="hover:text-white"
              title="Go to comments feed"
            >
              <MessageSquare size={18} />
              <span style={{ fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", marginTop: "2px" }}>Comment</span>
            </button>

            {/* Previous chapter navigation */}
            <button 
              onClick={() => { if (currentChapter > 1) { setCurrentChapter(currentChapter - 1); window.scrollTo({ top: 0 }); } }}
              disabled={currentChapter === 1}
              style={{ width: "52px", height: "42px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", background: "none", border: "none", color: currentChapter === 1 ? "rgba(255,255,255,0.1)" : "#8a8d98", cursor: currentChapter === 1 ? "not-allowed" : "pointer" }}
              className="hover:text-white"
              title="Previous Chapter"
            >
              <ChevronUp size={18} />
              <span style={{ fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", marginTop: "2px" }}>Prev</span>
            </button>

            {/* Next chapter navigation */}
            <button 
              onClick={() => { if (currentChapter < series.chapters) { setCurrentChapter(currentChapter + 1); window.scrollTo({ top: 0 }); } }}
              disabled={currentChapter === series.chapters}
              style={{ width: "52px", height: "42px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", background: "none", border: "none", color: currentChapter === series.chapters ? "rgba(255,255,255,0.1)" : "#8a8d98", cursor: currentChapter === series.chapters ? "not-allowed" : "pointer" }}
              className="hover:text-white"
              title="Next Chapter"
            >
              <ChevronDown size={18} />
              <span style={{ fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", marginTop: "2px" }}>Next</span>
            </button>

            {/* Full Screen Immersive Mode toggle */}
            <button 
              onClick={toggleImmersiveMode}
              style={{ width: "52px", height: "42px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", background: "none", border: "none", color: isImmersive ? "#2563eb" : "#8a8d98", cursor: "pointer" }}
              className="hover:text-white"
              title="Toggle Full Immersive View"
            >
              {isImmersive ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              <span style={{ fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", marginTop: "2px" }}>Full</span>
            </button>
          </div>

        </div>

      </div>
    );
  }

  // ─── SERIES DETAILS VIEW SCREEN (Alternative) ───
  return (
    <div className="reader-page" style={{ minHeight: "100vh", backgroundColor: "#08090c", color: "#e4e6eb", fontFamily: "var(--font-sans)", padding: "3rem 2rem" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 2fr", gap: "3rem" }}>
        
        {/* LEFT COLUMN: Cover & Stats */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Back link */}
          <button 
            onClick={() => router.back()} 
            style={{ color: "var(--text-muted-color)", display: "flex", alignItems: "center", gap: "6px", textDecoration: "none", fontSize: "0.9rem", fontWeight: 600, background: "none", border: "none", cursor: "pointer", width: "fit-content" }}
            className="hover:text-white transition"
          >
            <span>←</span> Back
          </button>

          {/* Large Cover Image */}
          <div style={{
            width: "100%",
            aspectRatio: "3/4",
            borderRadius: "16px",
            background: series.coverBg,
            border: "1px solid var(--border-color)",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            overflow: "hidden"
          }}>
            <div style={{ padding: "2rem", textAlign: "center", fontWeight: 800, fontSize: "1.6rem", color: "#fff", textShadow: "0 2px 4px rgba(0,0,0,0.8)" }}>
              {series.title}
            </div>
          </div>

          {/* Rating button */}
          <button 
            onClick={() => alert(`This series has a general rating score of ${series.rating}/10.`)}
            style={{ width: "100%", background: "var(--panel-color)", border: "1px solid var(--border-color)", color: "#fff", padding: "12px", borderRadius: "10px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
          >
            <Star size={16} color="#f59e0b" style={{ fill: "#f59e0b" }} /> Rating
          </button>

          {/* Stats details card */}
          <div className="glass-panel" style={{ padding: "1.25rem", background: "var(--panel-color)", border: "1px solid var(--border-color)", borderRadius: "12px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", textAlign: "center", gap: "10px" }}>
            <div>
              <div style={{ fontSize: "1.2rem", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", gap: "3px" }}>
                <Star size={14} color="#f59e0b" style={{ fill: "#f59e0b" }} /> {series.rating}
              </div>
              <span style={{ fontSize: "0.7rem", color: "var(--text-muted-color)", textTransform: "uppercase" }}>Rating</span>
            </div>
            
            <div>
              <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", gap: "3px" }}>
                <BookOpen size={14} /> {series.chapters}
              </div>
              <span style={{ fontSize: "0.7rem", color: "var(--text-muted-color)", textTransform: "uppercase" }}>Chapters</span>
            </div>

            <div>
              <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", gap: "3px" }}>
                <Bookmark size={14} /> {isBookmarked ? "18.1K" : series.bookmarks}
              </div>
              <span style={{ fontSize: "0.7rem", color: "var(--text-muted-color)", textTransform: "uppercase" }}>Bookmarks</span>
            </div>
          </div>

          {/* Status & Type */}
          <div className="glass-panel" style={{ padding: "1.25rem", background: "var(--panel-color)", border: "1px solid var(--border-color)", borderRadius: "12px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <span style={{ fontSize: "0.7rem", color: "var(--text-muted-color)", display: "block" }}>Status</span>
              <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "#fff", display: "inline-flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#8b5cf6", display: "inline-block" }}></span>
                {series.status}
              </span>
            </div>
            <div>
              <span style={{ fontSize: "0.7rem", color: "var(--text-muted-color)", display: "block" }}>Type</span>
              <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "#fff", display: "inline-flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#8b5cf6", display: "inline-block" }}></span>
                {series.type}
              </span>
            </div>
          </div>

          {/* Author & Artist */}
          <div className="glass-panel" style={{ padding: "1.25rem", background: "var(--panel-color)", border: "1px solid var(--border-color)", borderRadius: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.02)", paddingBottom: "6px" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted-color)", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <User size={14} /> Author
              </span>
              <strong style={{ fontSize: "0.9rem", color: "#fff" }}>{series.author}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted-color)", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <Eye size={14} /> Artist
              </span>
              <strong style={{ fontSize: "0.9rem", color: "#fff" }}>{series.artist}</strong>
            </div>
          </div>

          {/* Tags */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {series.tags.map((tag: string, idx: number) => (
              <span key={idx} style={{ background: "var(--panel-color)", border: "1px solid var(--border-color)", padding: "4px 12px", borderRadius: "20px", fontSize: "0.75rem", color: "#d1d5db" }}>
                {tag}
              </span>
            ))}
          </div>

        </div>

        {/* RIGHT COLUMN: Synopsis & Chapters */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
          
          {/* Main detail card (mockup 7) */}
          <div className="glass-panel" style={{ padding: "2rem", background: "var(--panel-color)", border: "1px solid var(--border-color)", borderRadius: "16px", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2.5rem", fontWeight: 800, margin: 0, color: "#fff" }}>{series.title}</h1>
              <span style={{ fontSize: "0.9rem", color: "var(--text-muted-color)", display: "block", marginTop: "4px" }}>{series.alt}</span>
            </div>

            <p style={{ color: "#d1d5db", margin: 0, fontSize: "0.95rem", lineHeight: 1.6 }}>{series.description}</p>
            
            {/* Primary CTA buttons row */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginTop: "1rem" }}>
              {/* Bookmark Toggle */}
              <button 
                onClick={handleToggleBookmark}
                style={{
                  background: isBookmarked ? "rgba(37,99,235,0.1)" : "none",
                  border: isBookmarked ? "1px solid #2563eb" : "1px solid var(--border-color)",
                  color: isBookmarked ? "#2563eb" : "#fff",
                  padding: "12px 24px",
                  borderRadius: "10px",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}
              >
                <Bookmark size={16} style={{ fill: isBookmarked ? "#2563eb" : "none" }} />
                {isBookmarked ? "Bookmarked" : "Bookmark"}
              </button>

              {/* Start reading button */}
              <button 
                onClick={() => setIsReading(true)}
                style={{
                  background: "linear-gradient(135deg, #2563eb, #7c3aed)",
                  border: "none",
                  color: "#fff",
                  padding: "12px 28px",
                  borderRadius: "10px",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  cursor: "pointer",
                  boxShadow: "0 6px 20px rgba(37, 99, 235, 0.25)"
                }}
              >
                First Chapter
              </button>

              {/* Download button */}
              <button 
                onClick={() => alert("Mock offline download triggered. Check download manager status.")}
                style={{
                  background: "none",
                  border: "1px solid var(--border-color)",
                  color: "#fff",
                  padding: "12px 24px",
                  borderRadius: "10px",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}
              >
                <Download size={16} /> Download Offline
              </button>
            </div>
          </div>

          {/* Chapters directory */}
          <div className="glass-panel" style={{ padding: "2rem", background: "var(--panel-color)", border: "1px solid var(--border-color)", borderRadius: "16px", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
              <h3 style={{ fontSize: "1.4rem", fontWeight: 800, margin: 0, color: "#fff" }}>Chapters Directory</h3>
              
              {/* Search bar input filter */}
              <div style={{ position: "relative", width: "240px" }}>
                <input 
                  type="text" 
                  placeholder="Search chapters..."
                  value={chapterSearch}
                  onChange={(e) => setChapterSearch(e.target.value)}
                  style={{
                    width: "100%",
                    background: "var(--input-bg)",
                    border: "1px solid var(--border-color)",
                    padding: "8px 36px 8px 12px",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "0.85rem",
                    outline: "none"
                  }}
                />
                <Search size={14} color="var(--text-muted-color)" style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)" }} />
              </div>
            </div>

            {/* List mapping */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "400px", overflowY: "auto", paddingRight: "6px" }}>
              {filteredChapters.map((ch) => (
                <div 
                  key={ch.number}
                  onClick={() => { setCurrentChapter(ch.number); setIsReading(true); }}
                  className="interactive-card"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "1rem 1.25rem",
                    cursor: "pointer"
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <strong style={{ fontSize: "0.95rem", color: "#fff" }}>{ch.title}</strong>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted-color)" }}>Released {ch.date}</span>
                  </div>
                  <ChevronRight size={16} color="var(--text-muted-color)" />
                </div>
              ))}

              {filteredChapters.length === 0 && (
                <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-muted-color)", border: "1px dashed var(--border-color)", borderRadius: "12px" }}>
                  No chapters matched your search query.
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Rewarded Video Ad Modal */}
      {isAdModalOpen && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: "rgba(10, 10, 12, 0.95)",
          backdropFilter: "blur(20px)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 99999,
          padding: "1rem"
        }}>
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          ` }} />
          <div style={{
            background: "#1c1c1e",
            border: "1px solid #2c2c2e",
            borderRadius: "16px",
            width: "100%",
            maxWidth: "500px",
            padding: "2rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1.5rem",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)"
          }}>
            <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #2c2c2e", paddingBottom: "10px" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#3498db" }}>
                📺 Sponsor Advertisement
              </span>
              {!adCompleted && (
                <span style={{ fontSize: "0.85rem", color: "#8e8e93", background: "rgba(255,255,255,0.08)", padding: "4px 8px", borderRadius: "12px", fontWeight: 600 }}>
                  {adTimer}s remaining
                </span>
              )}
            </div>

            {/* Video Player Canvas */}
            <div style={{
              width: "100%",
              height: "220px",
              background: "#000",
              borderRadius: "12px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              position: "relative",
              overflow: "hidden"
            }}>
              {!adCompleted ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                  <div style={{
                    width: "45px",
                    height: "45px",
                    border: "4px solid rgba(52, 152, 219, 0.2)",
                    borderTop: "4px solid #3498db",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite"
                  }} />
                  <span style={{ fontSize: "0.85rem", color: "#8e8e93" }}>
                    Streaming Rewarded Video...
                  </span>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "3rem" }}>✅</span>
                  <span style={{ fontSize: "1rem", color: "#34c759", fontWeight: 700 }}>
                    Reward Granted!
                  </span>
                </div>
              )}
              {/* Playback progress bar */}
              <div style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                height: "6px",
                background: adCompleted ? "#34c759" : "#3498db",
                width: `${((15 - adTimer) / 15) * 100}%`,
                transition: "width 1s linear"
              }} />
            </div>

            <div style={{ textAlign: "center" }}>
              <h4 style={{ margin: "0 0 8px 0", fontSize: "1.1rem", color: "#fff", fontWeight: 700 }}>
                {adCompleted ? "Reward unlocked successfully!" : "Earn Early-Access Reward"}
              </h4>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "#8e8e93", lineHeight: "1.4" }}>
                {adCompleted 
                  ? "You can now read this exclusive Ad-Unlockable episode." 
                  : "Please watch the video clip completely to unlock the full chapter."}
              </p>
            </div>

            <button
              onClick={handleCloseAdModal}
              disabled={!adCompleted}
              style={{
                width: "100%",
                background: adCompleted ? "#34c759" : "#2c2c2e",
                color: adCompleted ? "#fff" : "#8e8e93",
                border: "none",
                padding: "12px",
                borderRadius: "8px",
                fontSize: "1rem",
                fontWeight: 700,
                cursor: adCompleted ? "pointer" : "not-allowed",
                transition: "background 0.2s"
              }}
            >
              {adCompleted ? "Start Reading" : "Please Wait..."}
            </button>
          </div>
        </div>
      )}

      {/* Reusable Content Access Modal */}
      <ContentAccessModal
        isOpen={isAccessModalOpen && (isAdLocked || isPremiumLocked)}
        onClose={() => setIsAccessModalOpen(false)}
        accessType={isPremiumLocked ? "PREMIUM" : "AD_SUPPORTED"}
        seriesTitle={series?.title || "Series"}
        chapterTitle={EPISODE_TITLES[currentChapter - 1] ? `${currentChapter}. ${EPISODE_TITLES[currentChapter - 1]}` : `Episode ${currentChapter}`}
        onUnlockWithAds={handleUnlockWithAds}
        onUpgradeSubscription={handleUpgradeSubscription}
      />
    </div>
  );
}
