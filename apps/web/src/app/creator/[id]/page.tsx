"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, Heart, Target, Gift, Users, Eye, Sparkles, 
  Coins, Check, ShieldAlert, Award, Clock, BookOpen, Star, HelpCircle, 
  Search, Calendar, Globe, Bookmark, MessageSquare, Tag, Play, ArrowUpRight, X
} from "lucide-react";
import { trpc } from "../../../lib/trpc";
import PostCard from "../../../components/post-card";
import { cn } from "@/lib/utils";

type ActiveTabType = "home" | "series" | "posts" | "memberships" | "about" | "achievements" | "support";

export default function PublicCreatorProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [currentUser, setCurrentUser] = useState("Guest");
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);
  const [activeProfileTab, setActiveProfileTab] = useState<ActiveTabType>("home");
  
  // Tip and Gift States
  const [customTipAmt, setCustomTipAmt] = useState(500);
  const [purchaseStatus, setPurchaseStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  // Post search & filtering
  const [postSearch, setPostSearch] = useState("");
  const [postTagFilter, setPostTagFilter] = useState<string | null>(null);

  // Load current user PenName/Username
  useEffect(() => {
    const user = localStorage.getItem("panelva_user");
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  // Fetch current user UUID details
  const { data: dbUser } = (trpc.user.getEmailByUsername as any).useQuery(
    { username: currentUser },
    { enabled: currentUser !== "Guest" }
  );

  useEffect(() => {
    if (dbUser?.id) {
      setCurrentUserId(dbUser.id);
    }
  }, [dbUser]);

  // Fetch Public Profile details
  const { data: profile, isLoading, refetch: refetchProfile } = (trpc.creator.getPublicCreatorProfile as any).useQuery(
    { profileId: id || "" },
    { enabled: !!id }
  );

  // Fetch public creator posts
  const { data: creatorPosts, refetch: refetchPosts } = (trpc.post.getPublicCreatorPosts as any).useQuery(
    { creatorProfileId: id, currentUserId: currentUserId },
    { enabled: !!id }
  );

  // Subscriptions & direct purchase mutations
  const purchaseMutation = trpc.chapter.purchaseMembership.useMutation({
    onSuccess: () => {
      setPurchaseStatus("success");
      refetchProfile();
      if (refetchPosts) refetchPosts();
      setTimeout(() => setPurchaseStatus("idle"), 5000);
    },
    onError: (err: any) => {
      setPurchaseStatus("error");
      setErrorMessage(err.message || "Failed to purchase subscription.");
    }
  });

  // Direct profile tip and gift mutations
  const profileTipMutation = trpc.post.sendCreatorTip.useMutation({
    onSuccess: () => {
      alert("Tip coins sent successfully!");
      refetchProfile();
    },
    onError: (err: any) => alert(err.message || "Tipping failed. Check wallet credits balance.")
  });

  const profileGiftMutation = trpc.post.sendCreatorGift.useMutation({
    onSuccess: (res: any) => {
      alert("Gift sent successfully to creator wall!");
      refetchProfile();
    },
    onError: (err: any) => alert(err.message || "Failed to send gift. Check credits.")
  });

  if (isLoading || !profile) {
    return (
      <div className="min-h-screen bg-[#07080a] flex items-center justify-center text-gray-400">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  const goals = profile.creatorGoals || [];
  const tiers = profile.membershipTiers || [];
  const series = profile.series || [];

  const handleSubscribe = (tierId: string, method: "DIRECT" | "COINS" = "COINS") => {
    if (currentUser === "Guest") {
      router.push("/auth");
      return;
    }
    purchaseMutation.mutate({
      tierId,
      paymentMethod: method
    });
  };

  const handleSendTip = () => {
    if (currentUser === "Guest") {
      router.push("/auth");
      return;
    }
    profileTipMutation.mutate({
      creatorProfileId: id,
      amount: customTipAmt
    });
  };

  const handleSendGift = (giftName: string, cost: number) => {
    if (currentUser === "Guest") {
      router.push("/auth");
      return;
    }
    profileGiftMutation.mutate({
      creatorProfileId: id,
      giftCost: cost,
      giftName
    });
  };

  // Filter posts
  const rawPosts = creatorPosts || [];
  const filteredPosts = rawPosts.filter((post: any) => {
    const matchesSearch = postSearch 
      ? post.title.toLowerCase().includes(postSearch.toLowerCase()) || 
        post.content.toLowerCase().includes(postSearch.toLowerCase())
      : true;

    const matchesTag = postTagFilter 
      ? post.content.includes(postTagFilter) || post.title.includes(postTagFilter)
      : true;

    return matchesSearch && matchesTag;
  });

  const profileTabs: { id: ActiveTabType; label: string }[] = [
    { id: "home", label: "Home" },
    { id: "series", label: "Series" },
    { id: "posts", label: "Posts & Feed" },
    { id: "memberships", label: "Memberships" },
    { id: "about", label: "About" },
    { id: "achievements", label: "Achievements" },
    { id: "support", label: "Support & Tip" }
  ];

  return (
    <div className="min-h-screen bg-[#07080a] text-gray-100 font-sans p-8">
      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        
        {/* Back Link */}
        <Link href="/" className="text-xs font-bold text-gray-400 hover:text-white flex items-center gap-1.5 uppercase tracking-wider transition-colors w-fit">
          <ArrowLeft className="w-4 h-4" /> Back to Universe
        </Link>

        {/* Creator Bio Header */}
        <div className="p-8 bg-[#0d0e12] border border-[#1a1c23] rounded-2xl flex flex-col md:flex-row gap-6 items-center md:items-start relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-3xl rounded-full"></div>
          
          <div className="w-24 h-24 rounded-full bg-blue-900 flex items-center justify-center font-black text-white text-3xl uppercase shrink-0 select-none shadow-lg shadow-blue-950/20">
            {profile.penName.charAt(0)}
          </div>

          <div className="flex-1 flex flex-col justify-between h-full text-center md:text-left">
            <div>
              <div className="flex flex-col md:flex-row md:items-center gap-3 justify-center md:justify-start">
                <h2 className="text-2xl font-black text-white">{profile.penName}</h2>
                <div className="flex gap-2 justify-center">
                  {profile.verificationStatus === "VERIFIED" && (
                    <span className="bg-blue-600/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
                      Verified
                    </span>
                  )}
                  {profile.isFeatured && (
                    <span className="bg-amber-600/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
                      Featured
                    </span>
                  )}
                </div>
              </div>
              <p className="text-xs text-blue-400 font-bold uppercase tracking-wider mt-1">{profile.type} creator</p>
              <p className="text-sm text-gray-400 mt-3 max-w-2xl leading-relaxed">{profile.bio || "No biography provided."}</p>
            </div>

            <div className="flex items-center gap-6 justify-center md:justify-start mt-6 text-xs font-bold text-gray-500 uppercase tracking-widest">
              <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-gray-600" /> {profile.followerCount} Followers</span>
              <span className="flex items-center gap-1.5"><Eye className="w-4 h-4 text-gray-600" /> {profile.viewCount} Views</span>
            </div>
          </div>
        </div>

        {/* Purchase Notification Banner */}
        {purchaseStatus === "success" && (
          <div className="p-4 bg-green-950/20 border border-green-500/30 text-green-400 text-xs font-bold rounded-xl flex items-center gap-2">
            <Check className="w-5 h-5" /> Membership purchased successfully! Thank you for supporting this creator.
          </div>
        )}
        {purchaseStatus === "error" && (
          <div className="p-4 bg-red-950/20 border border-red-500/30 text-red-400 text-xs font-bold rounded-xl flex items-center gap-2">
            <ShieldAlert className="w-5 h-5" /> {errorMessage}
          </div>
        )}

        {/* Tabbed Navigation Pills */}
        <div className="flex border-b border-[#1a1c23] overflow-x-auto scrollbar-hide">
          {profileTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveProfileTab(tab.id)}
              className={cn(
                "px-5 py-3 border-b-2 text-xs font-bold uppercase tracking-wider transition-all duration-200 shrink-0 whitespace-nowrap",
                activeProfileTab === tab.id
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-gray-500 hover:text-white"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB CONTENTS */}
        <div className="w-full font-semibold">
          
          {/* TAB: HOME */}
          {activeProfileTab === "home" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Side: Biography and teaser items */}
              <div className="lg:col-span-2 flex flex-col gap-8">
                {/* Active Goals */}
                <div className="p-6 bg-[#0d0e12] border border-[#1a1c23] rounded-2xl">
                  <h4 className="text-sm font-extrabold uppercase tracking-wider text-blue-400 flex items-center gap-2 mb-4">
                    <Target className="w-4 h-4 text-blue-500" /> Active Creator Goals
                  </h4>
                  {goals.length === 0 ? (
                    <p className="text-xs text-gray-500 font-bold text-center">No active goals.</p>
                  ) : (
                    <div className="flex flex-col gap-5">
                      {goals.map((goal: any) => {
                        const progress = goal.targetAmount > 0 ? (goal.currentProgress / goal.targetAmount) * 100 : 0;
                        return (
                          <div key={goal.id} className="pb-4 border-b border-slate-900 last:border-b-0 last:pb-0">
                            <div className="flex justify-between text-xs font-bold text-gray-300">
                              <span>{goal.title}</span>
                              <span>{Math.round(progress)}%</span>
                            </div>
                            <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden mt-1.5">
                              <div 
                                className="h-full bg-blue-500 transition-all duration-300"
                                style={{ width: `${Math.min(100, progress)}%` }}
                              ></div>
                            </div>
                            <div className="flex justify-between text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-wider">
                              <span>{goal.currentProgress} / {goal.targetAmount} {goal.type === "MEMBER" ? "Members" : "Credits"}</span>
                              <span className="text-blue-400 font-extrabold">Reward: {goal.reward}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Featured Series preview */}
                <div className="flex flex-col gap-4">
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">Active Series</h3>
                  {series.length === 0 ? (
                    <div className="p-6 bg-[#0d0e12] border border-[#1a1c23] rounded-2xl text-center text-gray-500 text-xs font-bold">
                      No active series published.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {series.slice(0, 2).map((s: any) => (
                        <div key={s.id} className="p-4 bg-[#0d0e12] border border-[#1a1c23] rounded-xl flex gap-3">
                          <div className="w-16 h-20 bg-zinc-900 rounded-lg overflow-hidden shrink-0">
                            {s.coverUrl && <img src={s.coverUrl} alt={s.title} className="object-cover w-full h-full" />}
                          </div>
                          <div className="flex flex-col justify-between">
                            <div>
                              <h4 className="font-extrabold text-xs text-white line-clamp-1">{s.title}</h4>
                              <p className="text-[10px] text-gray-500 capitalize mt-0.5">{s.type.toLowerCase()} • {s.status.toLowerCase()}</p>
                            </div>
                            <Link href={`/read/${s.id}`}>
                              <button className="text-[10px] font-black uppercase text-blue-400 flex items-center gap-0.5">
                                Read now <ArrowUpRight className="w-3.5 h-3.5" />
                              </button>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side: Quick facts / achievements */}
              <div className="flex flex-col gap-6">
                {/* Statistics Card */}
                <div className="p-6 bg-[#0d0e12] border border-[#1a1c23] rounded-2xl">
                  <h4 className="text-xs font-black uppercase text-gray-400 mb-4 tracking-wider">Creator Summary</h4>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="bg-slate-950/40 p-3 border border-zinc-900 rounded-xl">
                      <span className="text-[9px] text-gray-500 font-extrabold uppercase">Followers</span>
                      <span className="text-base font-black text-white mt-1 block">{profile.followerCount}</span>
                    </div>
                    <div className="bg-slate-950/40 p-3 border border-zinc-900 rounded-xl">
                      <span className="text-[9px] text-gray-500 font-extrabold uppercase">Profile Views</span>
                      <span className="text-base font-black text-white mt-1 block">{profile.viewCount}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: SERIES */}
          {activeProfileTab === "series" && (
            <div className="flex flex-col gap-6">
              <h3 className="text-base font-black text-white uppercase tracking-wider">Published Books & Series ({series.length})</h3>
              {series.length === 0 ? (
                <div className="p-12 bg-[#0d0e12] border border-[#1a1c23] rounded-3xl text-center text-gray-500 text-xs font-bold">
                  This creator hasn't published any series yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {series.map((s: any) => (
                    <div key={s.id} className="p-5 bg-[#0d0e12] border border-[#1a1c23] hover:border-zinc-800 rounded-2xl flex flex-col justify-between transition-colors">
                      <div className="flex gap-4">
                        <div className="w-20 h-28 bg-zinc-950 border border-zinc-900 rounded-xl overflow-hidden shrink-0">
                          {s.coverUrl && <img src={s.coverUrl} alt={s.title} className="object-cover w-full h-full" />}
                        </div>
                        <div className="flex flex-col">
                          <h4 className="font-extrabold text-sm text-white line-clamp-2">{s.title}</h4>
                          <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider mt-1">{s.type}</span>
                          <span className="text-[9px] text-gray-500 uppercase mt-0.5">{s.status.toLowerCase()}</span>
                        </div>
                      </div>
                      
                      <div className="mt-4 border-t border-zinc-900/60 pt-4 flex justify-between items-center">
                        <span className="text-[10px] text-gray-500 font-bold">Likes: {s.likes} ♥</span>
                        <Link href={`/read/${s.id}`}>
                          <button className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider transition">
                            Read Series
                          </button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: POSTS & FEED */}
          {activeProfileTab === "posts" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Timeline posts (2/3 width) */}
              <div className="lg:col-span-2 flex flex-col gap-6">
                
                {/* Post search box */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
                    <input 
                      type="text"
                      placeholder="Search updates..."
                      value={postSearch}
                      onChange={(e) => setPostSearch(e.target.value)}
                      className="w-full bg-[#0d0e12] border border-[#1a1c23] hover:border-[#232630] rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none transition"
                    />
                  </div>

                  {postTagFilter && (
                    <button 
                      onClick={() => setPostTagFilter(null)}
                      className="bg-blue-600/15 border border-blue-500/30 text-blue-400 rounded-xl px-3 text-xs font-bold uppercase flex items-center gap-1"
                    >
                      {postTagFilter} <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {filteredPosts.length === 0 ? (
                  <div className="p-8 bg-[#0d0e12] border border-[#1a1c23] rounded-2xl text-center text-gray-500 font-bold text-xs italic">
                    No posts matched the active filter or search query.
                  </div>
                ) : (
                  <div className="flex flex-col gap-6">
                    {filteredPosts.map((post: any) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        currentUserId={currentUserId}
                        onRefresh={refetchPosts}
                        onSubscribe={(tierId) => {
                          setActiveProfileTab("memberships");
                          handleSubscribe(tierId, "COINS");
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Sidebar filter tags */}
              <div className="flex flex-col gap-6">
                <div className="p-6 bg-[#0d0e12] border border-[#1a1c23] rounded-2xl">
                  <h4 className="text-xs font-black uppercase text-gray-400 mb-3 tracking-wider flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-blue-500" /> Filter Tags
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {["#ConceptArt", "#BehindTheScenes", "#ChapterPreview", "#ProgressUpdate", "#Announcement", "#Poll"].map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setPostTagFilter(tag)}
                        className={cn(
                          "px-2.5 py-1 rounded text-[10px] font-bold border transition",
                          postTagFilter === tag 
                            ? "bg-blue-600 border-blue-500 text-white" 
                            : "bg-slate-950/40 border-zinc-900 hover:border-zinc-800 text-gray-400 hover:text-white"
                        )}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: MEMBERSHIPS */}
          {activeProfileTab === "memberships" && (
            <div className="flex flex-col gap-6">
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-wider">Studio Membership Levels</h3>
                <p className="text-xs text-gray-500 font-bold mt-1 uppercase tracking-wider">Support monthly to unlock sketches, early uploads, and wallpapers.</p>
              </div>

              {tiers.length === 0 ? (
                <div className="p-12 bg-[#0d0e12] border border-[#1a1c23] rounded-3xl text-center text-gray-500 font-bold text-xs">
                  This creator has not configured membership tiers yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {tiers.map((tier: any) => (
                    <div 
                      key={tier.id} 
                      className="p-6 bg-[#0d0e12] border-2 rounded-2xl flex flex-col justify-between relative overflow-hidden"
                      style={{ borderColor: tier.colorTheme }}
                    >
                      <div>
                        {tier.isFeatured && (
                          <span className="bg-blue-600 text-white font-extrabold text-[9px] uppercase px-2 py-0.5 rounded-full absolute top-4 right-4 tracking-wider">
                            Featured
                          </span>
                        )}

                        <h4 className="text-base font-black text-white">{tier.name}</h4>
                        <p className="text-xs text-gray-400 mt-2 min-h-[36px]">{tier.description}</p>
                        
                        <div className="mt-4 pb-4 border-b border-zinc-900">
                          <span className="text-2xl font-black text-white">${tier.priceUsd}</span>
                          <span className="text-xs text-gray-500 font-bold uppercase ml-1">/ month</span>
                          <p className="text-xs text-blue-400 font-semibold mt-1">or {tier.priceCoins} Credits/month</p>
                        </div>

                        <div className="mt-4 flex flex-col gap-2">
                          <span className="text-[10px] font-extrabold uppercase text-gray-500 tracking-wider">Perks:</span>
                          {tier.benefits?.map((benefit: string, idx: number) => (
                            <div key={idx} className="flex items-center gap-2 text-xs text-gray-300">
                              <Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                              <span>{benefit}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mt-6 flex flex-col gap-2">
                        <button 
                          onClick={() => handleSubscribe(tier.id, "DIRECT")}
                          className="w-full bg-slate-800 hover:bg-slate-700 text-white font-extrabold py-2.5 rounded-xl text-xs uppercase tracking-wider transition-colors"
                        >
                          Direct subscription
                        </button>
                        <button 
                          onClick={() => handleSubscribe(tier.id, "COINS")}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-2.5 rounded-xl text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Coins className="w-4 h-4" /> Subscribe with Credits
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: ABOUT */}
          {activeProfileTab === "about" && (
            <div className="bg-[#0d0e12] border border-[#1a1c23] p-6 rounded-2xl flex flex-col gap-6">
              <h3 className="text-base font-black text-white uppercase tracking-wider border-b border-zinc-900 pb-3">Creator Biography Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-gray-400">
                <div className="flex flex-col gap-4">
                  <p className="leading-relaxed text-sm text-gray-300">{profile.bio || "No biography provided."}</p>
                  
                  <div className="flex items-center gap-2 mt-2">
                    <Globe className="w-4 h-4 text-blue-500" />
                    <span>Country Origin: <strong className="text-white">United States</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-500" />
                    <span>Active Language: <strong className="text-white">English</strong></span>
                  </div>
                </div>

                <div className="bg-slate-950/40 p-4 border border-zinc-900 rounded-xl flex flex-col gap-3">
                  <span className="text-[10px] text-gray-500 font-extrabold uppercase tracking-wider block">Creation stats</span>
                  <div className="flex justify-between items-center">
                    <span>Active penName:</span>
                    <strong className="text-white">{profile.penName}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Creator Level:</span>
                    <strong className="text-blue-400">Level 4</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Joined Date:</span>
                    <strong className="text-white">{new Date(profile.createdAt).toLocaleDateString()}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Total Series published:</span>
                    <strong className="text-white">{series.length}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: ACHIEVEMENTS */}
          {activeProfileTab === "achievements" && (
            <div className="flex flex-col gap-6">
              <h3 className="text-base font-black text-white uppercase tracking-wider">Creator Platform Achievements</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { title: "First Publish Milestone", date: "Level 1 Achieved", met: true },
                  { title: "10,000 Cumulative Views", date: "Level 3 Achieved", met: profile.viewCount >= 10000 },
                  { title: "Verified Identity Stamp", date: "Level 7 Achieved", met: profile.verificationStatus === "VERIFIED" },
                  { title: "Awarded Featured Badge", date: "Level 8 Achieved", met: profile.isFeatured }
                ].map((ach, idx) => (
                  <div key={idx} className={cn(
                    "p-4 rounded-xl border flex items-center justify-between transition-colors",
                    ach.met 
                      ? "bg-blue-950/15 border-blue-500/20 text-blue-300" 
                      : "bg-slate-950/20 border-slate-900 text-gray-600"
                  )}>
                    <div>
                      <h5 className="text-sm font-extrabold">{ach.title}</h5>
                      <span className="text-[9px] text-gray-500 uppercase tracking-widest font-black mt-0.5 block">{ach.date}</span>
                    </div>
                    {ach.met ? <Check className="w-5 h-5 text-blue-400" /> : <Clock className="w-4 h-4 text-gray-700" />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: SUPPORT & TIP */}
          {activeProfileTab === "support" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Tip coins form (2/3 width) */}
              <div className="lg:col-span-2 bg-[#0d0e12] border border-[#1a1c23] p-6 rounded-2xl flex flex-col gap-4">
                <h4 className="text-sm font-extrabold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-blue-500" /> Direct wallet Tip Coins
                </h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Support this creator directly by tipping wall coins. The amount is immediately transferred to the creator's cash-out ledger.
                </p>

                <div className="flex gap-2 items-center bg-slate-950 border border-zinc-900 rounded-xl p-3 mt-2">
                  <Coins className="w-4 h-4 text-amber-500" />
                  <input 
                    type="number" 
                    value={customTipAmt}
                    onChange={(e) => setCustomTipAmt(Number(e.target.value))}
                    className="flex-1 bg-transparent text-sm font-bold text-white focus:outline-none"
                    placeholder="Enter coin amount..."
                  />
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider pr-1">Credits</span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[100, 500, 1000, 5000].map((amt) => (
                    <button 
                      key={amt}
                      onClick={() => setCustomTipAmt(amt)}
                      className={cn(
                        "py-2 rounded-xl text-xs font-black transition border",
                        customTipAmt === amt 
                          ? "bg-amber-600/10 border-amber-500 text-amber-400" 
                          : "bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-gray-300"
                      )}
                    >
                      {amt}
                    </button>
                  ))}
                </div>

                <button 
                  onClick={handleSendTip}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3 rounded-xl text-xs uppercase tracking-wider shadow-lg transition mt-4"
                >
                  Send Tip Coins
                </button>
              </div>

              {/* Gift Wall */}
              <div className="bg-[#0d0e12] border border-[#1a1c23] p-6 rounded-2xl flex flex-col gap-4">
                <h4 className="text-sm font-extrabold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                  <Gift className="w-4 h-4 text-blue-500" /> Gift Wall
                </h4>
                <p className="text-xs text-gray-400 leading-relaxed mb-1">Send customized stickers directly to the creator's public profile wall.</p>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { name: "Golden Pen", cost: 100, color: "from-amber-600/20 to-yellow-500/10 border-amber-500/20 text-amber-400" },
                    { name: "Magic Book", cost: 500, color: "from-blue-600/20 to-indigo-500/10 border-blue-500/20 text-blue-400" },
                    { name: "Golden Feather", cost: 1000, color: "from-blue-600/20 to-indigo-500/10 border-blue-500/20 text-blue-400" },
                    { name: "Super Support Pack", cost: 5000, color: "from-red-600/20 to-orange-500/10 border-red-500/20 text-red-400" }
                  ].map((gift, idx) => (
                    <button 
                      key={idx}
                      onClick={() => handleSendGift(gift.name, gift.cost)}
                      className={cn(
                        "p-3 bg-gradient-to-br rounded-xl border flex flex-col items-center justify-between text-center transition-transform hover:scale-105 active:scale-95",
                        gift.color
                      )}
                    >
                      <Gift className="w-6 h-6 mb-2" />
                      <span className="text-[10px] font-extrabold uppercase tracking-wider">{gift.name}</span>
                      <span className="text-xs font-black mt-1">{gift.cost} Coins</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
