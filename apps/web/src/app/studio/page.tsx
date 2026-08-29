"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../components/AuthContext";
import { 
  LayoutDashboard, BookOpen, Heart, Gift, DollarSign, Target, 
  BarChart3, Users, Flame, Bell, ShieldAlert, Settings, Plus, 
  Trash2, Edit, Eye, Compass, HelpCircle, CheckCircle2, Wallet, 
  Calendar, ChevronRight, Unlock, Lock, RefreshCw, Send, Sparkles, Check, X, Pin
} from "lucide-react";
import { trpc } from "../../lib/trpc";
import { cn } from "@/lib/utils";
import { isAdminRole, isCreatorRole } from "../../lib/roleUtils";
import { WorkspaceLayout, WorkspaceNavGroup } from "../../components/workspace/WorkspaceLayout";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";

type TabType = 
  | "overview" 
  | "comics" 
  | "access_simulator"
  | "memberships" 
  | "gifts" 
  | "tips" 
  | "goals" 
  | "analytics" 
  | "revenue" 
  | "creator_hub"
  | "audience" 
  | "supporters" 
  | "exclusive" 
  | "notifications" 
  | "payouts" 
  | "settings";

export default function CreatorStudioPage() {
  const router = useRouter();
  const { user, role: activeRole, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const currentUser = user?.username || "Guest";

  // RBAC Access Guard: Admins are redirected to /admin, non-creators to /creator/apply
  useEffect(() => {
    if (!isLoading) {
      if (!user || currentUser === "Guest") {
        router.replace("/auth?next=/studio");
      } else if (isAdminRole(activeRole)) {
        router.replace("/admin");
      } else if (!isCreatorRole(activeRole)) {
        router.replace("/creator/apply");
      }
    }
  }, [isLoading, user, activeRole, currentUser, router]);

  // DB TRPC hooks
  const { data: creatorProgress, refetch: refetchProgress } = trpc.creator.getCreatorProgress.useQuery();
  const { data: dbTiers, refetch: refetchTiers } = trpc.creator.getMembershipTiers.useQuery();
  const { data: dbGoals, refetch: refetchGoals } = trpc.creator.getCreatorGoals.useQuery();
  const { data: dbNotifications, refetch: refetchNotifications } = trpc.creator.getCreatorNotifications.useQuery();
  const { data: analyticsData } = trpc.creator.getAnalytics.useQuery({ days: 30 });
  const { data: membershipAnalytics } = trpc.creator.getMembershipAnalytics.useQuery();
  const { data: giftsAnalytics } = trpc.creator.getGiftsAnalytics.useQuery();
  const { data: audienceInsights } = trpc.creator.getAudienceInsights.useQuery();
  const { data: supporters } = trpc.creator.getSupporters.useQuery();
  const { data: payoutDetails } = trpc.creator.getPayoutDetails.useQuery();
  const { data: seriesList, refetch: refetchSeries } = trpc.series.getCreatorSeries.useQuery();
  const { data: revenueBreakdown } = (trpc.creator.getRevenueBreakdown as any).useQuery(undefined, { enabled: activeTab === "revenue" });

  // Creator Hub tRPC hooks
  const { data: postsList, refetch: refetchPosts } = (trpc.post.getCreatorPosts as any).useQuery(undefined, { enabled: activeTab === "creator_hub" });
  const { data: postAnalytics } = (trpc.post.getPostAnalytics as any).useQuery(undefined, { enabled: activeTab === "creator_hub" });

  const createPostMutation = trpc.post.createPost.useMutation({
    onSuccess: () => {
      refetchPosts();
      resetPostComposer();
    }
  });

  const updatePostMutation = trpc.post.updatePost.useMutation({
    onSuccess: () => {
      refetchPosts();
      resetPostComposer();
    }
  });

  const deletePostMutation = trpc.post.deletePost.useMutation({
    onSuccess: () => refetchPosts()
  });

  const togglePinPostMutation = trpc.post.togglePinPost.useMutation({
    onSuccess: () => refetchPosts()
  });

  const resetPostComposer = () => {
    setShowComposer(false);
    setEditingPostId(null);
    setPostTitle("");
    setPostContent("");
    setPostType("TEXT");
    setPostVisibility("PUBLIC");
    setPostAllowedTierId("");
    setPostMediaUrls([]);
    setNewMediaUrl("");
    setPostPollOptions(["", ""]);
    setPostStatus("PUBLISHED");
    setPostScheduledFor("");
  };

  // Mutations
  const createSeriesMutation = trpc.creator.createSeries.useMutation({
    onSuccess: () => {
      refetchSeries();
      setShowCreateSeriesModal(false);
      setNewSeriesTitle("");
      setNewSeriesDescription("");
      setNewSeriesCoverUrl("");
      setNewSeriesType("COMIC");
      setCollaborators([]);
      alert("Series created successfully!");
    },
    onError: (err: any) => {
      alert(err.message || "Failed to create series.");
    }
  });

  const createTierMutation = trpc.creator.createMembershipTier.useMutation({ onSuccess: () => { refetchTiers(); setShowNewTierModal(false); } });
  const editTierMutation = trpc.creator.editMembershipTier.useMutation({ onSuccess: () => { refetchTiers(); setShowEditTierModal(false); } });
  const deleteTierMutation = trpc.creator.deleteMembershipTier.useMutation({ onSuccess: () => { refetchTiers(); } });
  const createGoalMutation = trpc.creator.createCreatorGoal.useMutation({ onSuccess: () => { refetchGoals(); setShowNewGoalModal(false); } });
  const deleteGoalMutation = trpc.creator.deleteCreatorGoal.useMutation({ onSuccess: () => { refetchGoals(); } });
  const applyMonetizationMutation = trpc.creator.applyForMonetization.useMutation({ onSuccess: () => { refetchProgress(); } });
  const applyVerificationMutation = trpc.creator.applyForVerification.useMutation({ onSuccess: () => { refetchProgress(); } });
  const markReadMutation = trpc.creator.markNotificationRead.useMutation({ onSuccess: () => { refetchNotifications(); } });

  const updateStatusMutation = trpc.series.updateStatus.useMutation({
    onSuccess: () => {
      refetchSeries();
      setShowStatusModal(false);
      alert("Series status updated successfully! Followers have been notified.");
    },
    onError: (err: any) => {
      alert(err.message || "Failed to update series status.");
    },
  });

  // Status Management states
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedSeriesForStatus, setSelectedSeriesForStatus] = useState<any>(null);
  const [newSeriesStatus, setNewSeriesStatus] = useState<"ONGOING" | "COMING_SOON" | "SEASON_ENDED" | "HIATUS" | "NEW_SEASON_COMING">("ONGOING");
  const [statusAnnouncement, setStatusAnnouncement] = useState("");
  const [statusSeasonNum, setStatusSeasonNum] = useState<number>(1);
  const [scheduleStatusChange, setScheduleStatusChange] = useState(false);
  const [scheduledStatusDate, setScheduledStatusDate] = useState("");

  const handleOpenStatusModal = (series: any) => {
    setSelectedSeriesForStatus(series);
    setNewSeriesStatus(series.status || "ONGOING");
    setStatusAnnouncement(series.statusMessage || "");
    setStatusSeasonNum(1);
    setScheduleStatusChange(false);
    setScheduledStatusDate("");
    setShowStatusModal(true);
  };

  const getStatusBadgeConfig = (status: string) => {
    switch (status?.toUpperCase()) {
      case "ONGOING":
        return { label: "Ongoing", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", dot: "#10b981", desc: "Active and regularly releasing new chapters" };
      case "COMING_SOON":
        return { label: "Coming Soon", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", dot: "#3b82f6", desc: "Announced or preparing for initial launch" };
      case "HIATUS":
        return { label: "Hiatus", color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20", dot: "#f97316", desc: "Temporary production pause / creator rest" };
      case "SEASON_ENDED":
        return { label: "Season Ended", color: "text-gray-400", bg: "bg-gray-500/10", border: "border-gray-500/20", dot: "#6b7280", desc: "Current season completed" };
      case "NEW_SEASON_COMING":
        return { label: "New Season Coming", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20", dot: "#a855f7", desc: "Returning with a brand new season soon" };
      default:
        return { label: status || "Ongoing", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", dot: "#10b981", desc: "Active series" };
    }
  };

  // Local form states
  const [showNewTierModal, setShowNewTierModal] = useState(false);
  const [showEditTierModal, setShowEditTierModal] = useState(false);
  const [showNewGoalModal, setShowNewGoalModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState<any>(null);

  // New Series form states
  const [showCreateSeriesModal, setShowCreateSeriesModal] = useState(false);
  const [showLinkedModal, setShowLinkedModal] = useState(false);
  const [selectedSeriesForLinking, setSelectedSeriesForLinking] = useState<any>(null);
  const [newSeriesTitle, setNewSeriesTitle] = useState("");
  const [newSeriesDescription, setNewSeriesDescription] = useState("");
  const [newSeriesCoverUrl, setNewSeriesCoverUrl] = useState("");
  const [newSeriesType, setNewSeriesType] = useState<"COMIC" | "NOVEL">("COMIC");
  const [collaborators, setCollaborators] = useState<{ userId: string; shareRatio: number; roleDescription: string }[]>([]);
  const [newCollabUserId, setNewCollabUserId] = useState("");
  const [newCollabRatio, setNewCollabRatio] = useState<number>(0);
  const [newCollabRole, setNewCollabRole] = useState("");
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  const linkSeriesMutation = trpc.creator.linkSeries.useMutation({
    onSuccess: () => {
      refetchSeries();
      setShowLinkedModal(false);
      alert("Series versions successfully linked! Readers can now switch formats on the Series Information page.");
    },
    onError: (err: any) => alert(err.message || "Failed to link series.")
  });

  const unlinkSeriesMutation = trpc.creator.unlinkSeries.useMutation({
    onSuccess: () => {
      refetchSeries();
      setShowLinkedModal(false);
      alert("Series relationship unlinked.");
    },
    onError: (err: any) => alert(err.message || "Failed to unlink series.")
  });

  // New Tier form
  const [tierName, setTierName] = useState("");
  const [tierDesc, setTierDesc] = useState("");
  const [tierPriceUsd, setTierPriceUsd] = useState(4.99);
  const [tierPriceCoins, setTierPriceCoins] = useState(500);
  const [tierColor, setTierColor] = useState("#2563eb");
  const [tierBenefits, setTierBenefits] = useState<string[]>([]);
  const [newBenefitText, setNewBenefitText] = useState("");
  const [isFeaturedTier, setIsFeaturedTier] = useState(false);

  // New Goal form
  const [goalTitle, setGoalTitle] = useState("");
  const [goalDesc, setGoalDesc] = useState("");
  const [goalType, setGoalType] = useState("MEMBER");
  const [goalTarget, setGoalTarget] = useState(100);
  const [goalReward, setGoalReward] = useState("");

  // Onboarding forms
  const [govId, setGovId] = useState("");
  const [bizCert, setBizCert] = useState("");

  // Release Simulator
  const [simulatorChapters, setSimulatorChapters] = useState(12);
  const { data: simulatorTimeline } = trpc.chapter.getReleaseSimulatorTimeline.useQuery({ newChapterCount: simulatorChapters });

  // Access Simulator Debugger states
  const [debugReaderSub, setDebugReaderSub] = useState<"NONE" | "PLUS" | "PREMIUM">("NONE");
  const [debugReaderCoins, setDebugReaderCoins] = useState(100);
  const [debugChapterTier, setDebugChapterTier] = useState<"FREE" | "AD_SUPPORTED" | "PREMIUM">("PREMIUM");
  const [debugChapterPrice, setDebugChapterPrice] = useState(10);
  const [debugChapterWaitDays, setDebugChapterWaitDays] = useState(7);
  const [debugResult, setDebugResult] = useState<{ allowed: boolean; trace: string[] } | null>(null);

  const handleDebugAccess = () => {
    const trace: string[] = [];
    let allowed = false;

    trace.push(`Checking access for reader with subscription: ${debugReaderSub}, coins: ${debugReaderCoins}`);
    trace.push(`Target chapter tier: ${debugChapterTier}, price: ${debugChapterPrice} coins, wait days: ${debugChapterWaitDays}`);

    if (debugChapterTier === "FREE") {
      allowed = true;
      trace.push(`✅ ACCESS GRANTED: Chapter is FREE for all users.`);
    } else if (debugChapterTier === "AD_SUPPORTED") {
      if (debugReaderSub === "PLUS" || debugReaderSub === "PREMIUM") {
        allowed = true;
        trace.push(`✅ ACCESS GRANTED: Reader has an active ${debugReaderSub} subscription which overrides all Ad-Supported locks.`);
      } else {
        allowed = true;
        trace.push(`ℹ️ ACCESS CONDITIONED: Reader must watch a rewarded ad to unlock, or upgrade to PLUS/PREMIUM.`);
      }
    } else if (debugChapterTier === "PREMIUM") {
      if (debugReaderSub === "PREMIUM") {
        allowed = true;
        trace.push(`✅ ACCESS GRANTED: Reader has a PREMIUM subscription which overrides early-access drop countdowns.`);
      } else {
        trace.push(`❌ ACCESS BLOCKED: Chapter is in Early-Access PREMIUM tier. Reader must wait ${debugChapterWaitDays} days or unlock with coins.`);
        if (debugReaderCoins >= debugChapterPrice) {
          allowed = true;
          trace.push(`✅ ACCESS GRANTED (COIN UNLOCK): Reader can unlock this chapter instantly for ${debugChapterPrice} coins (Remaining wallet: ${debugReaderCoins - debugChapterPrice} coins).`);
        } else {
          trace.push(`❌ ACCESS BLOCKED: Insufficient coins. Reader needs ${debugChapterPrice} coins but only has ${debugReaderCoins} coins. Wallet recharge required.`);
        }
      }
    }

    setDebugResult({ allowed, trace });
  };

  // Verification request form state
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  // Creator Hub post composer states
  const [showComposer, setShowComposer] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");
  const [postType, setPostType] = useState("TEXT");
  const [postVisibility, setPostVisibility] = useState("PUBLIC");
  const [postAllowedTierId, setPostAllowedTierId] = useState<string>("");
  const [postMediaUrls, setPostMediaUrls] = useState<string[]>([]);
  const [newMediaUrl, setNewMediaUrl] = useState("");
  const [postPollOptions, setPostPollOptions] = useState<string[]>(["", ""]);
  const [postStatus, setPostStatus] = useState("PUBLISHED");
  const [postScheduledFor, setPostScheduledFor] = useState<string>("");
  const [postSubFilter, setPostSubFilter] = useState<string>("ALL");

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth");
    }
  }, [user, isLoading, router]);

  const handleAddCollaborator = () => {
    if (!newCollabUserId.trim()) return;
    if (newCollabRatio <= 0 || newCollabRatio > 100) {
      alert("Split ratio must be between 1% and 100%");
      return;
    }
    setCollaborators([
      ...collaborators,
      { userId: newCollabUserId.trim(), shareRatio: newCollabRatio, roleDescription: newCollabRole.trim() }
    ]);
    setNewCollabUserId("");
    setNewCollabRatio(0);
    setNewCollabRole("");
  };

  const handleRemoveCollaborator = (index: number) => {
    setCollaborators(collaborators.filter((_, idx) => idx !== index));
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingCover(true);
    try {
      const chunkSize = 1024 * 1024;
      const totalChunks = Math.ceil(file.size / chunkSize);
      const filename = `${Date.now()}_${file.name}`;
      
      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * chunkSize;
        const end = Math.min(file.size, start + chunkSize);
        const chunk = file.slice(start, end);
        
        const formData = new FormData();
        formData.append("chunk", chunk);
        formData.append("filename", filename);
        formData.append("chunkIndex", chunkIndex.toString());
        formData.append("totalChunks", totalChunks.toString());
        
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData
        });
        
        if (!res.ok) throw new Error("Cover upload chunk failed");
        const data = await res.json();
        
        if (chunkIndex === totalChunks - 1 && data.url) {
          setNewSeriesCoverUrl(data.url);
          alert("Cover image uploaded successfully!");
        }
      }
    } catch (err: any) {
      alert(`Cover upload failed: ${err.message}`);
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleCreateSeriesSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSeriesTitle.trim()) {
      alert("Series title is required");
      return;
    }
    if (!newSeriesCoverUrl) {
      alert("Cover image is required");
      return;
    }

    const totalCollabRatio = collaborators.reduce((acc, c) => acc + c.shareRatio, 0);
    const creatorRatio = 100 - totalCollabRatio;

    if (creatorRatio < 0 || creatorRatio > 100) {
      alert("Collaborator splits must sum to exactly 100%. Please adjust collaborator shares.");
      return;
    }

    const payloadCollaborators = [
      { userId: user?.id || "", shareRatio: creatorRatio, roleDescription: "Lead Creator" },
      ...collaborators
    ];

    createSeriesMutation.mutate({
      title: newSeriesTitle.trim(),
      description: newSeriesDescription.trim(),
      coverUrl: newSeriesCoverUrl,
      type: newSeriesType,
      collaborators: payloadCollaborators
    });
  };

  const handleAddBenefit = () => {
    if (newBenefitText.trim()) {
      setTierBenefits([...tierBenefits, newBenefitText.trim()]);
      setNewBenefitText("");
    }
  };

  const handleRemoveBenefit = (index: number) => {
    setTierBenefits(tierBenefits.filter((_, i) => i !== index));
  };

  const handleCreateTier = () => {
    createTierMutation.mutate({
      name: tierName,
      description: tierDesc,
      priceUsd: Number(tierPriceUsd),
      priceCoins: Number(tierPriceCoins),
      colorTheme: tierColor,
      benefits: tierBenefits,
      isFeatured: isFeaturedTier
    });
  };

  const handleOpenEditTier = (tier: any) => {
    setSelectedTier(tier);
    setTierName(tier.name);
    setTierDesc(tier.description);
    setTierPriceUsd(tier.priceUsd);
    setTierPriceCoins(tier.priceCoins);
    setTierColor(tier.colorTheme);
    setTierBenefits(tier.benefits || []);
    setIsFeaturedTier(tier.isFeatured);
    setShowEditTierModal(true);
  };

  const handleEditTier = () => {
    if (!selectedTier) return;
    editTierMutation.mutate({
      id: selectedTier.id,
      name: tierName,
      description: tierDesc,
      priceUsd: Number(tierPriceUsd),
      priceCoins: Number(tierPriceCoins),
      colorTheme: tierColor,
      benefits: tierBenefits,
      isFeatured: isFeaturedTier
    });
  };

  const handleCreateGoal = () => {
    createGoalMutation.mutate({
      title: goalTitle,
      description: goalDesc,
      type: goalType,
      targetAmount: Number(goalTarget),
      reward: goalReward
    });
  };

  const handleApplyMonetization = () => {
    applyMonetizationMutation.mutate();
  };

  const handleApplyVerification = () => {
    applyVerificationMutation.mutate({
      governmentId: govId,
      businessVerification: bizCert || undefined
    });
    setShowVerificationModal(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#07080a] flex items-center justify-center text-gray-400">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  const isMasterAdmin = creatorProgress?.role === "MASTER_ADMIN" || activeRole === "MASTER_ADMIN";
  const isMonetized = creatorProgress?.isMonetized || isMasterAdmin || activeRole === "CREATOR" || activeRole === "VERIFIED_CREATOR" || (activeRole && activeRole.includes("ADMIN"));
  const isVerified = creatorProgress?.verificationStatus === "VERIFIED" || activeRole === "VERIFIED_CREATOR";

  const presetBenefits = [
    "Early chapter access",
    "Exclusive chapters",
    "Members-only posts",
    "Behind the scenes",
    "Digital wallpapers",
    "Sketches",
    "Creator blog",
    "Poll voting",
    "Q&A sessions",
    "Live streams",
    "Community chat access"
  ];

  const creatorGroups: WorkspaceNavGroup[] = [
    {
      id: "workspace",
      label: "Workspace",
      items: [
        { id: "overview", label: "Overview", icon: LayoutDashboard },
        { id: "comics", label: "Series Management", icon: BookOpen, badge: seriesList?.length },
        { id: "access_simulator", label: "Access & Drafts", icon: Unlock },
      ],
    },
    {
      id: "business",
      label: "Business",
      items: [
        { id: "analytics", label: "Analytics", icon: BarChart3 },
        { id: "revenue", label: "Revenue & Earnings", icon: Wallet },
        { id: "memberships", label: "Memberships & Tiers", icon: Heart },
        { id: "payouts", label: "Payouts & Transfers", icon: DollarSign },
        { id: "audience", label: "Audience Insights", icon: Users },
        { id: "supporters", label: "Supporters Manager", icon: Compass },
      ],
    },
    {
      id: "community",
      label: "Community",
      items: [
        { id: "creator_hub", label: "Creator Hub Posts", icon: Sparkles, badge: postsList?.length },
        { id: "exclusive", label: "Linked Comic/Novel", icon: BookOpen },
        { id: "notifications", label: "Notifications", icon: Bell, badge: (dbNotifications as any[])?.filter((n: any) => !n.isRead)?.length || undefined, badgeVariant: "warning" },
      ],
    },
    {
      id: "settings",
      label: "Settings",
      items: [
        { id: "settings", label: "Studio Settings", icon: Settings },
        { id: "goals", label: "Creator Goals", icon: Target },
        { id: "gifts", label: "Gifts Wall", icon: Gift },
        { id: "tips", label: "Tips & Support", icon: DollarSign },
      ],
    },
  ];

  return (
    <WorkspaceLayout
      type="creator"
      title="Creator Studio"
      contextSubtitle={activeTab.replace(/_/g, " ").toUpperCase()}
      user={{
        username: currentUser,
        penName: currentUser,
        role: "CREATOR"
      }}
      roleBadge={isVerified ? "Verified Creator" : "Creator"}
      groups={creatorGroups}
      activeTab={activeTab}
      onSelectTab={(tabId) => setActiveTab(tabId as TabType)}
      onClose={() => router.push("/")}
    >
      <div className="flex flex-col gap-6">
        {/* Content switch */}
        
        {/* Tab 1: Overview */}
        {activeTab === "overview" && (
          <div className="flex flex-col gap-8">
            
            {/* Creator Levels Card */}
            <div className="p-6 bg-gradient-to-r from-blue-950/20 to-slate-950/30 border border-blue-500/20 rounded-2xl relative overflow-hidden flex justify-between items-center">
              <div className="z-10">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-blue-600 text-white font-extrabold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full">
                    Level {creatorProgress?.level || 1} Creator
                  </span>
                  {isVerified && (
                    <span className="bg-blue-600 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-full uppercase">Verified badge</span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-white">Creator Studio Roadmap</h3>
                <p className="text-xs text-gray-400 mt-1 max-w-lg">Unlock higher platform limits, membership monetization, and exclusive branding rewards by completing your creator onboarding progression milestones.</p>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Level Progress</p>
                  <p className="text-2xl font-black text-white mt-0.5">{creatorProgress?.level || 1} / 8</p>
                </div>
                <div className="w-16 h-16 rounded-full border-4 border-blue-500 flex items-center justify-center text-sm font-black text-blue-400">
                  {Math.round(((creatorProgress?.level || 1) / 8) * 100)}%
                </div>
              </div>
            </div>

            {/* Verification status cards */}
            {!isMonetized && (
              <div className="p-6 bg-[#0f1118] border border-[#222533] rounded-2xl">
                <div className="flex items-start gap-4 justify-between">
                  <div>
                    <h4 className="text-base font-bold text-blue-400 flex items-center gap-2">
                      <ShieldAlert className="w-5 h-5 text-blue-500" /> Unlock Membership, Gifts & Tips Monetization
                    </h4>
                    <p className="text-xs text-gray-400 mt-2 max-w-2xl leading-relaxed">
                      To qualify for the Creator Monetization Program, you need to satisfy the criteria below. Once complete, submit your channel details for quick administrative eligibility review.
                    </p>
                  </div>
                  {creatorProgress?.requirements.allMet && creatorProgress?.monetizationStatus === "NOT_APPLIED" && (
                    <button 
                      onClick={handleApplyMonetization}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-xs font-extrabold transition-all tracking-wider uppercase"
                    >
                      Apply for Monetization
                    </button>
                  )}
                  {creatorProgress?.monetizationStatus === "PENDING_REVIEW" && (
                    <span className="bg-yellow-600/20 text-yellow-500 border border-yellow-500/20 px-4 py-2 rounded-xl text-xs font-bold uppercase">
                      Monetization Review Pending
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-6">
                  {[
                    { label: "100 Followers or 10k Views", met: creatorProgress?.requirements.followersMet },
                    { label: "1+ Published Series", met: creatorProgress?.requirements.seriesMet },
                    { label: "Email Verified", met: creatorProgress?.requirements.emailVerified },
                    { label: "Phone Verified", met: creatorProgress?.requirements.phoneVerified },
                    { label: "Payout Profile Set", met: creatorProgress?.requirements.payoutProfileCompleted }
                  ].map((req, idx) => (
                    <div key={idx} className={`p-4 rounded-xl border flex flex-col justify-between ${req.met ? "bg-green-950/20 border-green-500/30 text-green-400" : "bg-[#141620] border-[#222533] text-gray-400"}`}>
                      <span className="text-xs font-bold leading-snug">{req.label}</span>
                      <div className="flex justify-end mt-4">
                        {req.met ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Lock className="w-3.5 h-3.5 text-gray-600" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: "Active Supporter Members", value: membershipAnalytics?.activeMembers || 0, icon: <Users className="w-5 h-5 text-blue-500" /> },
                { label: "Monthly Recurring Revenue", value: `$${membershipAnalytics?.monthlyRecurringRevenue || 0}`, icon: <DollarSign className="w-5 h-5 text-green-500" /> },
                { label: "Gifts Wallet Credits", value: giftsAnalytics?.totalGiftsReceived || 0, icon: <Gift className="w-5 h-5 text-blue-500" /> },
                { label: "Cumulative Views", value: creatorProgress?.stats.views || 0, icon: <Eye className="w-5 h-5 text-amber-500" /> }
              ].map((stat, idx) => (
                <div key={idx} className="p-6 bg-[#0d0e12] border border-[#1a1c23] rounded-2xl flex items-center gap-5">
                  <div className="p-3 bg-slate-900 rounded-xl">
                    {stat.icon}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{stat.label}</p>
                    <h3 className="text-2xl font-black text-white mt-1">{stat.value}</h3>
                  </div>
                </div>
              ))}
            </div>

            {/* Channels Verification Block */}
            {!isVerified && creatorProgress?.verificationStatus === "NOT_VERIFIED" && (
              <div className="p-6 bg-slate-950/30 border border-[#1a1c23] rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="text-base font-bold text-white">Creator Verification & Identity Stamp</h4>
                  <p className="text-xs text-gray-400 mt-1 max-w-xl">Request official profile verification badge by submitting your identity document credentials. Verified status improves trust and query priority.</p>
                </div>
                <button 
                  onClick={() => setShowVerificationModal(true)}
                  className="bg-[#141620] hover:bg-[#222533] border border-[#2a2e40] text-gray-300 px-6 py-2.5 rounded-xl text-xs font-bold uppercase transition-colors"
                >
                  Apply Verification
                </button>
              </div>
            )}

          </div>
        )}

        {/* Tab 2: Comics and Series */}
        {activeTab === "comics" && (
          <div className="flex flex-col gap-8">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-white">Published Series & Chapters Catalog</h3>
                <p className="text-xs text-gray-400 mt-1">Review your active novels/comics. Stagger releases deterministically with the Simulator.</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowCreateSeriesModal(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all tracking-wider uppercase flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Create Series
                </button>
                <Link href="/studio/upload" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all tracking-wider uppercase flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Upload New Episode
                </Link>
              </div>
            </div>

            {/* Catalog Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {seriesList?.map((series: any) => {
                const statusCfg = getStatusBadgeConfig(series.status);
                return (
                  <div key={series.id} className="p-5 bg-[#0d0e12] border border-[#1a1c23] hover:border-[#2a2d3d] transition-all rounded-2xl flex gap-4">
                    <img 
                      src={series.coverUrl || "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=300&auto=format&fit=crop"} 
                      alt={series.title} 
                      className="w-20 aspect-[3/4] rounded-lg object-cover bg-slate-900 border border-slate-800"
                    />
                    <div className="flex flex-col justify-between flex-1">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-extrabold text-white text-base truncate">{series.title}</h4>
                          <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1.5 whitespace-nowrap ${statusCfg.bg} ${statusCfg.color} ${statusCfg.border}`}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusCfg.dot }}></span>
                            {statusCfg.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{series.description}</p>
                        {series.statusMessage && (
                          <p className="text-[11px] text-amber-400/90 bg-amber-950/20 border border-amber-500/20 rounded-md px-2 py-1 mt-2 line-clamp-1 italic">
                            📢 {series.statusMessage}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs font-bold text-gray-400 mt-3 pt-3 border-t border-slate-900 flex-wrap gap-2">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5 text-gray-500" /> {series.views} views</span>
                          <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5 text-gray-500" /> {series.likes} likes</span>
                          {series.linkedSeriesId && (
                            <span className="text-blue-400 bg-blue-950/30 border border-blue-500/20 px-2 py-0.5 rounded uppercase text-[10px]">
                              Linked
                            </span>
                          )}
                          {series.isProgressionPaused && (
                            <span className="text-red-400 bg-red-950/20 border border-red-500/20 px-2 py-0.5 rounded uppercase text-[10px]">
                              Paused
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenStatusModal(series)}
                            className="text-xs text-emerald-400 hover:text-emerald-300 font-extrabold flex items-center gap-1.5 bg-emerald-950/30 hover:bg-emerald-950/50 border border-emerald-500/30 px-3 py-1.5 rounded-xl transition shadow-sm"
                          >
                            <Settings className="w-3.5 h-3.5 text-emerald-400" /> Publishing & Status
                          </button>
                          <button
                            onClick={() => {
                              setSelectedSeriesForLinking(series);
                              setShowLinkedModal(true);
                            }}
                            className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 bg-blue-950/20 hover:bg-blue-950/40 border border-blue-500/20 px-2.5 py-1.5 rounded-xl transition"
                          >
                            <Sparkles className="w-3 h-3 text-blue-400" /> Linked
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Release Simulator Section */}
            <div className="p-6 bg-[#0d0e12] border border-[#1a1c23] rounded-2xl">
              <h4 className="text-base font-bold text-blue-400 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-500" /> Release Simulator & Progression Timeline
              </h4>
              <p className="text-xs text-gray-400 mt-2 max-w-xl">
                Simulate how your upload package will be distributed initially and staggered automatically over the weeks according to the Platform Chapter Release Strategy.
              </p>

              <div className="mt-6 flex items-center gap-4">
                <label className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">Number of Chapters to Simulator Upload:</label>
                <input 
                  type="number" 
                  min={1} 
                  max={24}
                  value={simulatorChapters}
                  onChange={(e) => setSimulatorChapters(Math.max(1, Number(e.target.value)))}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-sm font-bold text-white w-20 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Timeline Display */}
              <div className="flex flex-col gap-4 mt-8 relative pl-6 border-l border-blue-500/20">
                {simulatorTimeline?.map((item: any, idx: number) => (
                  <div key={idx} className="relative mb-4">
                    <div className="absolute -left-[30px] top-1.5 w-4 h-4 rounded-full bg-blue-500 border-4 border-[#090b0e]"></div>
                    <div className="bg-[#141620]/30 border border-[#222533] p-4 rounded-xl">
                      <h5 className="font-extrabold text-white text-sm">{item.title}</h5>
                      <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                        <div className="p-3 bg-slate-950/40 rounded-lg border border-slate-900/60">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-green-400">Free chapters</span>
                          <p className="text-xs font-bold text-gray-400 mt-1">{item.free.length > 0 ? item.free.join(", ") : "None"}</p>
                        </div>
                        <div className="p-3 bg-slate-950/40 rounded-lg border border-slate-900/60">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-400">Watch to Unlock</span>
                          <p className="text-xs font-bold text-gray-400 mt-1">{item.watch.length > 0 ? item.watch.join(", ") : "None"}</p>
                        </div>
                        <div className="p-3 bg-slate-950/40 rounded-lg border border-slate-900/60">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-400">Premium chapters</span>
                          <p className="text-xs font-bold text-gray-400 mt-1">{item.premium.length > 0 ? item.premium.join(", ") : "None"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* Tab 2.5: Access Simulator Debugger */}
        {activeTab === "access_simulator" && (
          <div className="flex flex-col gap-8">
            <div>
              <h3 className="text-lg font-bold text-white">Platform Access Rules Engine Debugger</h3>
              <p className="text-xs text-gray-400 mt-1">Simulate reader wallet balances, subscription tiers, and chapter release criteria to verify paywall transitions.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Simulation Configuration form */}
              <div className="p-6 bg-[#0d0e12] border border-[#1a1c23] rounded-2xl flex flex-col gap-6">
                <h4 className="text-sm font-bold text-blue-400 uppercase tracking-wide">1. Configuration Parameters</h4>
                
                {/* Reader Profile Config */}
                <div className="flex flex-col gap-4 border-b border-[#1a1c23]/40 pb-6">
                  <h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Reader Account</h5>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-gray-500 font-extrabold uppercase">Subscription Tier:</label>
                      <select 
                        value={debugReaderSub} 
                        onChange={(e: any) => setDebugReaderSub(e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="NONE">None (Free Reader)</option>
                        <option value="PLUS">Panelva Plus</option>
                        <option value="PREMIUM">Panelva Premium</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-gray-500 font-extrabold uppercase">Wallet Coins Balance:</label>
                      <input 
                        type="number" 
                        min={0}
                        value={debugReaderCoins} 
                        onChange={(e) => setDebugReaderCoins(Number(e.target.value))}
                        className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Chapter Config */}
                <div className="flex flex-col gap-4">
                  <h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Target Chapter</h5>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-gray-500 font-extrabold uppercase">Chapter Access Tier:</label>
                      <select 
                        value={debugChapterTier} 
                        onChange={(e: any) => setDebugChapterTier(e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="FREE">Free</option>
                        <option value="AD_SUPPORTED">Ad-Supported</option>
                        <option value="PREMIUM">Premium / Early Access</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-gray-500 font-extrabold uppercase">Coin Price:</label>
                      <input 
                        type="number" 
                        min={0}
                        disabled={debugChapterTier !== "PREMIUM"}
                        value={debugChapterPrice} 
                        onChange={(e) => setDebugChapterPrice(Number(e.target.value))}
                        className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 disabled:opacity-40"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-gray-500 font-extrabold uppercase">Wait-For-Free (Days left):</label>
                      <input 
                        type="number" 
                        min={0}
                        disabled={debugChapterTier === "FREE"}
                        value={debugChapterWaitDays} 
                        onChange={(e) => setDebugChapterWaitDays(Number(e.target.value))}
                        className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 disabled:opacity-40"
                      />
                    </div>
                  </div>
                </div>

                <button 
                  type="button"
                  onClick={handleDebugAccess}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3 px-5 rounded-xl text-xs uppercase tracking-wider transition-all mt-4 w-full"
                >
                  Evaluate Rules Engine
                </button>
              </div>

              {/* Simulation Result / Engine Trace */}
              <div className="p-6 bg-[#0d0e12] border border-[#1a1c23] rounded-2xl flex flex-col gap-6 min-h-[300px]">
                <h4 className="text-sm font-bold text-indigo-400 uppercase tracking-wide">2. Rules Engine Trace Output</h4>

                {debugResult ? (
                  <div className="flex flex-col gap-4">
                    <div className={cn(
                      "p-4 rounded-xl border flex items-center gap-3",
                      debugResult.allowed 
                        ? "bg-green-500/10 border-green-500/20 text-green-400" 
                        : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                    )}>
                      {debugResult.allowed ? (
                        <CheckCircle2 className="w-6 h-6 shrink-0" />
                      ) : (
                        <ShieldAlert className="w-6 h-6 shrink-0" />
                      )}
                      <div>
                        <p className="text-xs font-extrabold uppercase">Decision Outcome</p>
                        <p className="text-sm font-black mt-0.5">{debugResult.allowed ? "Access Granted" : "Access Blocked / Paywalled"}</p>
                      </div>
                    </div>

                    <div className="bg-slate-950/40 border border-slate-900 rounded-xl p-4 flex flex-col gap-2.5 font-mono text-[11px] leading-relaxed text-gray-400 max-h-80 overflow-y-auto">
                      {debugResult.trace.map((line, idx) => (
                        <div key={idx} className="border-b border-slate-900/60 pb-1.5 last:border-0 last:pb-0">
                          {line}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-600 border border-dashed border-gray-800 rounded-xl">
                    <HelpCircle className="w-10 h-10 mb-2" />
                    <p className="text-xs font-bold uppercase tracking-wider">No Simulation Executed</p>
                    <p className="text-[10px] text-gray-500 mt-1 max-w-[250px]">Select configuration parameters on the left and click "Evaluate Rules Engine" to start.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Memberships */}
        {activeTab === "memberships" && (
          <div className="flex flex-col gap-8">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-white">Membership Monetization Tiers</h3>
                <p className="text-xs text-gray-400 mt-1">Configure subscription perks, benefits, and customized themes for your loyal supporters.</p>
              </div>
              <button 
                onClick={() => {
                  setTierName("");
                  setTierDesc("");
                  setTierPriceUsd(4.99);
                  setTierPriceCoins(500);
                  setTierColor("#2563eb");
                  setTierBenefits([]);
                  setIsFeaturedTier(false);
                  setShowNewTierModal(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all tracking-wider uppercase flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Create Custom Tier
              </button>
            </div>

            {/* Custom Tiers List */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {dbTiers?.map((tier: any) => (
                <div 
                  key={tier.id} 
                  className="p-6 bg-[#0d0e12] border-2 rounded-2xl flex flex-col justify-between"
                  style={{ borderColor: tier.colorTheme }}
                >
                  <div>
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: tier.colorTheme }}>
                          {tier.isFeatured ? "Featured Perks" : "Tier Model"}
                        </span>
                        <h4 className="text-lg font-black text-white mt-2">{tier.name}</h4>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleOpenEditTier(tier)} className="text-gray-500 hover:text-white p-1"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => deleteTierMutation.mutate({ id: tier.id })} className="text-red-500 hover:text-red-400 p-1"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>

                    <p className="text-xs text-gray-400 mt-2 min-h-[36px]">{tier.description}</p>
                    <div className="mt-4 pb-4 border-b border-[#1a1c23]">
                      <span className="text-2xl font-black text-white">${tier.priceUsd}</span>
                      <span className="text-xs text-gray-500 font-bold uppercase tracking-wider ml-1">/ month</span>
                      <p className="text-xs text-blue-400 font-semibold mt-1">or {tier.priceCoins} Credits/month</p>
                    </div>

                    <div className="mt-4 flex flex-col gap-2">
                      <span className="text-[10px] font-extrabold uppercase text-gray-500 tracking-wider">Benefits:</span>
                      {tier.benefits?.map((benefit: string, bIdx: number) => (
                        <div key={bIdx} className="flex items-center gap-2 text-xs text-gray-300">
                          <Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                          <span>{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* Tab 4: Gifts */}
        {activeTab === "gifts" && (
          <div className="flex flex-col gap-8">
            <div>
              <h3 className="text-lg font-bold text-white">Gifts Received Analytics</h3>
              <p className="text-xs text-gray-400 mt-1">Interactive gift activity feed and top supporters.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: "Cumulative Credits", value: giftsAnalytics?.totalGiftsReceived || 0, sub: "Converted to payout balances" },
                { label: "Top Support Gift", value: giftsAnalytics?.topGiftReceived || "None", sub: "Most popular supportive item" },
                { label: "Hall of Fame Supporter", value: giftsAnalytics?.topSupporter || "None", sub: "Highest cumulative spender" }
              ].map((item: any, idx: number) => (
                <div key={idx} className="p-6 bg-[#0d0e12] border border-[#1a1c23] rounded-2xl">
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{item.label}</p>
                  <h4 className="text-xl font-black text-white mt-1">{item.value}</h4>
                  <p className="text-[10px] text-gray-400 mt-1 font-semibold">{item.sub}</p>
                </div>
              ))}
            </div>

            {/* Live Feed */}
            <div className="p-6 bg-[#0d0e12] border border-[#1a1c23] rounded-2xl">
              <h4 className="text-base font-bold text-white mb-4">Live Support Activity Feed</h4>
              <div className="flex flex-col gap-3">
                {giftsAnalytics?.recentSupporters.map((feed: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between text-xs p-3 bg-slate-950/20 border border-slate-900 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-blue-400">@{feed.name}</span>
                      <span className="text-gray-400 font-semibold">{feed.action}</span>
                    </div>
                    <span className="text-[10px] text-gray-600 font-bold">{feed.date}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* Tab 5: Tips */}
        {activeTab === "tips" && (
          <div className="flex flex-col gap-8">
            <div>
              <h3 className="text-lg font-bold text-white">Direct Tips Dashboard</h3>
              <p className="text-xs text-gray-400 mt-1">Cumulative tipping amounts received and monthly summaries.</p>
            </div>

            <div className="p-6 bg-[#0d0e12] border border-[#1a1c23] rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Direct Tips Earnings</span>
                <h4 className="text-3xl font-black text-white mt-1">${giftsAnalytics?.totalTipsReceived || 0}</h4>
              </div>
              <div className="p-3 bg-slate-900 rounded-xl text-green-500">
                <DollarSign className="w-8 h-8" />
              </div>
            </div>

          </div>
        )}

        {/* Tab 6: Goals */}
        {activeTab === "goals" && (
          <div className="flex flex-col gap-8">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-white">Public Creator Milestones & Goals</h3>
                <p className="text-xs text-gray-400 mt-1">Create community targets to engage and reward readers.</p>
              </div>
              <button 
                onClick={() => {
                  setGoalTitle("");
                  setGoalDesc("");
                  setGoalType("MEMBER");
                  setGoalTarget(100);
                  setGoalReward("");
                  setShowNewGoalModal(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all tracking-wider uppercase flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Create Public Goal
              </button>
            </div>

            {/* Goals list */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {dbGoals?.map((goal: any) => (
                <div key={goal.id} className="p-6 bg-[#0d0e12] border border-[#1a1c23] rounded-2xl flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="bg-blue-950 text-blue-400 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border border-blue-500/20">
                          {goal.type} Goal
                        </span>
                        <h4 className="text-base font-black text-white mt-2">{goal.title}</h4>
                      </div>
                      <button onClick={() => deleteGoalMutation.mutate({ id: goal.id })} className="text-red-500 hover:text-red-400 p-1"><Trash2 className="w-4 h-4" /></button>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">{goal.description}</p>
                    
                    <div className="mt-4">
                      <div className="flex justify-between text-xs font-bold text-gray-400 mb-1">
                        <span>Progress: {goal.currentProgress} / {goal.targetAmount}</span>
                        <span>{Math.round((goal.currentProgress / goal.targetAmount) * 100)}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 transition-all duration-300"
                          style={{ width: `${Math.min(100, (goal.currentProgress / goal.targetAmount) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-900 flex justify-between items-center">
                    <span className="text-[10px] font-extrabold uppercase text-gray-500">Reward:</span>
                    <span className="text-xs text-blue-400 font-extrabold">{goal.reward}</span>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* Tab 7: Analytics */}
        {activeTab === "analytics" && (
          <div className="flex flex-col gap-8">
            <div>
              <h3 className="text-lg font-bold text-white">Advanced Creators Analytics</h3>
              <p className="text-xs text-gray-400 mt-1">Analyze viewership growth and monetization conversions.</p>
            </div>

            {/* Readership Chart */}
            <div className="p-6 bg-[#0d0e12] border border-[#1a1c23] rounded-2xl">
              <h4 className="text-base font-bold text-white mb-6">Daily Viewership Analytics</h4>
              <div className="w-full h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analyticsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                    <XAxis dataKey="date" stroke="#6b7280" tickMargin={10} minTickGap={30} />
                    <YAxis stroke="#6b7280" />
                    <Tooltip contentStyle={{ background: "#0d0e12", border: "1px solid #1a1c23" }} />
                    <Legend />
                    <Line type="monotone" dataKey="views" stroke="#2563eb" strokeWidth={3} dot={false} name="Views" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        )}

        {/* Tab 8: Revenue */}
        {activeTab === "revenue" && (
          <div className="flex flex-col gap-8">
            <div>
              <h3 className="text-lg font-bold text-white">Revenue Sources breakdown</h3>
              <p className="text-xs text-gray-400 mt-1">Trace all monetization streams on the ledger.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {(revenueBreakdown || [
                { source: "Membership Fees", amount: 60, pct: 40 },
                { source: "Premium Chapter sales", amount: 45, pct: 30 },
                { source: "Gifts sent", amount: 30, pct: 20 },
                { source: "Direct Tips", amount: 15, pct: 10 },
                { source: "Advertisement", amount: 0, pct: 0 }
              ]).map((item: any, idx: number) => (
                <div key={idx} className="p-5 bg-[#0d0e12] border border-[#1a1c23] rounded-2xl">
                  <span className="text-[10px] font-extrabold uppercase text-gray-500 tracking-wider">{item.source}</span>
                  <h4 className="text-xl font-black text-white mt-1">${item.amount}</h4>
                  <p className="text-[10px] text-blue-400 mt-1 font-bold">{item.pct}% of total</p>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* Tab 9: Audience */}
        {activeTab === "audience" && (
          <div className="flex flex-col gap-8">
            <div>
              <h3 className="text-lg font-bold text-white">Audience Demographics & Insights</h3>
              <p className="text-xs text-gray-400 mt-1">Reader location country statistics and device preferences.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-[#0d0e12] border border-[#1a1c23] rounded-2xl">
                <h4 className="text-base font-bold text-white mb-4">Top Country breakdown</h4>
                <div className="flex flex-col gap-3">
                  {audienceInsights?.topCountries.map((c: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-xs font-bold text-gray-300">
                      <span>{c.country}</span>
                      <span>{c.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 bg-[#0d0e12] border border-[#1a1c23] rounded-2xl">
                <h4 className="text-base font-bold text-white mb-4">Reader Device break</h4>
                <div className="flex flex-col gap-3">
                  {audienceInsights?.topDevices.map((d: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-xs font-bold text-gray-300">
                      <span>{d.device}</span>
                      <span>{d.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Tab 10: Supporters */}
        {activeTab === "supporters" && (
          <div className="flex flex-col gap-8">
            <div>
              <h3 className="text-lg font-bold text-white">Supporters & Subscribers Log</h3>
              <p className="text-xs text-gray-400 mt-1">Manage and track your active supporters.</p>
            </div>

            <div className="bg-[#0d0e12] border border-[#1a1c23] rounded-2xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs font-semibold">
                <thead>
                  <tr className="bg-slate-900 border-b border-[#1a1c23] text-gray-400 font-extrabold uppercase tracking-wider">
                    <th className="p-4">User</th>
                    <th className="p-4">Membership tier</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Cumulative spend</th>
                    <th className="p-4">Join date</th>
                  </tr>
                </thead>
                <tbody>
                  {supporters?.map((sub: any) => (
                    <tr key={sub.id} className="border-b border-[#1a1c23] text-gray-300 hover:bg-slate-900/40">
                      <td className="p-4 font-bold text-blue-400">@{sub.username}</td>
                      <td className="p-4">{sub.tierName}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${sub.status === "Active" ? "bg-green-600/10 text-green-400" : "bg-red-600/10 text-red-400"}`}>
                          {sub.status}
                        </span>
                      </td>
                      <td className="p-4">${sub.lifetimeSpent}</td>
                      <td className="p-4 text-gray-500">{sub.joinDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* Tab 11: Exclusive Content */}
        {activeTab === "exclusive" && (
          <div className="flex flex-col gap-8">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-white">Members-Only Exclusive Posts</h3>
                <p className="text-xs text-gray-400 mt-1">Publish behind the scenes, illustrations, and bonus chapters.</p>
              </div>
              <button 
                onClick={() => alert("Creating exclusive content...")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all tracking-wider uppercase flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Create Exclusive Post
              </button>
            </div>

            <div className="p-8 bg-[#0d0e12] border border-[#1a1c23] rounded-2xl text-center flex flex-col items-center gap-3">
              <Lock className="w-12 h-12 text-slate-700" />
              <h4 className="text-white font-bold text-base mt-2">No Exclusive Posts Yet</h4>
              <p className="text-xs text-gray-500 max-w-sm">Publish sketches, drafts, or early access chapters to drive membership conversions.</p>
            </div>

          </div>
        )}

        {/* Tab 12: Notifications */}
        {activeTab === "notifications" && (
          <div className="flex flex-col gap-6">
            <div>
              <h3 className="text-lg font-bold text-white">Studio Notifications Centre</h3>
              <p className="text-xs text-gray-400 mt-1">Monitor new subscribers, milestones, and platform engagements.</p>
            </div>

            <div className="flex flex-col gap-3">
              {dbNotifications?.length === 0 ? (
                <div className="p-8 bg-[#0d0e12] border border-[#1a1c23] rounded-2xl text-center text-gray-500 font-bold">
                  No notifications.
                </div>
              ) : (
                dbNotifications?.map((notif: any) => (
                  <div key={notif.id} className={`p-4 border rounded-xl flex items-center justify-between transition-colors ${notif.isRead ? "bg-[#0d0e12]/30 border-slate-900 text-gray-400" : "bg-blue-950/10 border-blue-500/20 text-gray-100"}`}>
                    <div>
                      <h4 className="font-extrabold text-sm text-white">{notif.title}</h4>
                      <p className="text-xs mt-1 text-gray-400">{notif.message}</p>
                    </div>
                    {!notif.isRead && (
                      <button 
                        onClick={() => markReadMutation.mutate({ id: notif.id })}
                        className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-wider"
                      >
                        Mark Read
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

          </div>
        )}

        {/* Tab 13: Payouts */}
        {activeTab === "payouts" && (
          <div className="flex flex-col gap-8">
            <div>
              <h3 className="text-lg font-bold text-white">Cashout Creator Balances</h3>
              <p className="text-xs text-gray-400 mt-1">Withdraw your accumulated platform credits to your payout settings profile.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-[#0d0e12] border border-[#1a1c23] rounded-2xl">
                <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Available Balance</span>
                <h4 className="text-3xl font-black text-white mt-1">{payoutDetails?.payoutBalance || 0} Credits</h4>
                <p className="text-[10px] text-gray-400 mt-1 font-semibold">Minimum withdrawal threshold: ${payoutDetails?.withdrawalMinimum} USD</p>
                <p className="text-xs text-blue-400 mt-3 font-bold">{payoutDetails?.rateConversion}</p>

                <button 
                  disabled={(payoutDetails?.payoutBalance || 0) < 50000}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900/30 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-extrabold py-3 rounded-xl text-xs uppercase tracking-wider mt-6 transition-all"
                >
                  Withdraw Cash-out
                </button>
              </div>

              <div className="p-6 bg-[#0d0e12] border border-[#1a1c23] rounded-2xl flex flex-col justify-between">
                <div>
                  <h4 className="text-base font-bold text-white mb-2">Payout profile information</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Withdrawal cash-outs require a verified tax ID profile completed. Ensure your personal tax ID details match legal documents.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold mt-4">
                  {payoutDetails?.taxCompleted ? (
                    <span className="text-green-400 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Tax Profile Active</span>
                  ) : (
                    <span className="text-red-400 flex items-center gap-1"><ShieldAlert className="w-4 h-4" /> Tax Profile Incomplete</span>
                  )}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Tab 15: Creator Hub Post Management */}
        {activeTab === "creator_hub" && (
          <div className="flex flex-col gap-8">
            
            {showComposer ? (
              // COMPOSER VIEW
              <div className="bg-[#0d0e12] border border-[#1a1c23] p-6 rounded-2xl flex flex-col gap-5">
                <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
                  <h3 className="text-lg font-black text-white">
                    {editingPostId ? "Edit Timeline Post" : "Create New Timeline Post"}
                  </h3>
                  <button 
                    onClick={resetPostComposer}
                    className="text-gray-500 hover:text-white text-xs font-bold uppercase"
                  >
                    Cancel
                  </button>
                </div>

                <div className="flex flex-col gap-4">
                  {/* Title */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-gray-400 font-extrabold uppercase">Post Title:</label>
                    <input 
                      type="text"
                      placeholder="e.g. Concept Sketch for Chapter 5"
                      value={postTitle}
                      onChange={(e) => setPostTitle(e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Content (Markdown) */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-gray-400 font-extrabold uppercase">Content (Markdown supported):</label>
                    <textarea 
                      placeholder="Write your update details..."
                      value={postContent}
                      onChange={(e) => setPostContent(e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 h-32"
                    />
                  </div>

                  {/* Format & Visibility row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-gray-400 font-extrabold uppercase">Post Format Type:</label>
                      <select 
                        value={postType}
                        onChange={(e) => setPostType(e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="TEXT">Text Update</option>
                        <option value="ANNOUNCEMENT">Announcement</option>
                        <option value="CONCEPT_ART">Concept Art</option>
                        <option value="POLL">Interactive Poll</option>
                        <option value="PROGRESS_UPDATE">Progress Update</option>
                        <option value="WALLPAPER">Wallpaper Download</option>
                        <option value="CHARACTER_REVEAL">Character Sheet</option>
                        <option value="CHAPTER_PREVIEW">Chapter Preview</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-gray-400 font-extrabold uppercase">Visibility:</label>
                      <select 
                        value={postVisibility}
                        onChange={(e) => setPostVisibility(e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="PUBLIC">Public (All readers)</option>
                        <option value="FOLLOWERS_ONLY">Followers Only</option>
                        <option value="MEMBERS_ONLY">Members Only</option>
                        <option value="TIER_ONLY">Specific Tier Subscribers</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-gray-400 font-extrabold uppercase">Select Allowed Tier:</label>
                      <select 
                        disabled={postVisibility !== "TIER_ONLY"}
                        value={postAllowedTierId}
                        onChange={(e) => setPostAllowedTierId(e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <option value="">-- Choose Tier --</option>
                        {dbTiers?.map((tier: any) => (
                          <option key={tier.id} value={tier.id}>{tier.name} (${tier.priceUsd}/mo)</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Poll Options builder (Only if POLL type is selected) */}
                  {postType === "POLL" && (
                    <div className="flex flex-col gap-2 bg-slate-950 p-4 rounded-xl border border-zinc-900">
                      <label className="text-xs text-gray-400 font-extrabold uppercase">Poll choices:</label>
                      {postPollOptions.map((opt: any, idx: number) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <input 
                            type="text"
                            placeholder={`Choice #${idx + 1}`}
                            value={opt}
                            onChange={(e) => {
                              const copy = [...postPollOptions];
                              copy[idx] = e.target.value;
                              setPostPollOptions(copy);
                            }}
                            className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                          />
                          {postPollOptions.length > 2 && (
                            <button 
                              onClick={() => setPostPollOptions(postPollOptions.filter((_, i) => i !== idx))}
                              className="text-red-500 p-1"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      {postPollOptions.length < 5 && (
                        <button 
                          onClick={() => setPostPollOptions([...postPollOptions, ""])}
                          className="text-[10px] font-black uppercase text-blue-400 hover:text-blue-300 w-fit mt-1"
                        >
                          + Add Choice
                        </button>
                      )}
                    </div>
                  )}

                  {/* Media attachment links */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-gray-400 font-extrabold uppercase">Media Attachments (Image/GIF/Video URL):</label>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        placeholder="e.g. https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5"
                        value={newMediaUrl}
                        onChange={(e) => setNewMediaUrl(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-xs text-white focus:outline-none"
                      />
                      <button 
                        onClick={() => {
                          if (newMediaUrl.trim()) {
                            setPostMediaUrls([...postMediaUrls, newMediaUrl.trim()]);
                            setNewMediaUrl("");
                          }
                        }}
                        className="bg-slate-800 hover:bg-slate-700 text-white px-4 rounded-lg text-xs font-bold"
                      >
                        Add
                      </button>
                    </div>

                    {/* Preview attachments */}
                    {postMediaUrls.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {postMediaUrls.map((url: any, idx: number) => (
                          <div key={idx} className="bg-slate-900 border border-slate-800 rounded-lg p-2 flex items-center gap-2 text-xs">
                            <span className="truncate max-w-[150px]">{url}</span>
                            <button 
                              onClick={() => setPostMediaUrls(postMediaUrls.filter((_, i) => i !== idx))}
                              className="text-red-500 hover:text-red-400"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Publish Scheduling options */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-gray-400 font-extrabold uppercase">Post Status:</label>
                      <select 
                        value={postStatus}
                        onChange={(e) => setPostStatus(e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-xs text-white focus:outline-none"
                      >
                        <option value="PUBLISHED">Publish Instantly</option>
                        <option value="DRAFT">Save as Draft</option>
                        <option value="SCHEDULED">Schedule for Later</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-gray-400 font-extrabold uppercase">Scheduled Date & Time:</label>
                      <input 
                        type="datetime-local"
                        disabled={postStatus !== "SCHEDULED"}
                        value={postScheduledFor}
                        onChange={(e) => setPostScheduledFor(e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-xs text-white focus:outline-none disabled:opacity-40"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 border-t border-zinc-800 pt-5 mt-4">
                  <button 
                    onClick={resetPostComposer}
                    className="bg-[#141620] hover:bg-[#222533] border border-[#2a2e40] text-gray-300 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => {
                      const payload = {
                        title: postTitle,
                        content: postContent,
                        type: postType,
                        visibility: postVisibility,
                        allowedTierId: postAllowedTierId || null,
                        mediaUrls: postMediaUrls,
                        pollOptions: postPollOptions.filter(o => o.trim() !== ""),
                        status: postStatus,
                        scheduledFor: postScheduledFor ? new Date(postScheduledFor) : null,
                      };

                      if (editingPostId) {
                        updatePostMutation.mutate({ postId: editingPostId, ...payload });
                      } else {
                        createPostMutation.mutate(payload);
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition"
                  >
                    {editingPostId ? "Save Post Changes" : "Publish Post"}
                  </button>
                </div>
              </div>
            ) : (
              // MANAGE FEED LIST & ANALYTICS
              <div className="flex flex-col gap-8">
                
                {/* Analytics summary row */}
                <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                  {[
                    { label: "Timeline Views", val: postAnalytics?.summary.totalViews || 0 },
                    { label: "Post Likes", val: postAnalytics?.summary.totalLikes || 0 },
                    { label: "Gifts Count", val: `${postAnalytics?.summary.totalGifts || 0} Coins` },
                    { label: "Tipped Coins", val: `${postAnalytics?.summary.totalTips || 0} Coins` },
                    { label: "Total Posts", val: postAnalytics?.summary.totalPosts || 0 },
                    { label: "Bookmarked", val: postAnalytics?.summary.totalBookmarks || 0 }
                  ].map((stat, idx) => (
                    <div key={idx} className="p-4 bg-[#0d0e12] border border-[#1a1c23] rounded-xl text-center">
                      <span className="text-[10px] text-gray-500 font-extrabold uppercase tracking-wider block">{stat.label}</span>
                      <span className="text-lg font-black text-white mt-1 block">{stat.val}</span>
                    </div>
                  ))}
                </div>

                {/* Performance chart */}
                {postAnalytics && postAnalytics.chartData.length > 0 && (
                  <div className="p-6 bg-[#0d0e12] border border-[#1a1c23] rounded-2xl">
                    <h4 className="text-xs font-black uppercase text-gray-400 mb-4 tracking-wider">Social Timeline Performance (Recent 10 posts)</h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={postAnalytics.chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                          <XAxis dataKey="title" stroke="#9ca3af" fontSize={10} />
                          <YAxis stroke="#9ca3af" fontSize={10} />
                          <Tooltip contentStyle={{ backgroundColor: "#0d0e12", borderColor: "#1f2937" }} />
                          <Legend wrapperStyle={{ fontSize: 10 }} />
                          <Bar dataKey="views" fill="#3b82f6" name="Views count" />
                          <Bar dataKey="likes" fill="#ef4444" name="Likes count" />
                          <Bar dataKey="revenue" fill="#f59e0b" name="Coin rewards" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Subheader action bar */}
                <div className="flex justify-between items-center">
                  {/* Status sub filters */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {(
                      [
                        { id: "ALL", label: "All Posts" },
                        { id: "PUBLISHED", label: "Published" },
                        { id: "DRAFT", label: "Drafts" },
                        { id: "SCHEDULED", label: "Scheduled" },
                        { id: "PINNED", label: "Pinned Only" },
                        { id: "ARCHIVED", label: "Archived" }
                      ]
                    ).map((subf) => (
                      <button 
                        key={subf.id}
                        onClick={() => setPostSubFilter(subf.id)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition border",
                          postSubFilter === subf.id
                            ? "bg-blue-600 border-blue-500 text-white"
                            : "bg-[#0d0e12] border-[#1a1c23] hover:border-zinc-800 text-gray-400 hover:text-white"
                        )}
                      >
                        {subf.label}
                      </button>
                    ))}
                  </div>

                  <button 
                    onClick={() => {
                      resetPostComposer();
                      setShowComposer(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0"
                  >
                    <Plus className="w-4 h-4" /> Create Timeline Post
                  </button>
                </div>

                {/* Creator Posts list */}
                <div className="bg-[#0d0e12] border border-[#1a1c23] rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-900/40 text-[10px] text-gray-400 font-extrabold uppercase border-b border-[#1a1c23] tracking-widest">
                          <th className="p-4">Post Info</th>
                          <th className="p-4">Format</th>
                          <th className="p-4">Visibility</th>
                          <th className="p-4">Status</th>
                          <th className="p-4">Views / Likes</th>
                          <th className="p-4">Date</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {postsList?.filter((post: any) => {
                          if (postSubFilter === "ALL") return true;
                          if (postSubFilter === "PINNED") return post.isPinned;
                          return post.status === postSubFilter;
                        }).map((post: any) => (
                          <tr key={post.id} className="border-b border-[#1a1c23] text-gray-300 hover:bg-slate-900/40 text-xs font-semibold">
                            <td className="p-4 font-bold text-white max-w-[200px] truncate">{post.title}</td>
                            <td className="p-4">
                              <span className="bg-zinc-800 text-zinc-400 font-extrabold text-[9px] uppercase px-2 py-0.5 rounded tracking-wide border border-zinc-700/50">
                                {post.type}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className="capitalize">{post.visibility.replace("_", " ").toLowerCase()}</span>
                            </td>
                            <td className="p-4">
                              <span className={cn(
                                "px-2 py-0.5 rounded text-[9px] font-extrabold uppercase",
                                post.status === "PUBLISHED" ? "bg-green-600/10 text-green-400" :
                                post.status === "DRAFT" ? "bg-zinc-600/10 text-zinc-400" : "bg-amber-600/10 text-amber-400"
                              )}>
                                {post.status}
                              </span>
                            </td>
                            <td className="p-4">{post.viewsCount} / {post.likes.length}</td>
                            <td className="p-4 text-gray-500">
                              {new Date(post.createdAt).toLocaleDateString()}
                            </td>
                            <td className="p-4 text-right flex justify-end gap-2 items-center">
                              {/* Toggle Pin */}
                              <button 
                                onClick={() => togglePinPostMutation.mutate({ postId: post.id })}
                                className={cn("p-1.5 rounded-lg border transition", post.isPinned ? "bg-blue-600/10 border-blue-500/20 text-blue-400" : "bg-zinc-900 border-zinc-800 text-gray-500 hover:text-white")}
                                title="Pin to top"
                              >
                                <Pin className="w-3.5 h-3.5" />
                              </button>

                              {/* Toggle Archive */}
                              <button 
                                onClick={() => {
                                  const nextStatus = post.status === "ARCHIVED" ? "PUBLISHED" : "ARCHIVED";
                                  updatePostMutation.mutate({ postId: post.id, status: nextStatus });
                                }}
                                className="p-1.5 bg-zinc-900 border border-zinc-800 text-gray-400 hover:text-white rounded-lg transition"
                                title={post.status === "ARCHIVED" ? "Restore" : "Archive"}
                              >
                                <Lock className="w-3.5 h-3.5" />
                              </button>

                              {/* Edit post */}
                              <button 
                                onClick={() => {
                                  setEditingPostId(post.id);
                                  setPostTitle(post.title);
                                  setPostContent(post.content);
                                  setPostType(post.type);
                                  setPostVisibility(post.visibility);
                                  setPostAllowedTierId(post.allowedTierId || "");
                                  setPostMediaUrls(JSON.parse(post.mediaUrls || "[]"));
                                  setPostPollOptions(JSON.parse(post.pollOptions || "[\"\", \"\"]"));
                                  setPostStatus(post.status);
                                  setPostScheduledFor(post.scheduledFor ? new Date(post.scheduledFor).toISOString().substring(0, 16) : "");
                                  setShowComposer(true);
                                }}
                                className="p-1.5 bg-zinc-900 border border-zinc-800 text-blue-400 hover:text-blue-300 rounded-lg transition"
                                title="Edit Post"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete post */}
                              <button 
                                onClick={() => {
                                  if (confirm("Are you sure you want to delete this post?")) {
                                    deletePostMutation.mutate({ postId: post.id });
                                  }
                                }}
                                className="p-1.5 bg-zinc-900 border border-zinc-800 text-red-400 hover:text-red-300 rounded-lg transition"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}
          </div>
        )}

        {/* Tab 14: Settings */}
        {activeTab === "settings" && (
          <div className="flex flex-col gap-6">
            <div>
              <h3 className="text-lg font-bold text-white">Creator Studio Settings</h3>
              <p className="text-xs text-gray-400 mt-1">Configure email alerts, notifications, and profile views.</p>
            </div>

            <div className="p-6 bg-[#0d0e12] border border-[#1a1c23] rounded-2xl">
              <h4 className="text-sm font-bold text-white mb-4">Ad System Configurations</h4>
              <div className="flex items-center gap-4">
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-blue-500" />
                <span className="text-xs font-bold text-gray-300">Allow platform to inject advertisement banners into free chapters</span>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Verification submission modal */}
      {showVerificationModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0d0e12] border border-[#1a1c23] w-full max-w-md rounded-2xl p-6 relative">
            <h4 className="text-lg font-black text-white mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-400" /> Submit Verification Request
            </h4>
            <p className="text-xs text-gray-400 mb-6">Enter government identification credential to request profile authentication badge.</p>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-400 font-extrabold uppercase">Government Issued ID Document number:</label>
                <input 
                  type="text" 
                  value={govId} 
                  onChange={(e) => setGovId(e.target.value)}
                  placeholder="e.g. PASSPORT-12345-US"
                  className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-400 font-extrabold uppercase">Business Entity License (Optional):</label>
                <input 
                  type="text" 
                  value={bizCert} 
                  onChange={(e) => setBizCert(e.target.value)}
                  placeholder="e.g. LLC-REG-2026"
                  className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex gap-3 justify-end mt-6">
                <button 
                  onClick={() => setShowVerificationModal(false)}
                  className="bg-[#141620] hover:bg-[#222533] border border-[#2a2e40] text-gray-300 px-4 py-2 rounded-xl text-xs font-bold uppercase"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleApplyVerification}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-extrabold uppercase"
                >
                  Submit Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Membership Tier Modal */}
      {showNewTierModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0d0e12] border border-[#1a1c23] w-full max-w-lg rounded-2xl p-6 relative">
            <h4 className="text-lg font-black text-white mb-2 flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-400" /> Create Custom Membership Tier
            </h4>
            <p className="text-xs text-gray-400 mb-6">Build subscription tiers with customized prices and benefits.</p>

            <div className="flex flex-col gap-4 overflow-y-auto max-h-[70vh] pr-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-400 font-extrabold uppercase">Tier Name:</label>
                <input 
                  type="text" 
                  value={tierName} 
                  onChange={(e) => setTierName(e.target.value)}
                  placeholder="e.g. Supporter Tier"
                  className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-400 font-extrabold uppercase">Tier Description:</label>
                <textarea 
                  value={tierDesc} 
                  onChange={(e) => setTierDesc(e.target.value)}
                  placeholder="Unlock exclusive posts and comments priority badge..."
                  className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 h-20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-gray-400 font-extrabold uppercase">Price USD ($/month):</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={tierPriceUsd} 
                    onChange={(e) => setTierPriceUsd(Number(e.target.value))}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-gray-400 font-extrabold uppercase">Price Credits (Credits/month):</label>
                  <input 
                    type="number" 
                    value={tierPriceCoins} 
                    onChange={(e) => setTierPriceCoins(Number(e.target.value))}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-400 font-extrabold uppercase">Theme Theme Color:</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="color" 
                    value={tierColor} 
                    onChange={(e) => setTierColor(e.target.value)}
                    className="w-10 h-10 border-0 bg-transparent cursor-pointer rounded"
                  />
                  <span className="text-xs font-bold text-white uppercase">{tierColor}</span>
                </div>
              </div>

              {/* Benefits Builder */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-400 font-extrabold uppercase">Benefits List:</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    value={newBenefitText}
                    onChange={(e) => setNewBenefitText(e.target.value)}
                    placeholder="e.g. Exclusive chat access"
                    className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 flex-1"
                  />
                  <button 
                    onClick={handleAddBenefit}
                    className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-xs font-bold"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 mt-2">
                  {presetBenefits.map((benefit, idx) => (
                    <button 
                      key={idx}
                      onClick={() => {
                        if (!tierBenefits.includes(benefit)) {
                          setTierBenefits([...tierBenefits, benefit]);
                        }
                      }}
                      className="bg-blue-950/20 border border-blue-500/20 hover:border-blue-500 text-blue-400 text-[10px] font-bold px-2 py-1 rounded"
                    >
                      + {benefit}
                    </button>
                  ))}
                </div>

                <div className="flex flex-col gap-1 mt-4">
                  {tierBenefits.map((benefit, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-slate-900/60 p-2 rounded border border-slate-800 text-xs">
                      <span>{benefit}</span>
                      <button onClick={() => handleRemoveBenefit(idx)} className="text-red-500 p-0.5"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4">
                <input 
                  type="checkbox" 
                  checked={isFeaturedTier} 
                  onChange={(e) => setIsFeaturedTier(e.target.checked)}
                  className="w-4 h-4 accent-blue-500" 
                />
                <span className="text-xs font-bold text-gray-300">Set as Featured Tier</span>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-[#1a1c23]">
              <button 
                onClick={() => setShowNewTierModal(false)}
                className="bg-[#141620] hover:bg-[#222533] border border-[#2a2e40] text-gray-300 px-4 py-2 rounded-xl text-xs font-bold uppercase"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateTier}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-extrabold uppercase"
              >
                Create Tier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Membership Tier Modal */}
      {showEditTierModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0d0e12] border border-[#1a1c23] w-full max-w-lg rounded-2xl p-6 relative">
            <h4 className="text-lg font-black text-white mb-2 flex items-center gap-2">
              <Edit className="w-5 h-5 text-blue-400" /> Edit Custom Membership Tier
            </h4>
            <p className="text-xs text-gray-400 mb-6">Modify tier subscription details and themes.</p>

            <div className="flex flex-col gap-4 overflow-y-auto max-h-[70vh] pr-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-400 font-extrabold uppercase">Tier Name:</label>
                <input 
                  type="text" 
                  value={tierName} 
                  onChange={(e) => setTierName(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-400 font-extrabold uppercase">Tier Description:</label>
                <textarea 
                  value={tierDesc} 
                  onChange={(e) => setTierDesc(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 h-20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-gray-400 font-extrabold uppercase">Price USD ($/month):</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={tierPriceUsd} 
                    onChange={(e) => setTierPriceUsd(Number(e.target.value))}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-gray-400 font-extrabold uppercase">Price Credits (Credits/month):</label>
                  <input 
                    type="number" 
                    value={tierPriceCoins} 
                    onChange={(e) => setTierPriceCoins(Number(e.target.value))}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-400 font-extrabold uppercase">Theme Theme Color:</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="color" 
                    value={tierColor} 
                    onChange={(e) => setTierColor(e.target.value)}
                    className="w-10 h-10 border-0 bg-transparent cursor-pointer rounded"
                  />
                  <span className="text-xs font-bold text-white uppercase">{tierColor}</span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-400 font-extrabold uppercase">Benefits List:</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    value={newBenefitText}
                    onChange={(e) => setNewBenefitText(e.target.value)}
                    placeholder="e.g. Exclusive chat access"
                    className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 flex-1"
                  />
                  <button 
                    onClick={handleAddBenefit}
                    className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-xs font-bold"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-col gap-1 mt-4">
                  {tierBenefits.map((benefit, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-slate-900/60 p-2 rounded border border-slate-800 text-xs">
                      <span>{benefit}</span>
                      <button onClick={() => handleRemoveBenefit(idx)} className="text-red-500 p-0.5"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4">
                <input 
                  type="checkbox" 
                  checked={isFeaturedTier} 
                  onChange={(e) => setIsFeaturedTier(e.target.checked)}
                  className="w-4 h-4 accent-blue-500" 
                />
                <span className="text-xs font-bold text-gray-300">Set as Featured Tier</span>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-[#1a1c23]">
              <button 
                onClick={() => setShowEditTierModal(false)}
                className="bg-[#141620] hover:bg-[#222533] border border-[#2a2e40] text-gray-300 px-4 py-2 rounded-xl text-xs font-bold uppercase"
              >
                Cancel
              </button>
              <button 
                onClick={handleEditTier}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-extrabold uppercase"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Public Goal Modal */}
      {showNewGoalModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0d0e12] border border-[#1a1c23] w-full max-w-md rounded-2xl p-6 relative">
            <h4 className="text-lg font-black text-white mb-2 flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-400" /> Create Public Creator Goal
            </h4>
            <p className="text-xs text-gray-400 mb-6">Build a target goal to display progress bar on profiles.</p>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-400 font-extrabold uppercase">Goal Title:</label>
                <input 
                  type="text" 
                  value={goalTitle} 
                  onChange={(e) => setGoalTitle(e.target.value)}
                  placeholder="e.g. Next Goal"
                  className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-400 font-extrabold uppercase">Goal Description:</label>
                <textarea 
                  value={goalDesc} 
                  onChange={(e) => setGoalDesc(e.target.value)}
                  placeholder="Reach 250 members..."
                  className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 h-20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-gray-400 font-extrabold uppercase">Goal Type:</label>
                  <select 
                    value={goalType} 
                    onChange={(e) => setGoalType(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="MEMBER">Member goal</option>
                    <option value="REVENUE">Revenue goal</option>
                    <option value="FUNDING">Funding goal</option>
                    <option value="CHAPTER">Chapter goal</option>
                    <option value="PROJECT">Project goal</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-gray-400 font-extrabold uppercase">Goal Target Amount:</label>
                  <input 
                    type="number" 
                    value={goalTarget} 
                    onChange={(e) => setGoalTarget(Number(e.target.value))}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-400 font-extrabold uppercase">Goal Reward (Completed Perks):</label>
                <input 
                  type="text" 
                  value={goalReward} 
                  onChange={(e) => setGoalReward(e.target.value)}
                  placeholder="e.g. Weekly bonus chapter."
                  className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex gap-3 justify-end mt-6">
                <button 
                  onClick={() => setShowNewGoalModal(false)}
                  className="bg-[#141620] hover:bg-[#222533] border border-[#2a2e40] text-gray-300 px-4 py-2 rounded-xl text-xs font-bold uppercase"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreateGoal}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-extrabold uppercase"
                >
                  Create Goal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Series Modal */}
      {showCreateSeriesModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4 overflow-y-auto">
          <div className="bg-[#0b0c10] border border-[#1d202f] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-8">
            <div className="p-6 border-b border-[#1d202f] flex justify-between items-center bg-[#0d0e15]">
              <div>
                <h3 className="text-lg font-extrabold text-white">Create New Series Profile</h3>
                <p className="text-xs text-gray-500 mt-1">Configure publishing credentials, media covers, and revenue splits.</p>
              </div>
              <button 
                onClick={() => setShowCreateSeriesModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSeriesSubmit} className="p-6 flex flex-col gap-6 max-h-[75vh] overflow-y-auto">
              
              {/* Type Selection */}
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setNewSeriesType("COMIC")}
                  className={cn(
                    "flex-1 p-4 rounded-xl border text-center transition-all flex flex-col items-center gap-2",
                    newSeriesType === "COMIC" 
                      ? "border-blue-500 bg-blue-500/10 text-white font-extrabold" 
                      : "border-[#1d202f] bg-[#0d0e15]/40 text-gray-400 hover:border-gray-800"
                  )}
                >
                  <BookOpen className="w-6 h-6 text-blue-500" />
                  <span className="text-xs font-bold text-gray-300">Publish Comic (Webtoon format)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setNewSeriesType("NOVEL")}
                  className={cn(
                    "flex-1 p-4 rounded-xl border text-center transition-all flex flex-col items-center gap-2",
                    newSeriesType === "NOVEL" 
                      ? "border-blue-500 bg-blue-500/10 text-white font-extrabold" 
                      : "border-[#1d202f] bg-[#0d0e15]/40 text-gray-400 hover:border-gray-800"
                  )}
                >
                  <Sparkles className="w-6 h-6 text-purple-500" />
                  <span className="text-xs font-bold text-gray-300">Publish Web Novel (Text content)</span>
                </button>
              </div>

              {/* Title Input */}
              <div className="flex flex-col gap-2">
                <label className="text-xs text-gray-400 font-extrabold uppercase">Series Title *</label>
                <input 
                  type="text"
                  required
                  value={newSeriesTitle}
                  onChange={(e) => setNewSeriesTitle(e.target.value)}
                  placeholder="e.g. Solo Leveling Extra"
                  className="bg-[#07080a] border border-[#1d202f] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 w-full"
                />
              </div>

              {/* Description Input */}
              <div className="flex flex-col gap-2">
                <label className="text-xs text-gray-400 font-extrabold uppercase">Description / Synopsis</label>
                <textarea 
                  rows={4}
                  value={newSeriesDescription}
                  onChange={(e) => setNewSeriesDescription(e.target.value)}
                  placeholder="Tell readers what your series is about..."
                  className="bg-[#07080a] border border-[#1d202f] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 w-full resize-none"
                />
              </div>

              {/* Cover Upload */}
              <div className="flex flex-col gap-2">
                <label className="text-xs text-gray-400 font-extrabold uppercase">Cover Art Image *</label>
                <div className="flex gap-4 items-center">
                  {newSeriesCoverUrl ? (
                    <img 
                      src={newSeriesCoverUrl} 
                      alt="Preview Cover" 
                      className="w-24 aspect-[3/4] rounded-lg object-cover border border-[#1d202f]"
                    />
                  ) : (
                    <div className="w-24 aspect-[3/4] bg-[#07080a] border border-dashed border-[#1d202f] rounded-lg flex items-center justify-center text-gray-600 text-xs">
                      No cover
                    </div>
                  )}
                  
                  <div className="flex-1 flex flex-col gap-2">
                    <input 
                      type="file"
                      accept="image/*"
                      onChange={handleCoverUpload}
                      disabled={isUploadingCover}
                      className="hidden"
                      id="series-cover-file-input"
                    />
                    <label 
                      htmlFor="series-cover-file-input"
                      className="bg-[#141620] hover:bg-[#222533] border border-[#2a2e40] text-white text-xs font-bold uppercase py-2.5 px-4 rounded-xl cursor-pointer inline-flex items-center gap-2 justify-center transition-all w-fit"
                    >
                      {isUploadingCover ? "Uploading Chunked Cover..." : "Upload Cover Image"}
                    </label>
                    <span className="text-[10px] text-gray-500">Specs: 300x400 aspect ratio, PNG/JPG, up to 10MB</span>
                  </div>
                </div>
              </div>

              {/* Collaborator Splits Section */}
              <div className="border-t border-[#1d202f] pt-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Revenue Share Splits Matrix</h4>
                <p className="text-[10px] text-gray-500 mb-4">You must allocate splits that sum to exactly 100%. The remaining ratio is automatically allocated to you (the creator).</p>

                {/* Splits Summary Table */}
                <div className="bg-[#07080a] border border-[#1d202f] rounded-xl overflow-hidden mb-4">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#0d0e15] border-b border-[#1d202f] text-gray-400 font-extrabold uppercase">
                        <th className="p-3">User ID</th>
                        <th className="p-3">Role</th>
                        <th className="p-3 text-right">Split Share</th>
                        <th className="p-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Creator Row */}
                      <tr className="border-b border-[#1d202f]/40 font-bold text-blue-400 bg-blue-500/5">
                        <td className="p-3 truncate max-w-[200px]">{user?.id} (You)</td>
                        <td className="p-3">Lead Creator</td>
                        <td className="p-3 text-right">
                          {100 - collaborators.reduce((acc, c) => acc + c.shareRatio, 0)}%
                        </td>
                        <td className="p-3"></td>
                      </tr>
                      {/* Collaborators Rows */}
                      {collaborators.map((c, idx) => (
                        <tr key={idx} className="border-b border-[#1d202f]/40 text-gray-300">
                          <td className="p-3 truncate max-w-[200px]">{c.userId}</td>
                          <td className="p-3">{c.roleDescription || "Collaborator"}</td>
                          <td className="p-3 text-right font-bold">{c.shareRatio}%</td>
                          <td className="p-3 text-right">
                            <button 
                              type="button"
                              onClick={() => handleRemoveCollaborator(idx)}
                              className="text-red-500 hover:text-red-400"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Add Collaborator Form */}
                <div className="bg-[#0d0e15]/40 border border-[#1d202f] p-4 rounded-xl flex flex-col gap-3">
                  <h5 className="text-[10px] font-extrabold uppercase text-gray-400">Add Project Collaborator</h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input 
                      type="text"
                      placeholder="Collaborator User ID"
                      value={newCollabUserId}
                      onChange={(e) => setNewCollabUserId(e.target.value)}
                      className="bg-[#07080a] border border-[#1d202f] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                    <input 
                      type="text"
                      placeholder="Role (e.g. Illustrator)"
                      value={newCollabRole}
                      onChange={(e) => setNewCollabRole(e.target.value)}
                      className="bg-[#07080a] border border-[#1d202f] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                    <div className="flex gap-2">
                      <input 
                        type="number"
                        placeholder="Split %"
                        value={newCollabRatio || ""}
                        onChange={(e) => setNewCollabRatio(Number(e.target.value))}
                        className="bg-[#07080a] border border-[#1d202f] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 flex-1"
                      />
                      <button 
                        type="button"
                        onClick={handleAddCollaborator}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase px-3 py-2 rounded-lg"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 justify-end border-t border-[#1d202f] pt-6">
                <button 
                  type="button"
                  onClick={() => setShowCreateSeriesModal(false)}
                  className="bg-[#141620] hover:bg-[#222533] border border-[#2a2e40] text-gray-300 px-5 py-2.5 rounded-xl text-xs font-bold uppercase transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={createSeriesMutation.isLoading || isUploadingCover}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/30 text-white px-6 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wide transition-all"
                >
                  {createSeriesMutation.isLoading ? "Creating Series..." : "Create Series"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Linked Versions Management Modal */}
      {showLinkedModal && selectedSeriesForLinking && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f1118] border border-[#222533] rounded-2xl w-full max-w-xl p-6 shadow-2xl flex flex-col gap-6">
            <div className="flex justify-between items-center pb-4 border-b border-[#1a1c24]">
              <div>
                <h4 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-500" /> Manage Linked Versions
                </h4>
                <p className="text-xs text-gray-400 mt-0.5">
                  Link Comic/Manhwa and Novel versions of <span className="text-white font-bold">{selectedSeriesForLinking.title}</span>.
                </p>
              </div>
              <button onClick={() => setShowLinkedModal(false)} className="text-gray-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {selectedSeriesForLinking.linkedSeriesId ? (
                <div className="p-4 bg-blue-950/20 border border-blue-500/20 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-blue-400">Connected Alternate Version</span>
                    <p className="text-sm font-bold text-white mt-1">
                      {seriesList?.find((s: any) => s.id === selectedSeriesForLinking.linkedSeriesId)?.title || "Linked Version"}
                    </p>
                    <p className="text-xs text-gray-400">Readers can choose between formats on the Series Information page.</p>
                  </div>
                  <button
                    onClick={() => unlinkSeriesMutation.mutate({ seriesId: selectedSeriesForLinking.id })}
                    disabled={unlinkSeriesMutation.isLoading}
                    className="bg-red-950/30 hover:bg-red-900/40 border border-red-500/30 text-red-400 text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> {unlinkSeriesMutation.isLoading ? "Unlinking..." : "Unlink"}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <p className="text-xs text-gray-400">
                    Select one of your existing series of the alternate format ({selectedSeriesForLinking.type === "NOVEL" ? "Comic / Manhwa" : "Novel"}) to link as the alternate version:
                  </p>
                  <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                    {seriesList
                      ?.filter((s: any) => s.id !== selectedSeriesForLinking.id)
                      ?.map((candidate: any) => (
                        <div key={candidate.id} className="p-3 bg-[#0a0b0e] border border-[#1a1c24] rounded-xl flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-white">{candidate.title}</p>
                            <span className="text-[10px] text-gray-400 uppercase font-bold">{candidate.type}</span>
                          </div>
                          <button
                            onClick={() => linkSeriesMutation.mutate({ seriesId: selectedSeriesForLinking.id, targetSeriesId: candidate.id })}
                            disabled={linkSeriesMutation.isLoading}
                            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider transition"
                          >
                            {linkSeriesMutation.isLoading ? "Linking..." : "Link"}
                          </button>
                        </div>
                      ))}
                    {seriesList?.filter((s: any) => s.id !== selectedSeriesForLinking.id).length === 0 && (
                      <p className="text-xs text-gray-500 text-center py-4">No other series available to link.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-[#1a1c24]">
              <button
                onClick={() => setShowLinkedModal(false)}
                className="bg-[#141620] hover:bg-[#222533] border border-[#2a2e40] text-gray-300 px-5 py-2 rounded-xl text-xs font-bold uppercase transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Publishing & Series Status Management Modal */}
      {showStatusModal && selectedSeriesForStatus && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0b0d13] border border-[#1e2230] rounded-3xl w-full max-w-2xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6 my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex justify-between items-start pb-4 border-b border-[#1a1c24]">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <Settings className="w-5 h-5" />
                  </span>
                  <div>
                    <h4 className="text-xl font-extrabold text-white tracking-tight">
                      Publishing & Series Status
                    </h4>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Manage series status, notify followers, and preview reader presentation.
                    </p>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setShowStatusModal(false)} 
                className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-slate-800/60 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Series Summary Header */}
            <div className="p-4 bg-[#121520] border border-[#1e2336] rounded-2xl flex items-center gap-4">
              <img 
                src={selectedSeriesForStatus.coverUrl || "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=300&auto=format&fit=crop"} 
                alt={selectedSeriesForStatus.title} 
                className="w-14 aspect-[3/4] rounded-lg object-cover bg-slate-900 border border-slate-800"
              />
              <div className="flex-1 min-w-0">
                <h5 className="font-extrabold text-white text-base truncate">{selectedSeriesForStatus.title}</h5>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 flex-wrap">
                  <span className="text-gray-300 font-semibold">{selectedSeriesForStatus.type}</span>
                  <span>•</span>
                  <span>{selectedSeriesForStatus.genre || "Fantasy"}</span>
                  <span>•</span>
                  <span className="text-gray-500">
                    Last updated: {selectedSeriesForStatus.statusUpdatedAt ? new Date(selectedSeriesForStatus.statusUpdatedAt).toLocaleDateString() : "Recently"}
                  </span>
                </div>
              </div>
            </div>

            {/* Status Option Grid */}
            <div className="flex flex-col gap-3">
              <label className="text-xs font-extrabold text-gray-300 uppercase tracking-wider flex items-center justify-between">
                <span>Select New Status *</span>
                <span className="text-[11px] text-gray-500 font-normal lowercase">5 supported statuses</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { key: "ONGOING", label: "Ongoing", color: "text-emerald-400", border: "border-emerald-500", bg: "bg-emerald-500/10", dot: "#10b981", desc: "Active releases & chapters dropping on regular schedule" },
                  { key: "COMING_SOON", label: "Coming Soon", color: "text-blue-400", border: "border-blue-500", bg: "bg-blue-500/10", dot: "#3b82f6", desc: "Announced or preparing for initial debut launch" },
                  { key: "HIATUS", label: "Hiatus", color: "text-orange-400", border: "border-orange-500", bg: "bg-orange-500/10", dot: "#f97316", desc: "Taking a temporary break / creator recovery rest" },
                  { key: "SEASON_ENDED", label: "Season Ended", color: "text-gray-400", border: "border-gray-500", bg: "bg-gray-500/10", dot: "#6b7280", desc: "Current season storyline officially completed" },
                  { key: "NEW_SEASON_COMING", label: "New Season Coming", color: "text-purple-400", border: "border-purple-500", bg: "bg-purple-500/10", dot: "#a855f7", desc: "Returning soon with a brand new season arc" },
                ].map((st: any) => {
                  const isSelected = newSeriesStatus === st.key;
                  return (
                    <button
                      key={st.key}
                      type="button"
                      onClick={() => setNewSeriesStatus(st.key as any)}
                      className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-2 ${
                        isSelected 
                          ? `${st.bg} ${st.border} shadow-lg shadow-${st.border}/10 ring-1 ring-${st.border}` 
                          : "bg-[#121520]/60 border-[#1c202e] hover:bg-[#161a28] hover:border-[#2a3045]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: st.dot }}></span>
                          <span className={`text-sm font-extrabold ${isSelected ? st.color : "text-white"}`}>
                            {st.label}
                          </span>
                        </div>
                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-emerald-500 text-black flex items-center justify-center text-xs font-black">
                            ✓
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">
                        {st.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Optional Season Number for Season Ended */}
            {newSeriesStatus === "SEASON_ENDED" && (
              <div className="p-4 bg-[#121520] border border-[#1e2336] rounded-2xl flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-white">Completed Season Number</label>
                  <p className="text-[11px] text-gray-400">Specifies which season officially completed in the reader notification.</p>
                </div>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={statusSeasonNum}
                  onChange={(e) => setStatusSeasonNum(Math.max(1, Number(e.target.value)))}
                  className="bg-[#090a0f] border border-slate-800 rounded-xl px-3 py-2 text-sm font-bold text-white w-20 text-center focus:outline-none focus:border-blue-500"
                />
              </div>
            )}

            {/* Announcement / Message Input */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-extrabold text-gray-300 uppercase tracking-wider flex items-center justify-between">
                <span>Optional Announcement / Creator Note</span>
                <span className="text-[11px] text-gray-500 font-normal">Displayed to readers on series page</span>
              </label>
              <textarea
                value={statusAnnouncement}
                onChange={(e) => setStatusAnnouncement(e.target.value)}
                placeholder="e.g. Taking a 3-week break to prepare Season 2. Thank you for reading and support!"
                maxLength={500}
                rows={3}
                className="w-full bg-[#0d0e14] border border-[#1f2334] rounded-2xl p-3.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition resize-none"
              />
              <div className="flex justify-between text-[11px] text-gray-500 px-1">
                <span>Included in notifications and pinned to the series page notice board.</span>
                <span>{statusAnnouncement.length}/500</span>
              </div>
            </div>

            {/* Optional Schedule Status Change */}
            <div className="p-4 bg-[#121520] border border-[#1e2336] rounded-2xl flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-blue-400" /> Schedule Status Change (Optional)
                  </span>
                  <p className="text-[11px] text-gray-400 mt-0.5">Plan future status transitions in advance.</p>
                </div>
                <input
                  type="checkbox"
                  checked={scheduleStatusChange}
                  onChange={(e) => setScheduleStatusChange(e.target.checked)}
                  className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                />
              </div>

              {scheduleStatusChange && (
                <div className="pt-2 border-t border-slate-800/80">
                  <input
                    type="datetime-local"
                    value={scheduledStatusDate}
                    onChange={(e) => setScheduledStatusDate(e.target.value)}
                    className="bg-[#090a0f] border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white w-full focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}
            </div>

            {/* Live Reader Preview Box */}
            <div className="p-4 sm:p-5 bg-gradient-to-br from-[#101320] to-[#0c0d14] border border-[#202538] rounded-2xl flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-slate-800/60 pb-2.5">
                <span className="text-xs font-extrabold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" /> Live Reader Preview
                </span>
                <span className="text-[10px] text-gray-500 uppercase font-bold">What fans see</span>
              </div>

              <div className="flex items-center gap-3">
                <span className={`text-xs font-extrabold uppercase px-3 py-1 rounded-full flex items-center gap-2 ${getStatusBadgeConfig(newSeriesStatus).bg} ${getStatusBadgeConfig(newSeriesStatus).color} ${getStatusBadgeConfig(newSeriesStatus).border}`}>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getStatusBadgeConfig(newSeriesStatus).dot }}></span>
                  {getStatusBadgeConfig(newSeriesStatus).label}
                </span>
                <span className="text-xs text-gray-300 font-bold">{selectedSeriesForStatus.title}</span>
              </div>

              {statusAnnouncement.trim() && (
                <div className="p-3 bg-amber-950/20 border border-amber-500/20 rounded-xl">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 block mb-0.5">
                    📢 Creator Status Notice
                  </span>
                  <p className="text-xs text-amber-200/90 italic leading-relaxed">
                    "{statusAnnouncement.trim()}"
                  </p>
                </div>
              )}

              <div className="p-2.5 bg-slate-950/60 border border-slate-900 rounded-xl text-[11px] text-gray-400 flex items-center gap-2">
                <Bell className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>
                  All series followers and creator subscribers will receive an instant notification.
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end items-center gap-3 pt-4 border-t border-[#1a1c24]">
              <button
                type="button"
                onClick={() => setShowStatusModal(false)}
                className="bg-[#141620] hover:bg-[#222533] border border-[#2a2e40] text-gray-300 px-5 py-2.5 rounded-xl text-xs font-extrabold uppercase transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  updateStatusMutation.mutate({
                    seriesId: selectedSeriesForStatus.id,
                    status: newSeriesStatus,
                    statusMessage: statusAnnouncement.trim() || null,
                    seasonNumber: newSeriesStatus === "SEASON_ENDED" ? statusSeasonNum : undefined,
                  });
                }}
                disabled={updateStatusMutation.isLoading}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition shadow-lg shadow-emerald-900/30"
              >
                {updateStatusMutation.isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Publishing...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" /> Publish Status Update
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </WorkspaceLayout>
  );
}
