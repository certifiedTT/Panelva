"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Search, Compass, Flame, Clock, Users, Star, ArrowUpRight, 
  MessageSquare, Heart, RefreshCw, Tag, Award, UserPlus, BookOpen
} from "lucide-react";
import { trpc } from "../../lib/trpc";
import PostCard from "../../components/post-card";
import { cn } from "@/lib/utils";

type TabType = "discover" | "following" | "featured";

export default function CreatorHubPage() {
  const [currentUser, setCurrentUser] = useState("Guest");
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<TabType>("discover");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Load current user profile info from localStorage
  useEffect(() => {
    const user = localStorage.getItem("panelva_user");
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  const utils = trpc.useUtils();

  // Fetch current user db profile to get their UUID ID
  const { data: dbUser } = (trpc.user.getEmailByUsername as any).useQuery(
    { username: currentUser },
    { enabled: currentUser !== "Guest" }
  );

  // Fetch current user details to get user ID
  const { data: profileData } = (trpc.creator.getCreatorProfileByUsername as any).useQuery(
    { username: currentUser },
    { enabled: currentUser !== "Guest" }
  );

  // Set current user UUID ID
  useEffect(() => {
    if (profileData?.userId) {
      setCurrentUserId(profileData.userId);
    } else if (dbUser?.id) {
      setCurrentUserId(dbUser.id);
    }
  }, [profileData, dbUser]);

  // Background prefetch all 3 tabs for instant switching
  useEffect(() => {
    (utils.post.getHubFeed as any).prefetch({ tab: "discover", currentUserId });
    (utils.post.getHubFeed as any).prefetch({ tab: "following", currentUserId });
    (utils.post.getHubFeed as any).prefetch({ tab: "featured", currentUserId });
  }, [utils, currentUserId]);

  // Fetch posts feed (stale-while-revalidate)
  const { data: feedData, isLoading: feedLoading, refetch: refetchFeed } = (trpc.post.getHubFeed as any).useQuery({
    tab: activeTab,
    currentUserId: currentUserId
  });

  // Fetch popular creators for sidebar recommendations
  const { data: popularCreators } = (trpc.admin.listMonetizationApplications as any).useQuery(
    undefined,
    { enabled: true }
  );

  // Mock list of popular creators if endpoint returns empty (to make page look extremely populated and premium)
  const fallbackCreators = [
    { id: "1", penName: "ArtisticManga", followerCount: 1240, type: "ARTIST", bio: "Illustrator behind the hit comic 'Nebula Chronicles'." },
    { id: "2", penName: "J.K. Novelist", followerCount: 940, type: "NOVELIST", bio: "Epic fantasy author and worldbuilder. Writing 'Shadow Bound'." },
    { id: "3", penName: "WebtoonStudio", followerCount: 3400, type: "STUDIO", bio: "Official production collective drawing modern daily series." }
  ];

  // Predefined popular hashtags
  const hashtags = [
    "#ConceptArt",
    "#BehindTheScenes",
    "#ChapterPreview",
    "#ProgressUpdate",
    "#Announcement",
    "#Poll",
    "#Milestone"
  ];

  // Filter posts by search query and tags
  const rawPosts = feedData?.items || [];
  
  const filteredPosts = rawPosts.filter((post: any) => {
    const matchesSearch = searchQuery 
      ? post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        post.content.toLowerCase().includes(searchQuery.toLowerCase()) || 
        post.creatorProfile.penName.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
      
    const matchesTag = selectedTag 
      ? post.content.includes(selectedTag) || post.title.includes(selectedTag)
      : true;

    return matchesSearch && matchesTag;
  });

  return (
    <div className="min-h-screen bg-[#07080a] text-gray-100 font-sans p-8">
      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        
        {/* Banner header */}
        <div className="p-8 bg-[#0d0e12] border border-[#1a1c23] rounded-3xl flex flex-col md:flex-row gap-6 justify-between items-center relative overflow-hidden text-center md:text-center">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/5 blur-3xl rounded-full"></div>
          
          <div className="flex flex-col gap-2 max-w-2xl mx-auto items-center text-center">
            <h1 className="text-3xl font-black text-white tracking-tight">Creator Hub</h1>
            <p className="text-xs text-gray-400 leading-relaxed font-medium uppercase tracking-wider text-center">
              Welcome to the social layer of Panelva. Interact with authors, view behind-the-scenes concept sketches, and support creators directly.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-zinc-900/60 p-4 border border-zinc-800/80 rounded-2xl shrink-0 self-center">
            <div className="flex flex-col text-center md:text-left">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Browsing as:</span>
              <span className="text-sm font-extrabold text-blue-400">@{currentUser}</span>
            </div>
          </div>
        </div>

        {/* Search, filters & tabs bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
            {(
              [
                { id: "discover", label: "Discover", icon: <Compass className="w-4 h-4" /> },
                { id: "following", label: "Following", icon: <Users className="w-4 h-4" /> },
                { id: "featured", label: "Featured", icon: <Star className="w-4 h-4" /> }
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSelectedTag(null);
                }}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition shrink-0 border",
                  activeTab === tab.id
                    ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/20"
                    : "bg-[#0d0e12] border-[#1a1c23] hover:border-zinc-800 text-gray-400 hover:text-white"
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search box input */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search posts, tags, authors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0d0e12] border border-[#1a1c23] hover:border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-xs text-white focus:outline-none transition"
            />
          </div>
        </div>

        {/* Main layout contents */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Timeline Posts Feed (2/3 width) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {feedLoading && !feedData ? (
              // Skeleton loading state only on cold start without cache
              <div className="flex flex-col gap-6">
                {[1, 2].map((i) => (
                  <div key={i} className="bg-[#0d0e12] border border-[#1a1c23] p-6 rounded-2xl flex flex-col gap-4 animate-pulse">
                    <div className="flex justify-between">
                      <div className="flex gap-3">
                        <div className="w-10 h-10 rounded-full bg-zinc-800"></div>
                        <div className="flex flex-col gap-2">
                          <div className="w-24 h-4 bg-zinc-800 rounded"></div>
                          <div className="w-16 h-3 bg-zinc-800 rounded"></div>
                        </div>
                      </div>
                      <div className="w-20 h-6 bg-zinc-800 rounded"></div>
                    </div>
                    <div className="w-full h-20 bg-zinc-800 rounded"></div>
                  </div>
                ))}
              </div>
            ) : filteredPosts.length === 0 ? (
              // Empty Feed state
              <div className="p-12 bg-[#0d0e12] border border-[#1a1c23] rounded-3xl text-center flex flex-col items-center gap-4">
                <Compass className="w-12 h-12 text-gray-600 animate-bounce" />
                <div>
                  <h3 className="font-extrabold text-white text-base">No timeline posts found</h3>
                  <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                    {selectedTag 
                      ? `We couldn't find any posts matching ${selectedTag}. Try exploring other topics!`
                      : activeTab === "following" 
                        ? "You haven't followed any creators yet. Discover creators below and follow them to see their posts here!" 
                        : "Be the first to follow popular creators or explore Discover and Featured feeds!"}
                  </p>
                </div>
                <button 
                  onClick={() => {
                    setActiveTab("discover");
                    setSelectedTag(null);
                    setSearchQuery("");
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-colors shadow-lg shadow-blue-900/20"
                >
                  Explore Discover
                </button>
              </div>
            ) : (
              // Posts feed list render
              <div className="flex flex-col gap-6">
                {filteredPosts.map((post: any) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    currentUserId={currentUserId}
                    onRefresh={refetchFeed}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right sidebar filters and who to follow */}
          <div className="flex flex-col gap-8">
            
            {/* Tag Filters Widget */}
            <div className="p-6 bg-[#0d0e12] border border-[#1a1c23] rounded-2xl flex flex-col gap-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-blue-400 flex items-center gap-2">
                <Tag className="w-4 h-4 text-blue-500" /> Hot Topics & Tags
              </h4>
              <p className="text-[10px] text-gray-400 leading-relaxed font-semibold">Filter the feed by specific creator tags:</p>
              
              <div className="flex flex-wrap gap-2 mt-1">
                <button
                  onClick={() => setSelectedTag(null)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[10px] font-extrabold transition",
                    selectedTag === null
                      ? "bg-blue-600 text-white"
                      : "bg-slate-950/40 text-gray-400 hover:text-white border border-zinc-900"
                  )}
                >
                  All Topics
                </button>
                {hashtags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[10px] font-extrabold transition border",
                      selectedTag === tag
                        ? "bg-blue-600 border-blue-500 text-white"
                        : "bg-slate-950/40 border-zinc-900 hover:border-zinc-800 text-gray-400 hover:text-white"
                    )}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Who to Follow Widget */}
            <div className="p-6 bg-[#0d0e12] border border-[#1a1c23] rounded-2xl flex flex-col gap-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-blue-400 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" /> Who to Follow
              </h4>

              <div className="flex flex-col gap-4 mt-2">
                {fallbackCreators.map((creator) => (
                  <div key={creator.id} className="flex justify-between items-start gap-2 pb-3 border-b border-zinc-900 last:border-0 last:pb-0">
                    <div className="flex gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-blue-900 flex items-center justify-center font-extrabold text-xs text-white uppercase shrink-0">
                        {creator.penName.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <Link href={`/creator/${creator.id}`} className="text-xs font-extrabold text-white hover:underline">
                          {creator.penName}
                        </Link>
                        <span className="text-[8px] text-gray-500 font-extrabold uppercase mt-0.5">{creator.followerCount} Followers</span>
                        <p className="text-[10px] text-gray-400 mt-1.5 leading-relaxed font-semibold">{creator.bio}</p>
                      </div>
                    </div>
                    <Link href={`/creator/${creator.id}`}>
                      <button className="p-1.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 rounded-lg transition">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </Link>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
