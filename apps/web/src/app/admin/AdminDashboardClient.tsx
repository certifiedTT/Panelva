"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Shield, Crown, Users, Flag, Eye, DollarSign, 
  Trash2, UserPlus, BarChart3, CreditCard, FileText, Ticket, LayoutGrid, Check, X, Star,
  Settings, Activity, RefreshCw, AlertTriangle, Bell, Clock, Info, HelpCircle
} from "lucide-react";
import { trpc } from "../../lib/trpc";
import { Card, Button, Badge } from "@panelva/ui";
import { hasPermission, Permission } from "@panelva/api";
import RoleBadge from "@/components/RoleBadge";
import {
  getRoleDisplayName,
  isAdminRole,
} from "../../lib/roleUtils";
import { useAuth } from "../../components/AuthContext";
import { WorkspaceLayout, WorkspaceNavGroup } from "../../components/workspace/WorkspaceLayout";

export default function AdminDashboardClient() {
  const {
    user,
    role: userRole,
    actualRole,
    previewRole,
    setPreviewRole,
    clearPreviewRole,
    isLoading
  } = useAuth();

  const isMasterAdmin = userRole === "MASTER_ADMIN";
  const isAdmin = isAdminRole(userRole || "USER");

  const router = useRouter();
  const currentUser = user?.username || "Guest";
  const previewActive = !!(previewRole && actualRole === "MASTER_ADMIN");
  const [activeTab, setActiveTab] = useState<string>("overview");

  const handlePreviewRoleChange = (role: string) => {
    if (role === "ACTUAL") {
      clearPreviewRole();
    } else {
      setPreviewRole(role);
    }
    // Reload to propagate headers and state
    window.location.reload();
  };
  
  // Sub-tabs for Applications
  const [appSubTab, setAppSubTab] = useState<"creator" | "monetization" | "verification">("creator");

  // Sub-tabs for Finance Operations
  const [financeSubTab, setFinanceSubTab] = useState<"earnings" | "payouts" | "transactions" | "reports">("earnings");

  // Form states for creating admin
  const [inviteEmailOrUsername, setInviteEmailOrUsername] = useState("");
  const [inviteRole, setInviteRole] = useState<string>("ADMIN");

  // Form states for promos
  const [newPromoCode, setNewPromoCode] = useState("");
  const [newPromoType, setNewPromoType] = useState<"PLUS" | "PREMIUM">("PLUS");
  const [newPromoDuration, setNewPromoDuration] = useState("30 Days");
  
  // Note inputs for review
  const [reviewNote, setReviewNote] = useState("");

  // Expanded Revenue Analytics states and mock metrics (Requirement 4 & 5)
  const [revDateRange, setRevDateRange] = useState("Last 30 Days");
  const [revSource, setRevSource] = useState("All Sources");
  const [revTier, setRevTier] = useState("All Tiers");
  const [revRegion, setRevRegion] = useState("All Regions");
  const [revProvider, setRevProvider] = useState("All Providers");
  const [isRefreshingRevenue, setIsRefreshingRevenue] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const handleExportData = (format: string) => {
    alert(`Exporting Revenue Report as ${format} with active filters:\n- Date Range: ${revDateRange}\n- Source: ${revSource}\n- Tier: ${revTier}\n- Region: ${revRegion}\n- Provider: ${revProvider}`);
  };

  const handleRefreshRevenue = () => {
    setIsRefreshingRevenue(true);
    setTimeout(() => {
      setIsRefreshingRevenue(false);
      alert("Revenue Analytics database metrics synchronized successfully.");
    }, 800);
  };

  // TRPC queries
  const { data: creatorApps, refetch: refetchApps } = (trpc.admin.getPendingApplications as any).useQuery();
  const { data: safetyReports, refetch: refetchReports } = (trpc.admin.getSafetyReports as any).useQuery();
  const { data: monetizationApps, refetch: refetchMonetization } = (trpc.admin.listMonetizationApplications as any).useQuery();
  const { data: verificationApps, refetch: refetchVerification } = (trpc.admin.listVerificationRequests as any).useQuery();
  const { data: seriesList } = (trpc.series.getCreatorSeries as any).useQuery();

  const { data: dbAdminNotifications, refetch: refetchAdminNotifications } = (trpc.admin.getAdminNotifications as any).useQuery(undefined, {
    enabled: userRole !== "USER" && userRole !== "CREATOR",
  });

  const markReadMutation = trpc.admin.markAdminNotificationRead.useMutation({
    onSuccess: () => refetchAdminNotifications(),
  });

  const bulkMarkReadMutation = trpc.admin.bulkMarkAdminNotificationsRead.useMutation({
    onSuccess: () => refetchAdminNotifications(),
  });

  const filteredNotifications = (dbAdminNotifications || []).filter((notif: any) => {
    if (selectedCategories.length === 0) return true;
    return selectedCategories.includes(notif.category);
  });

  // Mutations
  const vetAppMutation = trpc.creator.vetApplication.useMutation({
    onSuccess: () => {
      refetchApps();
      setReviewNote("");
      alert("Application processed successfully.");
    }
  });

  const reviewMonetizationMutation = trpc.admin.reviewMonetizationApplication.useMutation({
    onSuccess: () => {
      refetchMonetization();
      setReviewNote("");
      alert("Monetization review submitted.");
    }
  });

  const reviewVerificationMutation = trpc.admin.reviewVerificationRequest.useMutation({
    onSuccess: () => {
      refetchVerification();
      setReviewNote("");
      alert("Verification request updated.");
    }
  });

  const toggleFeaturedMutation = trpc.admin.toggleFeaturedCreator.useMutation({
    onSuccess: () => {
      refetchVerification();
      refetchMonetization();
      alert("Featured status updated.");
    }
  });

  const batchResolveReportsMutation = trpc.admin.batchResolveReports.useMutation({
    onSuccess: () => {
      refetchReports();
      alert("Reports marked as resolved.");
    }
  });

  // Admin Invitation mutation
  const inviteAdminMutation = trpc.admin.inviteAdmin.useMutation({
    onSuccess: (data: any) => {
      alert(`Success! User @${data.username} (${data.email}) role has been set to: ${data.role}`);
      setInviteEmailOrUsername("");
      
      // Update local staff list mock view
      const newStaffItem = {
        username: data.username,
        email: data.email,
        joined: "Just now",
        role: data.role,
        avatar: data.username.charAt(0).toUpperCase()
      };
      setStaff([newStaffItem, ...staff]);
    },
    onError: (err: any) => {
      alert(`Error inviting admin: ${err.message}`);
    }
  });

  // Local state mocks
  const [payouts, setPayouts] = useState<any[]>([
    { id: "pay-1", creator: "MangaCreatorPro", amount: "$145.20", status: "PENDING", date: "3 hours ago" },
    { id: "pay-2", creator: "ArtistLine", amount: "$84.00", status: "COMPLETED", date: "2 days ago" }
  ]);

  const [promoCodes, setPromoCodes] = useState<any[]>([
    { code: "PLUS30D1", type: "PLUS", duration: "30 Days", status: "Active", createdBy: "notjud3", date: "1 day ago" },
    { code: "PREM60D2", type: "PREMIUM", duration: "60 Days", status: "Redeemed", createdBy: "TO30", date: "2 days ago" }
  ]);

  const [staff, setStaff] = useState<any[]>([
    { username: "TO30", email: "tobidavid140@gmail.com", joined: "3 months ago", role: "ADMIN", avatar: "T" },
    { username: "notjud3", email: "iseniyijude@gmail.com", joined: "15 days ago", role: "MASTER_ADMIN", avatar: "n" }
  ]);

  const [users, setUsers] = useState<any[]>([
    { username: "PixelArtist", email: "pixel@gmail.com", role: "CREATOR", joined: "1 month ago" },
    { username: "NovelistMax", email: "max@gmail.com", role: "CREATOR", joined: "2 weeks ago" },
    { username: "ReaderBob", email: "bob@gmail.com", role: "USER", joined: "5 days ago" }
  ]);

  const [creators, setCreators] = useState<any[]>([
    { penName: "VillainWriter", email: "villain@panelva.com", type: "WRITER", vetted: true, monetized: true, followers: 1540, views: 125000 },
    { penName: "DuchessPen", email: "duchess@panelva.com", type: "NOVELIST", vetted: true, monetized: true, followers: 890, views: 94000 },
    { penName: "Lee Jehwan", email: "lee@panelva.com", type: "ARTIST", vetted: true, monetized: false, followers: 4200, views: 390000 },
    { penName: "AstroDraw", email: "astro@gmail.com", type: "ILLUSTRATOR", vetted: false, monetized: false, followers: 120, views: 8000 }
  ]);

  const { data: dbAuditLogs } = (trpc.admin.getAuditLogs as any).useQuery(undefined, {
    enabled: activeTab === "admin_logs" && isMasterAdmin,
  });
  const auditLogs = dbAuditLogs || [];

  const formatLogDetails = (detailsStr: string) => {
    try {
      const details = JSON.parse(detailsStr);
      return Object.entries(details)
        .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`)
        .join(", ");
    } catch {
      return detailsStr;
    }
  };

  const [healthMetrics, setHealthMetrics] = useState({
    apiUptime: "99.98%",
    dbLatency: "14ms",
    queueStatus: "0 tasks pending",
    stripeStatus: "Operational",
    adNetworkStatus: "Healthy",
    storageUsage: "42%",
    errorRate: "0.04%",
    activeUsers: 842
  });

  const [platformSettings, setPlatformSettings] = useState({
    maintenanceMode: false,
    lockNewUploads: false,
    emergencyLock: false,
    waitForFreeDays: 7
  });

  const [featuredCreators, setFeaturedCreators] = useState<any[]>([
    { id: "feat-1", name: "VillainWriter", type: "WRITER", featured: true },
    { id: "feat-2", name: "DuchessPen", type: "NOVELIST", featured: true },
    { id: "feat-3", name: "Lee Jehwan", type: "ARTIST", featured: false }
  ]);

  const [notificationsList, setNotificationsList] = useState<any[]>([
    { id: "notif-1", title: "Supabase Connection Checked", message: "Supabase connection is healthy and operating within limits.", date: "10 mins ago", type: "health" },
    { id: "notif-2", title: "Backup completed successfully", message: "Automated daily snapshot backup saved to primary region storage.", date: "2 hours ago", type: "system" },
    { id: "notif-3", title: "New high-priority report", message: "User reported a potential copyright issue in Series 'Doom Breaker S2'.", date: "5 hours ago", type: "moderation" }
  ]);

  const platformStats = {
    totalUsers: 14205,
    totalCreators: 894,
    monetizedCreators: 342,
    verifiedCreators: 156,
    activeReaders: 8904,
    publishedSeries: 124,
    publishedChapters: 4850
  };

  // Dynamic scaling factor based on active filters
  const getScaleFactor = () => {
    let factor = 1.0;
    
    // 1. Date Range
    switch (revDateRange) {
      case "Today": factor *= 0.03; break;
      case "Last 7 Days": factor *= 0.23; break;
      case "Last 30 Days": factor *= 1.0; break;
      case "Last 90 Days": factor *= 2.8; break;
      case "Last Year": factor *= 11.5; break;
    }
    
    // 2. Revenue Stream
    switch (revSource) {
      case "All Sources": break;
      case "Subscriptions": factor *= 0.45; break;
      case "Ad Revenue": factor *= 0.15; break;
      case "Credit purchases": factor *= 0.25; break;
      case "Tips & Gifts": factor *= 0.15; break;
    }
    
    // 3. Subscription Tier
    switch (revTier) {
      case "All Tiers": break;
      case "Panelva Plus": factor *= 0.35; break;
      case "Premium User": factor *= 0.65; break;
    }
    
    // 4. Region
    switch (revRegion) {
      case "All Regions": break;
      case "North America": factor *= 0.42; break;
      case "Europe": factor *= 0.28; break;
      case "Asia": factor *= 0.20; break;
      case "Latin America": factor *= 0.10; break;
    }
    
    // 5. Payment Provider
    switch (revProvider) {
      case "All Providers": break;
      case "Stripe": factor *= 0.50; break;
      case "Apple Pay": factor *= 0.30; break;
      case "Google Pay": factor *= 0.20; break;
    }
    
    return factor;
  };

  const scale = getScaleFactor();

  // Dynamic calculations for revenueStats
  const getDynamicStats = () => {
    let baseScale = 1.0;
    
    switch (revDateRange) {
      case "Today": baseScale *= 0.03; break;
      case "Last 7 Days": baseScale *= 0.23; break;
      case "Last 30 Days": baseScale *= 1.0; break;
      case "Last 90 Days": baseScale *= 2.8; break;
      case "Last Year": baseScale *= 11.5; break;
    }
    
    switch (revRegion) {
      case "All Regions": break;
      case "North America": baseScale *= 0.42; break;
      case "Europe": baseScale *= 0.28; break;
      case "Asia": baseScale *= 0.20; break;
      case "Latin America": baseScale *= 0.10; break;
    }
    
    switch (revProvider) {
      case "All Providers": break;
      case "Stripe": baseScale *= 0.50; break;
      case "Apple Pay": baseScale *= 0.30; break;
      case "Google Pay": baseScale *= 0.20; break;
    }

    let grossMembership = 24500.00 * baseScale;
    let grossGift = 18200.00 * baseScale;
    let grossTip = 8900.00 * baseScale;
    let grossPremium = 23200.00 * baseScale;
    let grossAd = 12850.00 * baseScale;
    let grossOther = 10800.00 * baseScale; // promo + licensing

    if (revSource === "Subscriptions") {
      grossGift = 0; grossTip = 0; grossPremium = 0; grossAd = 0; grossOther = 0;
      if (revTier === "Panelva Plus") {
        grossMembership *= 0.35;
      } else if (revTier === "Premium User") {
        grossMembership *= 0.65;
      }
    } else if (revSource === "Ad Revenue") {
      grossMembership = 0; grossGift = 0; grossTip = 0; grossPremium = 0; grossOther = 0;
    } else if (revSource === "Credit purchases") {
      grossMembership = 0; grossGift = 0; grossTip = 0; grossAd = 0; grossOther = 0;
    } else if (revSource === "Tips & Gifts") {
      grossMembership = 0; grossAd = 0; grossPremium = 0; grossOther = 0;
    }

    const totalPlatformRevenue = grossMembership + grossGift + grossTip + grossPremium + grossAd + grossOther;
    const totalCreatorEarnings = (grossMembership + grossGift + grossTip + grossPremium + grossOther) * 0.75;
    const totalPlatformCommission = (grossMembership + grossGift + grossTip + grossPremium + grossOther) * 0.25;
    
    const today = totalPlatformRevenue * 0.03;
    const monthly = totalPlatformRevenue;
    const pendingPayouts = totalCreatorEarnings * 0.025;
    const completedPayouts = totalCreatorEarnings * 0.20;

    const mrr = grossMembership * 0.75;
    const arr = mrr * 12;

    const arpu = revSource === "All Sources" ? 6.93 : 6.93 * (totalPlatformRevenue / (98450.00 * baseScale));
    const arppu = revSource === "All Sources" ? 28.75 : 28.75 * (totalPlatformRevenue / (98450.00 * baseScale));

    const fmt = (val: number) => `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    return {
      today: fmt(today),
      monthly: fmt(monthly),
      pendingPayouts: fmt(pendingPayouts),
      completedPayouts: fmt(completedPayouts),
      membership: fmt(grossMembership),
      gift: fmt(grossGift),
      tip: fmt(grossTip),
      premium: fmt(grossPremium),
      totalPlatformRevenue: fmt(totalPlatformRevenue),
      totalAdvertisingRevenue: fmt(grossAd),
      totalCreatorEarnings: fmt(totalCreatorEarnings),
      totalPlatformCommission: fmt(totalPlatformCommission),
      mrr: fmt(mrr),
      arr: fmt(arr),
      arpu: `$${arpu.toFixed(2)}`,
      arppu: `$${arppu.toFixed(2)}`
    };
  };

  const revenueStats = getDynamicStats();

  // Dynamic calculations for revenueStreams
  const rawRevenueStreams = [
    { source: "Premium Subscriptions", type: "Subscriptions", tier: "Premium User", gross: 16200, net: 12150, platformShare: 4050, creatorShare: 12150, growth: "+14.2%" },
    { source: "Panelva Plus Subscriptions", type: "Subscriptions", tier: "Panelva Plus", gross: 8300, net: 6225, platformShare: 2075, creatorShare: 6225, growth: "+8.7%" },
    { source: "AdSense Advertising Revenue", type: "Ad Revenue", tier: "All Tiers", gross: 10500, net: 10500, platformShare: 10500, creatorShare: 0, growth: "+21.5%" },
    { source: "Chapter Ad Unlocks", type: "Ad Revenue", tier: "All Tiers", gross: 2350, net: 1762.50, platformShare: 587.50, creatorShare: 1762.50, growth: "+4.1%" },
    { source: "Credit Sales (Virtual Currency)", type: "Credit purchases", tier: "All Tiers", gross: 23200, net: 17400, platformShare: 5800, creatorShare: 17400, growth: "+11.3%" },
    { source: "Creator Tips & Gifts", type: "Tips & Gifts", tier: "All Tiers", gross: 18200, net: 13650, platformShare: 4550, creatorShare: 13650, growth: "+5.6%" },
    { source: "Direct Tips Support", type: "Tips & Gifts", tier: "All Tiers", gross: 8900, net: 6675, platformShare: 2225, creatorShare: 6675, growth: "+6.2%" },
    { source: "Promotional Campaigns", type: "Promotional", tier: "All Tiers", gross: 1800, net: 1350, platformShare: 450, creatorShare: 1350, growth: "+0.8%" },
    { source: "Licensing & Partnerships", type: "Other", tier: "All Tiers", gross: 9000, net: 6750, platformShare: 2250, creatorShare: 6750, growth: "+18.0%" }
  ];

  const filteredStreams = rawRevenueStreams.filter(stream => {
    if (revSource !== "All Sources" && stream.type !== revSource) return false;
    if (revTier !== "All Tiers" && stream.tier !== "All Tiers" && stream.tier !== revTier) return false;
    return true;
  });

  const totalGrossFiltered = filteredStreams.reduce((sum, s) => sum + s.gross, 0);

  const revenueStreams = filteredStreams.map(s => {
    const grossVal = s.gross * scale;
    const netVal = s.net * scale;
    const platformShareVal = s.platformShare * scale;
    const creatorShareVal = s.creatorShare * scale;
    const contrib = totalGrossFiltered > 0 ? (s.gross / totalGrossFiltered) * 100 : 0;
    
    return {
      source: s.source,
      gross: `$${grossVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      net: `$${netVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      platformShare: `$${platformShareVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      creatorShare: `$${creatorShareVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      contribution: `${contrib.toFixed(1)}%`,
      growth: s.growth
    };
  });

  // Dynamic calculations for revenueTrendData
  const baseTrendData = [
    { label: "Mon", value: 120 },
    { label: "Tue", value: 180 },
    { label: "Wed", value: 240 },
    { label: "Thu", value: 210 },
    { label: "Fri", value: 310 },
    { label: "Sat", value: 380 },
    { label: "Sun", value: 340 }
  ];

  const revenueTrendData = baseTrendData.map(d => {
    let scaleVar = scale;
    if (revRegion !== "All Regions") scaleVar *= 1.05;
    const calculatedValue = Math.round(d.value * scaleVar * 10) / 10;
    const heightPercent = Math.min(100, Math.max(10, (d.value / 380) * 100));
    return {
      label: d.label,
      value: calculatedValue,
      height: `${heightPercent.toFixed(0)}%`
    };
  });

  // Dynamic calculations for topPerformingSeries
  const baseTopSeries = [
    { title: "Doom Breaker", creator: "BlueArtist", baseRevenue: 14200 },
    { title: "Tower of God", creator: "SIU", baseRevenue: 11850 },
    { title: "Solo Leveling", creator: "Chugong", baseRevenue: 9400 },
    { title: "God of Highschool", creator: "Yongje Park", baseRevenue: 7200 }
  ];

  const totalBaseTopSeries = baseTopSeries.reduce((sum, s) => sum + s.baseRevenue, 0);

  const topPerformingSeries = baseTopSeries.map(s => {
    const revVal = s.baseRevenue * scale;
    const sharePercent = totalBaseTopSeries > 0 ? (s.baseRevenue / totalBaseTopSeries) * 100 : 0;
    return {
      title: s.title,
      creator: s.creator,
      revenue: `$${revVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      share: `${sharePercent.toFixed(1)}%`
    };
  });

  // Dynamic calculations for regionalRevenue
  const baseRegionalRevenue = [
    { region: "North America", baseShare: 0.42, baseVal: 41350 },
    { region: "Europe", baseShare: 0.28, baseVal: 27560 },
    { region: "Asia", baseShare: 0.20, baseVal: 19690 },
    { region: "Latin America", baseShare: 0.10, baseVal: 9850 }
  ];

  const filteredRegionList = baseRegionalRevenue.filter(r => {
    if (revRegion !== "All Regions" && r.region !== revRegion) return false;
    return true;
  });

  const totalRegionVal = filteredRegionList.reduce((sum, r) => sum + r.baseVal, 0);

  const regionalRevenue = filteredRegionList.map(r => {
    const val = r.baseVal * scale;
    const share = totalRegionVal > 0 ? (r.baseVal / totalRegionVal) * 100 : 0;
    return {
      region: r.region,
      value: `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      share: `${share.toFixed(0)}%`
    };
  });

  const moderationStats = {
    pendingApplications: creatorApps?.length || 0,
    pendingVerifications: verificationApps?.length || 0,
    pendingSafetyReports: safetyReports?.length || 0,
    flaggedContent: 3,
    copyrightReports: 1
  };

  const liveActivities = [
    { text: "New creator application from @AstroDraw", time: "2 mins ago", type: "info" },
    { text: "Creator @DuchessPen approved for monetization", time: "15 mins ago", type: "success" },
    { text: "Monetization approved for @MangaArtist", time: "1 hour ago", type: "success" },
    { text: "Large payout of $1,200.00 processed for @LeeJehwan", time: "3 hours ago", type: "success" },
    { text: "User @TrollBot reported for Harassment in Comments", time: "4 hours ago", type: "warning" },
    { text: "Series 'Forbidden Spell' removed due to Copyright Claim", time: "6 hours ago", type: "danger" },
    { text: "Featured creator @SIU selected for Spotlight", time: "1 day ago", type: "info" }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 p-8 flex flex-col gap-6 animate-pulse" role="status" aria-label="Loading Admin Command Center">
        <div className="h-16 bg-slate-900 rounded-xl border border-slate-800" />
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="h-20 bg-slate-900 rounded-xl border border-slate-800" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-72 bg-slate-900 rounded-2xl border border-slate-800" />
          <div className="h-72 bg-slate-900 rounded-2xl border border-slate-800" />
          <div className="h-72 bg-slate-900 rounded-2xl border border-slate-800" />
        </div>
      </div>
    );
  }


  const handleResolveReport = (id: string) => {
    batchResolveReportsMutation.mutate({ reportIds: [id] });
  };

  const handleApprovePayout = (id: string) => {
    setPayouts(payouts.map(p => p.id === id ? { ...p, status: "COMPLETED" } : p));
    alert(`Payout processed successfully.`);
  };

  const handleGeneratePromo = (e: React.FormEvent) => {
    e.preventDefault();
    const code = newPromoCode.trim().toUpperCase() || Math.random().toString(36).substring(2, 10).toUpperCase();
    const newPromo = {
      code,
      type: newPromoType,
      duration: newPromoDuration,
      status: "Active",
      createdBy: currentUser,
      date: "Just now"
    };
    setPromoCodes([newPromo, ...promoCodes]);
    setNewPromoCode("");
    alert(`Promo Code "${code}" created successfully.`);
  };

  const handleInviteAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmailOrUsername.trim()) return;

    inviteAdminMutation.mutate({
      emailOrUsername: inviteEmailOrUsername.trim(),
      role: inviteRole as any
    });
  };

  const handleToggleFeatured = (id: string) => {
    setFeaturedCreators(featuredCreators.map(fc => fc.id === id ? { ...fc, featured: !fc.featured } : fc));
    alert("Featured creators updated successfully.");
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-8 text-center font-sans">
        <Card className="p-8 max-w-sm flex flex-col items-center gap-4 text-center">
          <Shield className="w-16 h-16 text-red-500" />
          <h2 className="text-xl font-bold text-white">Access Denied</h2>
          <p className="text-xs text-slate-400 leading-relaxed">You do not have administrative credentials to access the Panelva Command Center.</p>
          <Link href="/" className="w-full mt-4">
            <Button variant="primary" fullWidth size="md">
              Return to Home
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  // Helper check to check if tab is active/authorized (Requirement 13)
  const isTabAuthorized = (tabId: string) => {
    if (userRole === "USER" || userRole === "CREATOR") return false;
    if (tabId === "notifications") return true;

    const permissionMap: Record<string, Permission> = {
      overview: "users.view",
      users: "users.view",
      creators: "creators.view",
      applications: "applications.review",
      series: "series.review",
      community: "community.manage",
      reports: "reports.manage",
      support: "support.manage",
      revenue: "finance.view",
      payouts: "payouts.manage",
      promos: "promotions.manage",
      featured_creators: "series.feature",
      partnerships: "partnerships.manage",
      admin_management: "admins.manage",
      admin_logs: "audit.view",
      platform_settings: "settings.manage",
      system_health: "settings.manage",
    };

    const reqPermission = permissionMap[tabId];
    if (!reqPermission) return false;
    return hasPermission(userRole, reqPermission);
  };

  const adminGroups: WorkspaceNavGroup[] = [
    {
      id: "overview",
      label: "Overview",
      items: [
        { id: "overview", label: "Dashboard & Metrics", icon: BarChart3, authorized: isTabAuthorized("overview") },
      ],
    },
    {
      id: "management",
      label: "Management",
      items: [
        { id: "users", label: "User Directory", icon: Users, authorized: isTabAuthorized("users") },
        { id: "creators", label: "Creator Directory", icon: Users, authorized: isTabAuthorized("creators") },
        { id: "applications", label: "Creator Applications", icon: FileText, authorized: isTabAuthorized("applications"), badge: creatorApps?.length },
        { id: "safety", label: "Safety Center", icon: Flag, authorized: isTabAuthorized("safety"), badge: safetyReports?.length, badgeVariant: "error" },
        { id: "series", label: "Series Registry", icon: LayoutGrid, authorized: isTabAuthorized("series") },
      ],
    },
    {
      id: "finance",
      label: "Finance Center",
      items: [
        { id: "revenue", label: "Platform Earnings", icon: DollarSign, authorized: isTabAuthorized("revenue") },
        { id: "payouts", label: "Creator Payouts", icon: CreditCard, authorized: isTabAuthorized("payouts"), badge: payouts.filter(p => p.status === "PENDING").length || undefined, badgeVariant: "warning" },
      ],
    },
    {
      id: "marketing",
      label: "Marketing & Growth",
      items: [
        { id: "featured_creators", label: "Featured Spotlight", icon: Star, authorized: isTabAuthorized("featured_creators") },
        { id: "promos", label: "Promo Codes", icon: Ticket, authorized: isTabAuthorized("promos") },
        { id: "notifications", label: "Alerts & Logs", icon: Bell, authorized: isTabAuthorized("notifications"), badge: (dbAdminNotifications as any[])?.filter((n: any) => !n.isRead)?.length || undefined },
      ],
    },
    {
      id: "system",
      label: "System & Governance",
      items: [
        { id: "admin_management", label: "Staff & Invitations", icon: UserPlus, authorized: isTabAuthorized("admin_management") },
        { id: "admin_logs", label: "Audit Logs", icon: Clock, authorized: isTabAuthorized("admin_logs") },
        { id: "platform_settings", label: "Platform Settings", icon: Settings, authorized: isTabAuthorized("platform_settings") },
        { id: "system_health", label: "System Health", icon: Activity, authorized: isTabAuthorized("system_health") },
      ],
    },
  ];

  return (
    <WorkspaceLayout
      type="admin"
      title="Admin Console"
      contextSubtitle={activeTab.replace(/_/g, " ").toUpperCase()}
      user={{
        username: currentUser,
        role: userRole,
      }}
      roleBadge={getRoleDisplayName(userRole)}
      groups={adminGroups}
      activeTab={activeTab}
      onSelectTab={(tabId) => setActiveTab(tabId)}
      onClose={() => router.push("/")}
    >
      <div className="flex flex-col gap-6">
        {/* Preview Mode Indicator Banner */}
        {previewActive && (
          <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-center justify-between text-amber-400 font-semibold text-xs shadow-[0_0_20px_rgba(245,158,11,0.05)]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>PREVIEW MODE ACTIVE: Viewing Admin Console as <strong className="text-white uppercase tracking-wider">{getRoleDisplayName(userRole)}</strong></span>
            </div>
            <Button 
              variant="outline"
              size="sm"
              onClick={() => handlePreviewRoleChange("ACTUAL")}
            >
              Exit Preview Mode
            </Button>
          </div>
        )}

        {/* ─── Tab 1: Overview Dashboard ─── */}
        {activeTab === "overview" && isTabAuthorized("overview") && (
          <div className="flex flex-col gap-6">
            
            {/* Dynamic statistics cards based on role access */}
            <div>
              <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Platform Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                {(isMasterAdmin || userRole === "CUSTOMER_SUPPORT" || userRole === "ADMIN") && (
                  <div className="p-4 bg-[#0d0e12] border border-[#1c1e24]/70 rounded-xl">
                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Total Users</span>
                    <span className="text-lg font-black text-white mt-1 block">{platformStats.totalUsers.toLocaleString()}</span>
                  </div>
                )}
                {(isMasterAdmin || userRole === "PARTNERSHIP_MANAGER" || userRole === "ADMIN" || userRole === "EDITORIAL_TEAM") && (
                  <>
                    <div className="p-4 bg-[#0d0e12] border border-[#1c1e24]/70 rounded-xl">
                      <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Total Creators</span>
                      <span className="text-lg font-black text-white mt-1 block">{platformStats.totalCreators.toLocaleString()}</span>
                    </div>
                    <div className="p-4 bg-[#0d0e12] border border-[#1c1e24]/70 rounded-xl">
                      <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Monetized</span>
                      <span className="text-lg font-black text-white mt-1 block">{platformStats.monetizedCreators.toLocaleString()}</span>
                    </div>
                    <div className="p-4 bg-[#0d0e12] border border-[#1c1e24]/70 rounded-xl">
                      <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Verified</span>
                      <span className="text-lg font-black text-white mt-1 block">{platformStats.verifiedCreators.toLocaleString()}</span>
                    </div>
                  </>
                )}
                {(isMasterAdmin || userRole === "EDITORIAL_TEAM" || userRole === "ADMIN") && (
                  <>
                    <div className="p-4 bg-[#0d0e12] border border-[#1c1e24]/70 rounded-xl">
                      <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Series</span>
                      <span className="text-lg font-black text-white mt-1 block">{platformStats.publishedSeries.toLocaleString()}</span>
                    </div>
                    <div className="p-4 bg-[#0d0e12] border border-[#1c1e24]/70 rounded-xl">
                      <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Chapters</span>
                      <span className="text-lg font-black text-white mt-1 block">{platformStats.publishedChapters.toLocaleString()}</span>
                    </div>
                  </>
                )}
                <div className="p-4 bg-[#0d0e12] border border-[#1c1e24]/70 rounded-xl">
                  <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Active Readers</span>
                  <span className="text-lg font-black text-white mt-1 block">{platformStats.activeReaders.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Overview Dynamic Panels */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Financial panel - Finance & Master & Regional Admin */}
              {(isMasterAdmin || userRole === "FINANCE_ADMIN") && (
                <div className="p-6 bg-[#0d0e12] border border-[#1c1e24] rounded-2xl flex flex-col gap-4">
                  <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Revenue Snapshots</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] text-gray-500 font-extrabold uppercase">Today's Revenue</span>
                      <p className="text-xl font-black text-white mt-1">{revenueStats.today}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 font-extrabold uppercase">Monthly Revenue</span>
                      <p className="text-xl font-black text-white mt-1">{revenueStats.monthly}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 font-extrabold uppercase">Pending Payouts</span>
                      <p className="text-xl font-black text-white mt-1 text-yellow-500">{revenueStats.pendingPayouts}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 font-extrabold uppercase">Completed Payouts</span>
                      <p className="text-xl font-black text-white mt-1 text-green-500">{revenueStats.completedPayouts}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Moderation indicators - Safety, Moderator, Support & Master */}
              {(isMasterAdmin || userRole === "COMMUNITY_MODERATOR" || userRole === "SAFETY_SPECIALIST" || userRole === "CUSTOMER_SUPPORT" || userRole === "ADMIN") && (
                <div className="p-6 bg-[#0d0e12] border border-[#1c1e24] rounded-2xl flex flex-col gap-4">
                  <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Moderation Overview</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] text-gray-500 font-extrabold uppercase">Pending Applications</span>
                      <p className="text-xl font-black text-white mt-1 text-blue-400">{moderationStats.pendingApplications}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 font-extrabold uppercase">Pending Verifications</span>
                      <p className="text-xl font-black text-white mt-1 text-indigo-400">{moderationStats.pendingVerifications}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 font-extrabold uppercase">Active Safety Reports</span>
                      <p className="text-xl font-black text-white mt-1 text-red-500">{moderationStats.pendingSafetyReports}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 font-extrabold uppercase">Flagged Content</span>
                      <p className="text-xl font-black text-white mt-1 text-orange-500">{moderationStats.flaggedContent}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Live Activity Feed */}
            <div className="p-6 bg-[#0d0e12] border border-[#1c1e24] rounded-2xl">
              <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Live Platform Activity Feed</h3>
              <div className="flex flex-col gap-3 max-h-60 overflow-y-auto pr-2">
                {liveActivities.map((act, idx) => (
                  <div key={idx} className="flex justify-between items-start gap-4 p-3 bg-slate-950/20 border border-slate-900 rounded-xl text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        act.type === "success" ? "bg-green-500" :
                        act.type === "warning" ? "bg-yellow-500" :
                        act.type === "danger" ? "bg-red-500" : "bg-blue-500"
                      }`} />
                      <span className="text-gray-300 font-semibold">{act.text}</span>
                    </div>
                    <span className="text-[10px] text-gray-500 whitespace-nowrap font-bold">{act.time}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ─── Tab 2: Payout Center (Finance / Master Only) ─── */}
        {activeTab === "payouts" && isTabAuthorized("payouts") && (
          <div className="p-6 bg-[#0d0e12] border border-[#1c1e24] rounded-2xl flex flex-col gap-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-gray-400">Payout Requests Verification</h3>
            <table className="w-full text-left border-collapse text-xs font-semibold">
              <thead>
                <tr className="border-b border-[#1c1e24] text-gray-500 font-bold uppercase">
                  <th className="pb-3">Creator</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((pay) => (
                  <tr key={pay.id} className="border-b border-[#1c1e24]/40 hover:bg-slate-900/10 text-gray-300">
                    <td className="py-4 font-bold text-blue-400">@{pay.creator}</td>
                    <td className="py-4 font-extrabold">{pay.amount}</td>
                    <td className="py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${pay.status === "COMPLETED" ? "bg-green-600/10 text-green-400" : "bg-blue-600/10 text-blue-400"}`}>
                        {pay.status}
                      </span>
                    </td>
                    <td className="py-4 text-gray-500">{pay.date}</td>
                    <td className="py-4 text-right">
                      {pay.status === "PENDING" && (
                        <button 
                          onClick={() => handleApprovePayout(pay.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-3 py-1.5 rounded text-[10px] uppercase"
                        >
                          Verify & Payout
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ─── Tab 3: Creator Applications Board ─── */}
        {activeTab === "applications" && isTabAuthorized("applications") && (
          <div className="flex flex-col gap-6">
            
            {/* Sub-tab pills */}
            <div className="flex gap-4 border-b border-[#1c1e24] pb-4">
              {[
                { id: "creator", label: "Creator Candidates" },
                { id: "monetization", label: "Monetization Approvals" },
                { id: "verification", label: "Verification Center" }
              ].map(sub => (
                <button
                  key={sub.id}
                  onClick={() => { setAppSubTab(sub.id as any); setReviewNote(""); }}
                  className={`text-xs font-bold uppercase tracking-wider transition-colors pb-2 ${appSubTab === sub.id ? "border-b-2 border-blue-500 text-blue-400" : "text-gray-500 hover:text-white"}`}
                >
                  {sub.label}
                </button>
              ))}
            </div>

            {/* Review Note text box */}
            <div className="flex flex-col gap-1.5 max-w-xl">
              <label className="text-[10px] text-gray-500 font-extrabold uppercase">Review Board Decisions / Rejection Notes:</label>
              <input 
                type="text" 
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="Enter review decision notes..."
                className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* List 3.1: Creator Candidates */}
            {appSubTab === "creator" && (
              <div className="flex flex-col gap-4">
                {creatorApps?.length === 0 ? (
                  <p className="text-xs text-gray-500 font-bold text-center py-6">No pending creator applications.</p>
                ) : (
                  creatorApps?.map((app: any) => (
                    <div key={app.id} className="p-6 bg-[#0d0e12] border border-[#1c1e24] rounded-2xl flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-base font-black text-white">{app.penName}</h4>
                          <span className="text-[10px] text-gray-500 font-bold uppercase">Format: {app.type}</span>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => vetAppMutation.mutate({ applicationId: app.id, status: "APPROVED", reviewerNotes: reviewNote })}
                            className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-xl flex items-center justify-center"
                            title="Approve Candidate"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => vetAppMutation.mutate({ applicationId: app.id, status: "REJECTED", reviewerNotes: reviewNote })}
                            className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-xl flex items-center justify-center"
                            title="Reject Candidate"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 mt-1 leading-relaxed">{app.bio}</p>
                      <div className="text-[10px] font-bold text-blue-500">
                        Portfolio: <a href={app.portfolioUrl} target="_blank" rel="noreferrer" className="underline">{app.portfolioUrl}</a>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* List 3.2: Monetization Applications */}
            {appSubTab === "monetization" && (
              <div className="flex flex-col gap-4">
                {monetizationApps?.length === 0 ? (
                  <p className="text-xs text-gray-500 font-bold text-center py-6">No pending monetization requests.</p>
                ) : (
                  monetizationApps?.map((profile: any) => (
                    <div key={profile.id} className="p-6 bg-[#0d0e12] border border-[#1c1e24] rounded-2xl flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-base font-black text-white">{profile.penName}</h4>
                          <span className="text-[10px] text-gray-500 font-bold uppercase">Followers: {profile.followerCount} | Views: {profile.viewCount}</span>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => reviewMonetizationMutation.mutate({ creatorProfileId: profile.id, status: "APPROVED", notes: reviewNote })}
                            className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-xl"
                            title="Approve Monetization"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => reviewMonetizationMutation.mutate({ creatorProfileId: profile.id, status: "REJECTED", notes: reviewNote })}
                            className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-xl"
                            title="Reject Monetization"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 mt-1 leading-relaxed">{profile.bio}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* List 3.3: Verification Center */}
            {appSubTab === "verification" && (
              <div className="flex flex-col gap-4">
                {verificationApps?.length === 0 ? (
                  <p className="text-xs text-gray-500 font-bold text-center py-6">No pending verification requests.</p>
                ) : (
                  verificationApps?.map((profile: any) => (
                    <div key={profile.id} className="p-6 bg-[#0d0e12] border border-[#1c1e24] rounded-2xl flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-base font-black text-white">{profile.penName}</h4>
                          <span className="text-[10px] text-gray-500 font-bold uppercase">Government ID: {profile.governmentId}</span>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => reviewVerificationMutation.mutate({ creatorProfileId: profile.id, status: "VERIFIED", notes: reviewNote })}
                            className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-xl"
                            title="Approve Verification"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => reviewVerificationMutation.mutate({ creatorProfileId: profile.id, status: "REJECTED", notes: reviewNote })}
                            className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-xl"
                            title="Reject Verification"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      {profile.businessVerification && (
                        <p className="text-[10px] text-gray-400 font-semibold uppercase">Business Certificate: {profile.businessVerification}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

          </div>
        )}

        {/* ─── Tab 4: Promo Codes (Marketing / Master Only) ─── */}
        {activeTab === "promos" && isTabAuthorized("promos") && (
          <div className="flex flex-col gap-6">
            
            {/* Generate form */}
            <div className="p-6 bg-[#0d0e12] border border-[#1c1e24] rounded-2xl">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-gray-400 mb-2">Generate Promo Code</h3>
              <p className="text-xs text-gray-500 leading-relaxed mb-6">Create promotional campaign codes with custom parameters.</p>

              <form onSubmit={handleGeneratePromo} className="flex gap-4 items-end flex-wrap max-w-3xl">
                <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
                  <label className="text-[10px] text-gray-500 font-extrabold uppercase">Promo Type:</label>
                  <select 
                    value={newPromoType} 
                    onChange={(e) => setNewPromoType(e.target.value as any)}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="PLUS">Panelva Plus</option>
                    <option value="PREMIUM">Panelva Premium</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
                  <label className="text-[10px] text-gray-500 font-extrabold uppercase">Duration:</label>
                  <select 
                    value={newPromoDuration} 
                    onChange={(e) => setNewPromoDuration(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="30 Days">30 Days</option>
                    <option value="60 Days">60 Days</option>
                    <option value="90 Days">90 Days</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
                  <label className="text-[10px] text-gray-500 font-extrabold uppercase">Custom Code (Optional):</label>
                  <input 
                    type="text" 
                    value={newPromoCode} 
                    onChange={(e) => setNewPromoCode(e.target.value)} 
                    placeholder="Auto-generate if empty..." 
                    className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-xs font-bold uppercase">
                  Generate Code
                </button>
              </form>
            </div>

            {/* Promo Codes List */}
            <div className="p-6 bg-[#0d0e12] border border-[#1c1e24] rounded-2xl overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-semibold">
                <thead>
                  <tr className="border-b border-[#1c1e24] text-gray-500 font-bold uppercase">
                    <th className="pb-3">Promo Code</th>
                    <th className="pb-3">Campaign Tier</th>
                    <th className="pb-3">Duration</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Created By</th>
                    <th className="pb-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {promoCodes.map((p, idx) => (
                    <tr key={idx} className="border-b border-[#1c1e24]/40 hover:bg-slate-900/10 text-gray-300">
                      <td className="py-4 font-mono font-bold text-amber-500 text-sm">{p.code}</td>
                      <td className="py-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${p.type === "PREMIUM" ? "bg-amber-600/10 text-amber-400" : "bg-blue-600/10 text-blue-400"}`}>
                          {p.type}
                        </span>
                      </td>
                      <td className="py-4">{p.duration}</td>
                      <td className="py-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${p.status === "Active" ? "bg-green-600/10 text-green-400" : "bg-slate-800 text-gray-500"}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-4 text-gray-400">@{p.createdBy}</td>
                      <td className="py-4 text-gray-500">{p.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* ─── Tab 5: Safety Center ─── */}
        {activeTab === "safety" && isTabAuthorized("safety") && (
          <div className="p-6 bg-[#0d0e12] border border-[#1c1e24] rounded-2xl flex flex-col gap-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-gray-400">Active Safety Incident Reports</h3>
            {safetyReports?.length === 0 ? (
              <p className="text-xs text-gray-500 font-bold text-center py-6">No active safety reports.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {safetyReports?.map((rep: any) => (
                  <div key={rep.id} className="p-4 bg-slate-950/20 border border-slate-900 rounded-xl flex items-center justify-between">
                    <div>
                      <h4 className="font-extrabold text-sm text-white">Reason: {rep.reason}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">Reporter ID: {rep.reporterId} &bull; Chapter ID: {rep.chapterId || "None"}</p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleResolveReport(rep.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-4 py-2 rounded-xl text-xs uppercase"
                      >
                        Resolve Report
                      </button>
                      <button 
                        onClick={() => alert(`Warning letter sent to creator/user.`)}
                        className="border border-[#1c1e24] text-yellow-500 hover:text-yellow-400 font-extrabold px-4 py-2 rounded-xl text-xs uppercase"
                      >
                        Warn User
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── Tab 6: Series Registry (Editorial / Master Only) ─── */}
        {activeTab === "series" && isTabAuthorized("series") && (
          <div className="p-6 bg-[#0d0e12] border border-[#1c1e24] rounded-2xl flex flex-col gap-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-gray-400">Series Registry & Moderation</h3>
            {seriesList?.length === 0 ? (
              <p className="text-xs text-gray-500 font-bold text-center py-6">No active uploaded series.</p>
            ) : (
              <table className="w-full text-left border-collapse text-xs font-semibold text-gray-300">
                <thead>
                  <tr className="border-b border-[#1c1e24] text-gray-500 font-bold uppercase">
                    <th className="pb-3">Title</th>
                    <th className="pb-3">Type</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Views</th>
                    <th className="pb-3 text-right">Moderator Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {seriesList?.map((s: any) => (
                    <tr key={s.id} className="border-b border-[#1c1e24]/40 hover:bg-slate-900/10">
                      <td className="py-4 font-bold text-white">{s.title}</td>
                      <td className="py-4">{s.type}</td>
                      <td className="py-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${s.status === "ONGOING" ? "bg-green-600/10 text-green-400" : "bg-slate-800 text-gray-500"}`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="py-4">{s.views}</td>
                      <td className="py-4 text-right flex justify-end gap-2">
                        <button 
                          onClick={() => toggleFeaturedMutation.mutate({ creatorProfileId: s.creatorId, isFeatured: true })}
                          className="bg-[#0b0c10] border border-amber-500/30 text-amber-400 font-extrabold px-3 py-1.5 rounded-xl text-[10px] uppercase flex items-center gap-1"
                        >
                          <Star className="w-3 h-3 fill-amber-400" /> Feature
                        </button>
                        <button 
                          onClick={() => alert(`Suspended series: ${s.title}`)}
                          className="border border-[#1c1e24] text-red-500 hover:text-red-400 font-extrabold px-3 py-1.5 rounded-xl text-[10px] uppercase"
                        >
                          Suspend
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ─── Tab 7: User Directory (Customer Support / Master Only) ─── */}
        {activeTab === "users" && isTabAuthorized("users") && (
          <div className="p-6 bg-[#0d0e12] border border-[#1c1e24] rounded-2xl flex flex-col gap-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-gray-400">User Registry Directory</h3>
            <table className="w-full text-left border-collapse text-xs font-semibold text-gray-300">
              <thead>
                <tr className="border-b border-[#1c1e24] text-gray-500 font-bold uppercase">
                  <th className="pb-3">User</th>
                  <th className="pb-3">Email Address</th>
                  <th className="pb-3">Joined Date</th>
                  <th className="pb-3">Account Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, idx) => (
                  <tr key={idx} className="border-b border-[#1c1e24]/40 hover:bg-slate-900/10">
                    <td className="py-4 font-bold text-white">@{u.username}</td>
                    <td className="py-4 text-gray-400">{u.email}</td>
                    <td className="py-4 text-gray-500">{u.joined}</td>
                    <td className="py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${u.role === "CREATOR" ? "bg-green-600/10 text-green-400" : "bg-slate-800 text-gray-500"}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-4 text-right flex justify-end gap-3 text-xs">
                      <button 
                        onClick={() => alert(`Warning notification sent to ${u.email}`)}
                        className="text-yellow-500 hover:underline"
                      >
                        Warn
                      </button>
                      <button 
                        onClick={() => alert(`Triggered password reset link for ${u.email}`)}
                        className="text-blue-500 hover:underline"
                      >
                        Reset Password
                      </button>
                      <button 
                        onClick={() => alert(`Banned account ${u.username}`)}
                        className="text-red-500 hover:underline font-extrabold"
                      >
                        Ban
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ─── Tab 8: Creator Directory (Partnership / Editorial / Master Only) ─── */}
        {activeTab === "creators" && isTabAuthorized("creators") && (
          <div className="p-6 bg-[#0d0e12] border border-[#1c1e24] rounded-2xl flex flex-col gap-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-gray-400">Creator Profiles Registry</h3>
            <table className="w-full text-left border-collapse text-xs font-semibold text-gray-300">
              <thead>
                <tr className="border-b border-[#1c1e24] text-gray-500 font-bold uppercase">
                  <th className="pb-3">Creator Name</th>
                  <th className="pb-3">Email</th>
                  <th className="pb-3">Format Type</th>
                  <th className="pb-3">Vetted</th>
                  <th className="pb-3">Monetization</th>
                  <th className="pb-3 text-right">Metrics (Followers / Views)</th>
                </tr>
              </thead>
              <tbody>
                {creators.map((c, idx) => (
                  <tr key={idx} className="border-b border-[#1c1e24]/40 hover:bg-slate-900/10">
                    <td className="py-4 font-bold text-white">@{c.penName}</td>
                    <td className="py-4 text-gray-400">{c.email}</td>
                    <td className="py-4">
                      <span className="bg-[#0b0c10] border border-zinc-800 px-2 py-0.5 rounded text-[10px]">
                        {c.type}
                      </span>
                    </td>
                    <td className="py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${c.vetted ? "bg-blue-600/10 text-blue-400" : "bg-yellow-600/10 text-yellow-400"}`}>
                        {c.vetted ? "VETTED" : "PENDING"}
                      </span>
                    </td>
                    <td className="py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${c.monetized ? "bg-green-600/10 text-green-400" : "bg-zinc-800 text-zinc-500"}`}>
                        {c.monetized ? "MONETIZED" : "INACTIVE"}
                      </span>
                    </td>
                    <td className="py-4 text-right text-gray-400">
                      <strong>{c.followers.toLocaleString()}</strong> Flrs &bull; <strong>{c.views.toLocaleString()}</strong> Views
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ─── Tab 9: Revenue Analytics (Finance / Master Only) ─── */}
        {activeTab === "revenue" && isTabAuthorized("revenue") && (
          <div className="flex flex-col gap-6 animate-fade-in">
            
            {/* Control & Filter Board (Requirement 5 & 6) */}
            <div className="p-6 bg-gradient-to-br from-[#0d0e12] to-[#12141c] border border-[#1c1e24] shadow-[0_4px_30px_rgba(0,0,0,0.4)] backdrop-blur-md rounded-2xl flex flex-col gap-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">Financial Filters & Exports</h3>
                  <p className="text-xs text-gray-500 mt-1">Filter real-time metric aggregates and trigger official ledger exports.</p>
                </div>
                <div className="flex items-center gap-3">
                  {/* Real-time pulsing status */}
                  <div className="flex items-center gap-2 bg-slate-950/60 border border-slate-900 px-4 py-2 rounded-xl text-[10px] font-bold text-green-400">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 -ml-3.5" />
                    LIVE SYNC ACTIVE
                  </div>
                  <button 
                    onClick={handleRefreshRevenue}
                    disabled={isRefreshingRevenue}
                    className="p-2.5 bg-[#1c1e24] hover:bg-slate-700 rounded-xl text-xs flex items-center justify-center transition-colors duration-200 border border-zinc-800"
                    title="Force Database Sync"
                  >
                    <RefreshCw className={`w-4 h-4 text-gray-300 ${isRefreshingRevenue ? "animate-spin" : ""}`} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 items-end pt-2">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] text-gray-500 font-extrabold uppercase tracking-wider">Date Range</label>
                  <select 
                    value={revDateRange} 
                    onChange={(e) => setRevDateRange(e.target.value)}
                    className="bg-slate-900 border border-[#1c1e24] hover:border-zinc-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors cursor-pointer"
                  >
                    <option value="Today">Today</option>
                    <option value="Last 7 Days">Last 7 Days</option>
                    <option value="Last 30 Days">Last 30 Days</option>
                    <option value="Last 90 Days">Last 90 Days</option>
                    <option value="Last Year">Last Year</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] text-gray-500 font-extrabold uppercase tracking-wider">Revenue Stream</label>
                  <select 
                    value={revSource} 
                    onChange={(e) => setRevSource(e.target.value)}
                    className="bg-slate-900 border border-[#1c1e24] hover:border-zinc-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors cursor-pointer"
                  >
                    <option value="All Sources">All Sources</option>
                    <option value="Subscriptions">Subscriptions</option>
                    <option value="Ad Revenue">Ad Revenue</option>
                    <option value="Credit purchases">Credit Purchases</option>
                    <option value="Tips & Gifts">Tips & Gifts</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] text-gray-500 font-extrabold uppercase tracking-wider">Subscription Tier</label>
                  <select 
                    value={revTier} 
                    onChange={(e) => setRevTier(e.target.value)}
                    className="bg-slate-900 border border-[#1c1e24] hover:border-zinc-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors cursor-pointer"
                  >
                    <option value="All Tiers">All Tiers</option>
                    <option value="Panelva Plus">Panelva Plus</option>
                    <option value="Premium User">Premium User</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] text-gray-500 font-extrabold uppercase tracking-wider">Territory Region</label>
                  <select 
                    value={revRegion} 
                    onChange={(e) => setRevRegion(e.target.value)}
                    className="bg-slate-900 border border-[#1c1e24] hover:border-zinc-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors cursor-pointer"
                  >
                    <option value="All Regions">All Regions</option>
                    <option value="North America">North America</option>
                    <option value="Europe">Europe</option>
                    <option value="Asia">Asia</option>
                    <option value="Latin America">Latin America</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] text-gray-500 font-extrabold uppercase tracking-wider">Payment Gateway</label>
                  <select 
                    value={revProvider} 
                    onChange={(e) => setRevProvider(e.target.value)}
                    className="bg-slate-900 border border-[#1c1e24] hover:border-zinc-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors cursor-pointer"
                  >
                    <option value="All Providers">All Gateways</option>
                    <option value="Stripe">Stripe Checkout</option>
                    <option value="Apple Pay">Apple In-App</option>
                    <option value="Google Pay">Google Play Billing</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 justify-end mt-2 pt-4 border-t border-[#1c1e24]/40">
                <button 
                  onClick={() => handleExportData("CSV")}
                  className="bg-slate-900 hover:bg-[#1c1e24] border border-zinc-800 text-gray-300 font-bold px-4.5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-colors duration-200 flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-zinc-400" /> Export CSV
                </button>
                <button 
                  onClick={() => handleExportData("Excel")}
                  className="bg-slate-900 hover:bg-[#1c1e24] border border-zinc-800 text-gray-300 font-bold px-4.5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-colors duration-200 flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-green-500" /> Export Excel
                </button>
                <button 
                  onClick={() => handleExportData("PDF")}
                  className="bg-slate-900 hover:bg-[#1c1e24] border border-zinc-800 text-gray-300 font-bold px-4.5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-colors duration-200 flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-red-500" /> Export PDF
                </button>
              </div>
            </div>

            {/* KPI Cards Grid (10 cards - Requirement 2) */}
            <div>
              <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Key Financial Performance Indicators</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { label: "Total Platform Revenue", value: revenueStats.totalPlatformRevenue, color: "text-white font-black", trend: "+12.4% vs last month" },
                  { label: "Subscription Revenue", value: revenueStats.membership, color: "text-blue-400", trend: "+8.7% vs last month" },
                  { label: "Advertising Revenue", value: revenueStats.totalAdvertisingRevenue, color: "text-emerald-400", trend: "+21.5% YoY" },
                  { label: "Credit Sales Revenue", value: revenueStats.premium, color: "text-purple-400", trend: "+11.3% vs last month" },
                  { label: "Monthly Recurring (MRR)", value: revenueStats.mrr, color: "text-indigo-400", trend: "75% creator share" },
                  { label: "Creator Gross Earnings", value: revenueStats.totalCreatorEarnings, color: "text-gray-200", trend: "75% platform payout" },
                  { label: "Platform Comm. (25%)", value: revenueStats.totalPlatformCommission, color: "text-amber-500", trend: "25% commission rate" },
                  { label: "Annual Recurring (ARR)", value: revenueStats.arr, color: "text-cyan-400", trend: "MRR x 12 projection" },
                  { label: "Avg. Revenue / User (ARPU)", value: revenueStats.arpu, color: "text-zinc-300", trend: "Total active user basis" },
                  { label: "Avg. Rev / Paying User", value: revenueStats.arppu, color: "text-orange-400", trend: "Total paying user basis" }
                ].map((item, idx) => (
                  <div 
                    key={idx} 
                    className="group bg-gradient-to-br from-[#0d0e12] to-[#13151d] hover:from-[#13151d] hover:to-[#171923] border border-[#1c1e24] hover:border-blue-500/30 hover:shadow-[0_8px_30px_rgba(37,99,235,0.05)] rounded-2xl p-5 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer flex flex-col justify-between min-h-[110px]"
                  >
                    <div>
                      <span className="text-[10px] text-gray-500 font-extrabold uppercase tracking-wider group-hover:text-gray-300 transition-colors duration-200 block">{item.label}</span>
                      <p className={`text-2xl mt-1.5 tracking-tight ${item.color}`}>{item.value}</p>
                    </div>
                    <span className="text-[10px] text-gray-600 mt-2 block font-medium group-hover:text-gray-400 transition-colors duration-200">{item.trend}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tabular Revenue Breakdown (Gross, Net, Platform Share, Creator Share, contribution %, growth - Requirement 3) */}
            <div className="p-6 bg-gradient-to-br from-[#0d0e12] to-[#12141c] border border-[#1c1e24] shadow-[0_4px_30px_rgba(0,0,0,0.4)] rounded-2xl flex flex-col gap-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-white">Detailed Revenue Breakdown by Stream</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-semibold text-gray-300">
                  <thead>
                    <tr className="border-b border-[#1c1e24] text-gray-500 font-bold uppercase tracking-wider">
                      <th className="pb-3 text-left">Monetization Channel</th>
                      <th className="pb-3 text-left">Gross Revenue</th>
                      <th className="pb-3 text-left">Net Revenue</th>
                      <th className="pb-3 text-left">Platform Share</th>
                      <th className="pb-3 text-left">Creator Share</th>
                      <th className="pb-3 text-left">Contribution</th>
                      <th className="pb-3 text-right">Growth YoY</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revenueStreams.map((stream, idx) => (
                      <tr key={idx} className="border-b border-[#1c1e24]/40 hover:bg-slate-900/20 transition-colors duration-150">
                        <td className="py-4 font-bold text-white text-sm">{stream.source}</td>
                        <td className="py-4 text-gray-100">{stream.gross}</td>
                        <td className="py-4 text-emerald-400 font-bold">{stream.net}</td>
                        <td className="py-4 text-amber-500 font-bold">{stream.platformShare}</td>
                        <td className="py-4 text-gray-300">{stream.creatorShare}</td>
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <span className="w-8 text-[10px] text-gray-400 font-mono">{stream.contribution}</span>
                            <div className="w-20 bg-slate-950/60 h-2 rounded-full overflow-hidden border border-zinc-800">
                              <div className="bg-gradient-to-r from-blue-600 to-cyan-500 h-full rounded-full" style={{ width: stream.contribution }} />
                            </div>
                          </div>
                        </td>
                        <td className="py-4 text-right text-emerald-400 font-extrabold flex items-center justify-end gap-1">
                          <span className="text-[9px] text-emerald-500 animate-pulse">▲</span>{stream.growth}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Visual Charts & Performance reports (Requirement 4) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Chart 1: Revenue Trend */}
              <div className="p-6 bg-gradient-to-br from-[#0d0e12] to-[#12141c] border border-[#1c1e24] shadow-2xl rounded-2xl flex flex-col gap-4 justify-between h-[340px]">
                <div>
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">7-Day Revenue Trend</h3>
                  <p className="text-[10px] text-gray-500 mt-0.5">Aggregated daily performance in thousands</p>
                </div>
                <div className="flex justify-between items-end h-[180px] gap-2.5 px-2 pt-4">
                  {revenueTrendData.map((d, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-2 flex-1 group">
                      <div className="w-full relative flex items-end justify-center">
                        {/* Tooltip info bubble */}
                        <div className="absolute bottom-full mb-2 bg-[#1c1e24] text-white text-[9px] font-bold py-1 px-1.5 rounded border border-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-xl">
                          ${d.value.toFixed(1)}k
                        </div>
                        <div 
                          className="w-full bg-gradient-to-t from-blue-600/70 to-cyan-400/80 border border-cyan-500/20 hover:from-blue-500 hover:to-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.1)] rounded-t-lg transition-all duration-300 flex items-end justify-center cursor-pointer" 
                          style={{ height: d.height }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-gray-500 group-hover:text-white transition-colors">{d.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chart 2: Top-Performing Series */}
              <div className="p-6 bg-gradient-to-br from-[#0d0e12] to-[#12141c] border border-[#1c1e24] shadow-2xl rounded-2xl flex flex-col gap-4 h-[340px]">
                <div>
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Top Series by Revenue</h3>
                  <p className="text-[10px] text-gray-500 mt-0.5">Top-earning titles and percentage shares</p>
                </div>
                <div className="flex flex-col gap-4.5 mt-2 overflow-y-auto">
                  {topPerformingSeries.map((s, idx) => (
                    <div key={idx} className="flex flex-col gap-1.5 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-white flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded bg-slate-800 text-[10px] text-zinc-400 font-mono flex items-center justify-center font-bold">#{idx+1}</span>
                          {s.title}
                          <span className="text-gray-500 text-[10px] font-medium">@{s.creator}</span>
                        </span>
                        <span className="font-extrabold text-blue-400">{s.revenue}</span>
                      </div>
                      <div className="w-full bg-slate-950/60 h-2 rounded-full overflow-hidden border border-zinc-800">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full" 
                          style={{ width: s.share }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chart 3: Geographic Distribution */}
              <div className="p-6 bg-gradient-to-br from-[#0d0e12] to-[#12141c] border border-[#1c1e24] shadow-2xl rounded-2xl flex flex-col gap-4 h-[340px]">
                <div>
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Geographic Distribution</h3>
                  <p className="text-[10px] text-gray-500 mt-0.5">Global regional breakdown share</p>
                </div>
                <div className="flex flex-col gap-4 mt-2">
                  {regionalRevenue.map((r, idx) => {
                    const colors = ["bg-blue-500", "bg-indigo-500", "bg-purple-500", "bg-pink-500"];
                    const colorClass = colors[idx % colors.length];
                    return (
                      <div key={idx} className="flex items-center justify-between text-xs border-b border-[#1c1e24]/40 pb-2.5 hover:bg-slate-900/10 transition-colors">
                        <div className="flex items-center gap-2.5">
                          <span className={`w-2.5 h-2.5 rounded-full ${colorClass}`} />
                          <span className="font-bold text-white">{r.region}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-gray-400 font-medium">{r.value}</span>
                          <span className="font-black text-indigo-400 w-8 text-right font-mono">{r.share}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ─── Tab 10: Featured Spotlight (Editorial / Master Only) ─── */}
        {activeTab === "featured_creators" && isTabAuthorized("featured_creators") && (
          <div className="p-6 bg-[#0d0e12] border border-[#1c1e24] rounded-2xl flex flex-col gap-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-gray-400">Featured Spotlight Selection Board</h3>
            <p className="text-xs text-gray-500 leading-relaxed mb-2">Featured creators obtain priority index rankings and homepage artwork priority.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredCreators.map((fc) => (
                <div key={fc.id} className="p-6 bg-slate-950/15 border border-slate-900 rounded-2xl flex flex-col gap-4 justify-between">
                  <div>
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{fc.type}</span>
                    <h4 className="text-base font-black text-white mt-1">@{fc.name}</h4>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className={`text-[10px] font-extrabold ${fc.featured ? "text-amber-500" : "text-gray-500"}`}>
                      {fc.featured ? "★ FEATURED" : "★ INACTIVE"}
                    </span>
                    <button 
                      onClick={() => handleToggleFeatured(fc.id)}
                      className={`font-extrabold text-[10px] uppercase px-4 py-2 rounded-xl border ${fc.featured ? "border-red-500/20 text-red-500 hover:bg-red-500/5" : "border-amber-500/20 text-amber-500 hover:bg-amber-500/5"}`}
                    >
                      {fc.featured ? "Remove Feature" : "Feature Creator"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── Tab 11: Notifications ─── */}
        {activeTab === "notifications" && (
          <div className="p-6 bg-[#0d0e12] border border-[#1c1e24] rounded-2xl flex flex-col gap-5">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-gray-400">System Logs & Incident Notifications</h3>
              {dbAdminNotifications && (dbAdminNotifications as any[]).some((n: any) => !n.isRead) && (
                <button
                  onClick={() => bulkMarkReadMutation.mutate()}
                  disabled={bulkMarkReadMutation.isLoading}
                  className="bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 text-blue-400 px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-1.5"
                >
                  {bulkMarkReadMutation.isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Mark all as read
                </button>
              )}
            </div>

            {/* Category Preferences (Filters) */}
            <div className="flex flex-col gap-2 p-4 bg-slate-950/20 border border-slate-900 rounded-xl">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-400">Notification Preferences (Filter Categories)</h4>
              <div className="flex gap-2 flex-wrap mt-1">
                {["System", "Security", "Finance", "Moderation", "Support", "Editorial", "Marketing", "Partnership", "Regional"].map(category => {
                  const isChecked = selectedCategories.includes(category);
                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => {
                        if (isChecked) {
                          setSelectedCategories(selectedCategories.filter(c => c !== category));
                        } else {
                          setSelectedCategories([...selectedCategories, category]);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all duration-200 ${isChecked ? "bg-blue-600 border-blue-500 text-white" : "bg-[#141620]/60 border-zinc-800 text-zinc-400 hover:border-zinc-700"}`}
                    >
                      {category}
                    </button>
                  );
                })}
                {selectedCategories.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedCategories([])}
                    className="text-xs font-bold text-red-400 hover:text-red-300 ml-2"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-gray-500">
                Showing {filteredNotifications.length} of {dbAdminNotifications?.length || 0} alerts
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {filteredNotifications.length === 0 ? (
                <div className="py-12 border border-dashed border-[#1c1e24] rounded-xl flex flex-col items-center justify-center text-center gap-2">
                  <Bell className="w-8 h-8 text-zinc-600" />
                  <p className="text-sm font-bold text-gray-400">No notifications found</p>
                  <p className="text-xs text-gray-500">Try adjusting your category preferences filters.</p>
                </div>
              ) : (
                filteredNotifications.map((notif: any) => {
                  let priorityColor = "bg-blue-500/10 text-blue-400 border-blue-500/20";
                  if (notif.priority === "Critical") {
                    priorityColor = "bg-red-500/10 text-red-400 border-red-500/20 animate-pulse";
                  } else if (notif.priority === "High") {
                    priorityColor = "bg-orange-500/10 text-orange-400 border-orange-500/20";
                  } else if (notif.priority === "Medium") {
                    priorityColor = "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
                  }

                  return (
                    <div 
                      key={notif.id} 
                      className={`p-4 rounded-xl border flex justify-between items-center gap-4 transition-all duration-200 ${notif.isRead ? "bg-slate-950/10 border-slate-900/40 opacity-75" : "bg-[#10121a]/80 border-slate-800/80 shadow-md"}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-xl text-blue-500 mt-0.5 ${notif.isRead ? "bg-zinc-800/10 text-zinc-500 border border-zinc-800/20" : "bg-blue-500/5 border border-blue-500/20"}`}>
                          <Info className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-extrabold text-sm text-white">{notif.title}</h4>
                            <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded border bg-zinc-800/30 text-zinc-400 border-zinc-700/30">
                              {notif.category}
                            </span>
                            <span className={`text-[9px] uppercase font-black px-1.5 py-0.5 rounded border ${priorityColor}`}>
                              {notif.priority}
                            </span>
                            {!notif.isRead && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full" />
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-1 leading-relaxed">{notif.message}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-gray-500 whitespace-nowrap font-bold">
                          {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <div className="flex items-center gap-1">
                          {notif.deepLink && (
                            <button
                              onClick={() => {
                                if (notif.deepLink && isTabAuthorized(notif.deepLink)) {
                                  setActiveTab(notif.deepLink);
                                } else {
                                  alert(`Permission denied to access tab: ${notif.deepLink}`);
                                }
                              }}
                              className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition"
                            >
                              View
                            </button>
                          )}
                          {!notif.isRead && (
                            <button
                              onClick={() => markReadMutation.mutate({ id: notif.id })}
                              disabled={markReadMutation.isLoading}
                              className="hover:bg-zinc-800 text-gray-400 hover:text-white p-1.5 rounded-lg border border-transparent hover:border-zinc-700 transition"
                              title="Mark as Read"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ─── Tab 12: Admin Management (Master Admin Only) ─── */}
        {isMasterAdmin && activeTab === "admin_management" && (
          <div className="flex flex-col gap-6">
            
            {/* Staff directory */}
            <div className="p-6 bg-[#0d0e12] border border-[#1c1e24] rounded-2xl">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-gray-400 mb-4">Governance Staff Directory</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-semibold">
                  <thead>
                    <tr className="border-b border-[#1c1e24] text-gray-500 font-bold uppercase tracking-wider">
                      <th className="pb-3">Staff Profile</th>
                      <th className="pb-3">Access Level</th>
                      <th className="pb-3">Joined Date</th>
                      <th className="pb-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staff.map((member, idx) => (
                      <tr key={idx} className="border-b border-[#1c1e24]/40 hover:bg-slate-900/10 text-gray-300">
                        <td className="py-4 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-white uppercase">{member.avatar}</div>
                          <div>
                            <p className="font-extrabold text-white">@{member.username}</p>
                            <p className="text-[10px] text-gray-500">{member.email}</p>
                          </div>
                        </td>
                        <td className="py-4">
                          <RoleBadge role={member.role} />
                        </td>
                        <td className="py-4 text-gray-500">{member.joined}</td>
                        <td className="py-4 text-right">
                          {member.username !== currentUser && (
                            <button 
                              onClick={() => setStaff(staff.filter(s => s.username !== member.username))}
                              className="text-red-500 hover:text-red-400 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Unified Admin Invitation Form */}
              <form onSubmit={handleInviteAdmin} className="flex gap-4 mt-6 pt-6 border-t border-[#1c1e24]/40 max-w-2xl items-end flex-wrap">
                <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
                  <label className="text-[10px] text-gray-500 font-extrabold uppercase">Admin Email or Username:</label>
                  <input 
                    type="text" 
                    value={inviteEmailOrUsername} 
                    onChange={(e) => setInviteEmailOrUsername(e.target.value)} 
                    placeholder="Enter email address or username..." 
                    required 
                    className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-xs text-white focus:outline-none focus:border-blue-500 w-full"
                  />
                </div>

                <div className="flex flex-col gap-1.5 flex-1 min-w-[180px]">
                  <label className="text-[10px] text-gray-500 font-extrabold uppercase">Predefined Access Role:</label>
                  <select 
                    value={inviteRole} 
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-xs text-white focus:outline-none w-full"
                  >
                    <option value="ADMIN">Operational Admin</option>
                    <option value="MASTER_ADMIN">Master Admin</option>
                    <option value="FINANCE_ADMIN">Finance Admin</option>
                    <option value="COMMUNITY_MODERATOR">Community Moderator</option>
                    <option value="SAFETY_SPECIALIST">Trust & Safety Specialist</option>
                    <option value="CUSTOMER_SUPPORT">Customer Support</option>
                    <option value="EDITORIAL_TEAM">Editorial Team</option>
                    <option value="MARKETING_MANAGER">Marketing Manager</option>
                    <option value="PARTNERSHIP_MANAGER">Partnership Manager</option>
                    <option value="REGIONAL_ADMIN">Regional Admin</option>
                  </select>
                </div>

                <button 
                  type="submit" 
                  disabled={inviteAdminMutation.isLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider"
                >
                  {inviteAdminMutation.isLoading ? "Inviting..." : "Create Admin"}
                </button>
              </form>
            </div>

          </div>
        )}

        {/* ─── Tab 13: Admin Logs (Master Admin Only) ─── */}
        {isMasterAdmin && activeTab === "admin_logs" && (
          <div className="p-6 bg-[#0d0e12] border border-[#1c1e24] rounded-2xl flex flex-col gap-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-gray-400">Immutable Audit Trail Logs</h3>
            <table className="w-full text-left border-collapse text-xs font-semibold text-gray-300">
              <thead>
                <tr className="border-b border-[#1c1e24] text-gray-500 font-bold uppercase">
                  <th className="pb-3">Timestamp</th>
                  <th className="pb-3">Administrator</th>
                  <th className="pb-3">Action</th>
                  <th className="pb-3">Metadata / Payload details</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log: any, idx: number) => (
                  <tr key={idx} className="border-b border-[#1c1e24]/40 hover:bg-slate-900/10">
                    <td className="py-4 text-gray-500 font-mono">{log.timestamp}</td>
                    <td className="py-4 font-bold text-white">{log.admin}</td>
                    <td className="py-4">
                      <span className="bg-blue-950/20 border border-blue-500/20 px-2 py-0.5 rounded text-[10px] text-blue-400 font-bold uppercase">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-4 text-gray-400 leading-relaxed break-all font-mono text-[10px]">
                      {formatLogDetails(log.details)}
                    </td>
                  </tr>
                ))}
                {auditLogs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-zinc-500">
                      No audit logs found in the database.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ─── Tab 14: Platform Settings (Master Admin Only) ─── */}
        {isMasterAdmin && activeTab === "platform_settings" && (
          <div className="p-6 bg-[#0d0e12] border border-[#1c1e24] rounded-2xl flex flex-col gap-6">
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-gray-400">Emergency Settings & Global Overrides</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">Platform settings and overrides that take effect immediately across all frontends.</p>
            </div>

            <div className="flex flex-col gap-4 max-w-xl">
              
              {/* Toggle 1: Maintenance Mode */}
              <div className="flex justify-between items-center border-b border-[#1c1e24]/40 pb-4">
                <div>
                  <p className="text-sm font-bold text-white">Maintenance Mode</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Show a placeholder countdown screen to normal visitors</p>
                </div>
                <button 
                  onClick={() => {
                    setPlatformSettings({ ...platformSettings, maintenanceMode: !platformSettings.maintenanceMode });
                    alert("Maintenance Mode status toggled.");
                  }}
                  className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase ${platformSettings.maintenanceMode ? "bg-rose-600 text-white" : "bg-slate-900 text-gray-400"}`}
                >
                  {platformSettings.maintenanceMode ? "ON" : "OFF"}
                </button>
              </div>

              {/* Toggle 2: Lock uploads */}
              <div className="flex justify-between items-center border-b border-[#1c1e24]/40 pb-4">
                <div>
                  <p className="text-sm font-bold text-white">Lock Creator Uploads</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Block new series and chapter uploads temporarily</p>
                </div>
                <button 
                  onClick={() => {
                    setPlatformSettings({ ...platformSettings, lockNewUploads: !platformSettings.lockNewUploads });
                    alert("Creator Upload locks status toggled.");
                  }}
                  className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase ${platformSettings.lockNewUploads ? "bg-rose-600 text-white" : "bg-slate-900 text-gray-400"}`}
                >
                  {platformSettings.lockNewUploads ? "LOCKED" : "UNLOCKED"}
                </button>
              </div>

              {/* Toggle 3: Emergency lockdown */}
              <div className="flex justify-between items-center border-b border-[#1c1e24]/40 pb-4">
                <div>
                  <p className="text-sm font-bold text-white flex items-center gap-1.5 text-rose-500">
                    <AlertTriangle className="w-4 h-4" /> Global Platform Lockdown
                  </p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Emergency lockdown: force log out all active sessions and pause conversions</p>
                </div>
                <button 
                  onClick={() => {
                    setPlatformSettings({ ...platformSettings, emergencyLock: !platformSettings.emergencyLock });
                    alert("Emergency platform lockdown status modified.");
                  }}
                  className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase ${platformSettings.emergencyLock ? "bg-red-600 text-white animate-pulse" : "bg-slate-900 text-gray-400"}`}
                >
                  {platformSettings.emergencyLock ? "ACTIVE" : "STANDBY"}
                </button>
              </div>

              {/* Counter: Wait-for-Free Schedule Offset */}
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-bold text-white">Global Wait-For-Free Schedule</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Default offset countdown in days for premium tier drops</p>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setPlatformSettings({ ...platformSettings, waitForFreeDays: Math.max(1, platformSettings.waitForFreeDays - 1) })}
                    className="p-1 bg-slate-900 border border-zinc-800 rounded-lg text-white"
                  >
                    -
                  </button>
                  <span className="text-xs font-black">{platformSettings.waitForFreeDays} Days</span>
                  <button 
                    onClick={() => setPlatformSettings({ ...platformSettings, waitForFreeDays: Math.min(30, platformSettings.waitForFreeDays + 1) })}
                    className="p-1 bg-slate-900 border border-zinc-800 rounded-lg text-white"
                  >
                    +
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ─── Tab 15: System Health (Master Admin Only) ─── */}
        {isMasterAdmin && activeTab === "system_health" && (
          <div className="flex flex-col gap-6">
            
            {/* Grid stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: "API Gateway Uptime", value: healthMetrics.apiUptime, icon: <Activity className="w-5 h-5 text-green-400" /> },
                { label: "Postgres DB Latency", value: healthMetrics.dbLatency, icon: <RefreshCw className="w-5 h-5 text-indigo-400" /> },
                { label: "Job Queue Status", value: healthMetrics.queueStatus, icon: <Clock className="w-5 h-5 text-yellow-400" /> },
                { label: "Real-time Active Readers", value: healthMetrics.activeUsers, icon: <Users className="w-5 h-5 text-cyan-400" /> }
              ].map((m, idx) => (
                <div key={idx} className="p-6 bg-[#0d0e12] border border-[#1c1e24] rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-gray-500 font-extrabold uppercase">{m.label}</span>
                    <p className="text-xl font-black text-white mt-1">{m.value}</p>
                  </div>
                  <div className="p-3 bg-slate-950/50 border border-slate-900 rounded-xl">
                    {m.icon}
                  </div>
                </div>
              ))}
            </div>

            {/* Health detail list */}
            <div className="p-6 bg-[#0d0e12] border border-[#1c1e24] rounded-2xl flex flex-col gap-4">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-gray-400">External Provider Services Health Status</h3>
              <div className="flex flex-col gap-3">
                {[
                  { name: "Stripe Gateway Integration", status: healthMetrics.stripeStatus, desc: "Active API endpoint listening, checkout webhooks responding.", statusType: "active" },
                  { name: "Ad Network AdSense Integrations", status: healthMetrics.adNetworkStatus, desc: "AdSense tag injections served, payouts calculation ledger aligned.", statusType: "active" },
                  { name: "S3 Assets Storage Capacity", status: healthMetrics.storageUsage + " capacity used", desc: "User avatars, covers, and manga panels stored in London S3 bucket.", statusType: "warning" },
                  { name: "Server Error rate threshold", status: healthMetrics.errorRate + " errors logged", desc: "API handler exceptions logging below the 1% threshold limit.", statusType: "active" }
                ].map((s, idx) => (
                  <div key={idx} className="p-4 bg-slate-950/20 border border-slate-900 rounded-xl flex justify-between items-center gap-4">
                    <div>
                      <p className="font-extrabold text-xs text-white">{s.name}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{s.desc}</p>
                    </div>
                    <span className={`px-3 py-1 rounded text-[10px] font-extrabold uppercase ${s.statusType === "active" ? "bg-green-600/10 text-green-400" : "bg-yellow-600/10 text-yellow-400"}`}>
                      {s.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Floating Development Preview Panel (Requirement 12) */}
      {typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") && (
        <div className="fixed bottom-4 right-4 z-[9999] bg-[#0d0e12]/90 backdrop-blur-md border border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] p-3 rounded-xl w-52 flex flex-col gap-2.5 text-[11px] font-sans">
          <div className="flex justify-between items-center">
            <span className="font-extrabold text-white text-[10px] uppercase tracking-wider flex items-center gap-1">
              <Settings className="w-3 h-3 text-blue-500" /> Dev Role
            </span>
            <span className="bg-blue-600/10 text-blue-400 font-extrabold text-[7px] uppercase px-1 py-0.5 rounded tracking-wide">
              LOCAL
            </span>
          </div>
          
          <div className="flex flex-col gap-1">
            <select
              value={previewActive ? userRole : "ACTUAL"}
              onChange={(e) => handlePreviewRoleChange(e.target.value)}
              className="w-full bg-[#161b22] border border-gray-800 hover:border-zinc-700 text-white rounded-lg px-2 py-1 text-[11px] focus:outline-none transition cursor-pointer"
            >
              <option value="ACTUAL">Actual ({actualRole})</option>
              <option value="MASTER_ADMIN">Master Admin</option>
              <option value="ADMIN">Operational Admin</option>
              <option value="SUPPORT_ADMIN">Support Admin</option>
              <option value="FINANCE_ADMIN">Finance Admin</option>
              <option value="MODERATOR">Moderator</option>
              <option value="EDITORIAL_ADMIN">Editorial Admin</option>
              <option value="MARKETING_ADMIN">Marketing Admin</option>
              <option value="CREATOR">Creator (Creator Studio)</option>
            </select>
          </div>

          <div className="text-[9px] text-gray-500 leading-tight border-t border-zinc-800/60 pt-1.5 flex flex-col gap-0.5">
            <p>Active: <strong className="text-white uppercase">{userRole.replace("_", " ")}</strong></p>
          </div>
        </div>
      )}
    </WorkspaceLayout>
  );
}
