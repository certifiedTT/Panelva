"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Heart, MessageSquare, Bookmark, Forward, Gift, DollarSign, Pin, 
  Check, X, ShieldAlert, Award, Trash2, Send, Smile, UserPlus, 
  UserMinus, Play, Flame, Image, List, HelpCircle, Lock, RefreshCw, Star
} from "lucide-react";
import { trpc } from "../lib/trpc";
import { cn } from "@/lib/utils";

// Post formats and interface
export interface PostCardProps {
  post: {
    id: string;
    title: string;
    content: string;
    type: string;
    visibility: string;
    allowedTierId: string | null;
    mediaUrls: string; // JSON string array
    pollOptions: string; // JSON string array
    pollVotes: string; // JSON string dict
    qaAnswers: string; // JSON string list
    isPinned: boolean;
    viewsCount: number;
    commentsCount: number;
    sharesCount: number;
    tipsCount: number;
    giftsCount: number;
    createdAt: Date | string;
    isLocked?: boolean;
    lockMessage?: string;
    creatorProfile: {
      id: string;
      penName: string;
      userId: string;
      followerCount: number;
      verificationStatus: string;
      isFeatured: boolean;
    };
    likes: { userId: string }[];
    bookmarks: { userId: string }[];
  };
  currentUserId?: string;
  onRefresh?: () => void;
  onSubscribe?: (tierId: string) => void;
}

export default function PostCard({ post, currentUserId, onRefresh, onSubscribe }: PostCardProps) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes.length);
  const [bookmarked, setBookmarked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  
  const [showComments, setShowComments] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);
  const [tipAmount, setTipAmount] = useState(100);
  const [isCoping, setIsCoping] = useState(false);

  // Parse JSON fields safely
  const mediaUrls: string[] = JSON.parse(post.mediaUrls || "[]");
  const pollOptions: string[] = JSON.parse(post.pollOptions || "[]");
  const pollVotes: Record<string, number> = JSON.parse(post.pollVotes || "{}");
  const qaAnswers: { userId: string; username: string; answer: string; createdAt: string }[] = JSON.parse(post.qaAnswers || "[]");

  // Local vote state
  const [myVote, setMyVote] = useState<number | null>(null);
  const [totalVotes, setTotalVotes] = useState(0);
  const [optionVotes, setOptionVotes] = useState<number[]>([]);

  // Q&A answer input
  const [qaInput, setQaInput] = useState("");
  const [qaList, setQaList] = useState(qaAnswers);

  // Comments state
  const [newCommentText, setNewCommentText] = useState("");
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  // tRPC Queries and Mutations
  const { data: comments, refetch: refetchComments } = (trpc.post.getPostComments as any).useQuery(
    { postId: post.id },
    { enabled: showComments }
  );

  const followCheck = (trpc.post.isFollowingCreator as any).useQuery(
    { creatorProfileId: post.creatorProfile.id },
    { enabled: !!currentUserId }
  );

  const followMutation = trpc.post.followCreator.useMutation({
    onSuccess: (res: any) => {
      setIsFollowing(res.followed);
      if (onRefresh) onRefresh();
    }
  });

  const likeMutation = trpc.post.likePost.useMutation({
    onSuccess: (res: any) => {
      setLiked(res.liked);
      setLikeCount((prev: number) => res.liked ? prev + 1 : prev - 1);
    }
  });

  const bookmarkMutation = trpc.post.bookmarkPost.useMutation({
    onSuccess: (res: any) => {
      setBookmarked(res.bookmarked);
    }
  });

  const commentMutation = trpc.post.addComment.useMutation({
    onSuccess: () => {
      setNewCommentText("");
      setReplyingToCommentId(null);
      setReplyText("");
      refetchComments();
      if (onRefresh) onRefresh();
    }
  });

  const deleteCommentMutation = trpc.post.deleteComment.useMutation({
    onSuccess: () => {
      refetchComments();
      if (onRefresh) onRefresh();
    }
  });

  const pinCommentMutation = trpc.post.togglePinComment.useMutation({
    onSuccess: () => refetchComments()
  });

  const heartCommentMutation = trpc.post.toggleHeartComment.useMutation({
    onSuccess: () => refetchComments()
  });

  const castPollVoteMutation = trpc.post.castPollVote.useMutation({
    onSuccess: () => {
      if (onRefresh) onRefresh();
    }
  });

  const sendGiftMutation = trpc.post.sendPostGift.useMutation({
    onSuccess: () => {
      setShowGiftModal(false);
      alert("Gift sent successfully!");
      if (onRefresh) onRefresh();
    },
    onError: (err: any) => alert(err.message || "Failed to send gift. Check credits.")
  });

  const sendTipMutation = trpc.post.sendPostTip.useMutation({
    onSuccess: () => {
      setShowTipModal(false);
      alert("Tip sent successfully!");
      if (onRefresh) onRefresh();
    },
    onError: (err: any) => alert(err.message || "Failed to send tip. Check credits.")
  });

  useEffect(() => {
    if ((post as any).isFollowing !== undefined) {
      setIsFollowing((post as any).isFollowing);
    } else if (followCheck.data !== undefined) {
      setIsFollowing(followCheck.data);
    }

    if (currentUserId) {
      if ((post as any).isLiked !== undefined) {
        setLiked((post as any).isLiked);
      } else {
        setLiked(post.likes.some((l: any) => l.userId === currentUserId));
      }

      if ((post as any).isBookmarked !== undefined) {
        setBookmarked((post as any).isBookmarked);
      } else {
        setBookmarked(post.bookmarks.some((b: any) => b.userId === currentUserId));
      }
      
      // Determine local user vote
      if (pollVotes[currentUserId] !== undefined) {
        setMyVote(pollVotes[currentUserId]);
      }
    }

    // Compute poll results
    const votesArray = Object.values(pollVotes);
    setTotalVotes(votesArray.length);
    const counts = pollOptions.map((_: any, idx: number) => votesArray.filter((v: any) => v === idx).length);
    setOptionVotes(counts);
  }, [post, currentUserId, followCheck.data]);

  const handleFollow = () => {
    if (!currentUserId) {
      alert("Please log in to follow creators.");
      return;
    }
    if (isFollowing) {
      const confirmed = window.confirm(`Unfollow @${post.creatorProfile.penName}?`);
      if (!confirmed) return;
    }
    const nextState = !isFollowing;
    setIsFollowing(nextState);
    followMutation.mutate({ creatorProfileId: post.creatorProfile.id });
  };

  const handleLike = () => {
    if (!currentUserId) {
      alert("Please log in to like posts.");
      return;
    }
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikeCount((prev: number) => nextLiked ? prev + 1 : prev - 1);
    likeMutation.mutate({ postId: post.id });
  };

  const handleBookmark = () => {
    if (!currentUserId) {
      alert("Please log in to bookmark posts.");
      return;
    }
    const nextBookmarked = !bookmarked;
    setBookmarked(nextBookmarked);
    bookmarkMutation.mutate({ postId: post.id });
  };

  const handleSendGift = (giftName: string, cost: number) => {
    if (!currentUserId) return;
    sendGiftMutation.mutate({ postId: post.id, giftCost: cost, giftName });
  };

  const handleSendTip = () => {
    if (!currentUserId) return;
    sendTipMutation.mutate({ postId: post.id, amount: tipAmount });
  };

  const handlePostVote = (optionIndex: number) => {
    if (!currentUserId) {
      alert("Log in to cast a vote.");
      return;
    }
    if (myVote !== null) return; // already voted

    castPollVoteMutation.mutate({
      postId: post.id,
      optionIndex
    });

    setMyVote(optionIndex);
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    commentMutation.mutate({
      postId: post.id,
      content: newCommentText
    });
  };

  const handlePostReply = (e: React.FormEvent, parentId: string) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    commentMutation.mutate({
      postId: post.id,
      content: replyText,
      parentId
    });
  };

  const handleShare = async () => {
    const postUrl = typeof window !== "undefined" ? `${window.location.origin}/creator_hub?postId=${post.id}` : `panelva://post/${post.id}`;
    const shareData = {
      title: post.title,
      text: `Check out "${post.title}" by @${post.creatorProfile.penName} on Panelva!`,
      url: postUrl,
    };

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled or share failed, fallback to clipboard
        if (typeof navigator.clipboard !== "undefined") {
          navigator.clipboard.writeText(postUrl);
          setIsCoping(true);
          setTimeout(() => setIsCoping(false), 2000);
        }
      }
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(postUrl);
      setIsCoping(true);
      setTimeout(() => setIsCoping(false), 2000);
    }
  };

  const isCreatorOwner = currentUserId === post.creatorProfile.userId;

  // Format relative timestamp
  const getRelativeTime = (dateInput: Date | string) => {
    const date = new Date(dateInput);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="bg-[#0d0e12] border border-[#1a1c23] hover:border-zinc-800 rounded-2xl p-6 transition-all duration-300 relative flex flex-col gap-4 shadow-xl">
      {/* Header info */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Link href={`/creator/${post.creatorProfile.id}`}>
            <div className="w-10 h-10 rounded-full bg-blue-900/60 border border-blue-500/30 flex items-center justify-center font-extrabold text-white uppercase select-none cursor-pointer hover:scale-105 transition">
              {post.creatorProfile.penName.charAt(0)}
            </div>
          </Link>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <Link href={`/creator/${post.creatorProfile.id}`} className="font-extrabold text-white text-sm hover:underline cursor-pointer">
                {post.creatorProfile.penName}
              </Link>
              {post.creatorProfile.verificationStatus === "VERIFIED" && (
                <Award className="w-3.5 h-3.5 text-blue-400" />
              )}
              {post.creatorProfile.isFeatured && (
                <span className="bg-amber-500/10 text-amber-400 text-[8px] font-black uppercase px-1.5 py-0.5 rounded tracking-wide border border-amber-500/10">
                  Featured
                </span>
              )}
            </div>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">
              {getRelativeTime(post.createdAt)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {post.isPinned && (
            <span className="bg-blue-600/10 text-blue-400 text-[9px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1">
              <Pin className="w-3 h-3 rotate-45" /> Pinned
            </span>
          )}

          {post.visibility !== "PUBLIC" && (
            <span className="bg-zinc-800 text-zinc-400 text-[9px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1">
              <Lock className="w-3 h-3" /> {post.visibility.replace("_", " ")}
            </span>
          )}

          {/* Follow toggle button */}
          {!isCreatorOwner && currentUserId && (
            <button 
              onClick={handleFollow}
              className={cn(
                "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors flex items-center gap-1",
                isFollowing 
                  ? "bg-zinc-800 text-zinc-400 hover:bg-zinc-700" 
                  : "bg-blue-600 text-white hover:bg-blue-700"
              )}
            >
              {isFollowing ? (
                <>
                  <UserMinus className="w-3 h-3" /> Followed
                </>
              ) : (
                <>
                  <UserPlus className="w-3 h-3" /> Follow
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Body Section */}
      <div className="flex flex-col gap-2">
        <h3 className="font-extrabold text-white text-base leading-snug">{post.title}</h3>
        
        {post.isLocked ? (
          // LOCKED VISIBILITY OVERLAY
          <div className="p-8 bg-[#121319] border border-dashed border-[#232630] rounded-xl flex flex-col items-center text-center gap-4 my-2 select-none relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/5 to-transparent"></div>
            <div className="w-12 h-12 rounded-full bg-blue-950/80 flex items-center justify-center border border-blue-500/20 text-blue-400 shadow-md">
              <Lock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="font-extrabold text-white text-sm">Exclusive Content Restricted</p>
              <p className="text-xs text-gray-500 mt-1 max-w-sm">{post.lockMessage || "This post is only available to subscribing studio members."}</p>
            </div>
            <button 
              onClick={() => onSubscribe && post.allowedTierId && onSubscribe(post.allowedTierId)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-6 py-2 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-blue-900/20 transition-all flex items-center gap-1.5"
            >
              <Flame className="w-4 h-4" /> Unlock Content
            </button>
          </div>
        ) : (
          // UNLOCKED CONTENT
          <div className="flex flex-col gap-4">
            <p className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">{post.content}</p>

            {/* Poll render */}
            {post.type === "POLL" && pollOptions.length > 0 && (
              <div className="bg-[#121319] border border-[#1a1c23] p-4 rounded-xl flex flex-col gap-3">
                <span className="text-[10px] text-gray-500 font-extrabold uppercase tracking-wider flex items-center gap-1">
                  <List className="w-3.5 h-3.5" /> Interactive Poll ({totalVotes} votes cast)
                </span>
                <div className="flex flex-col gap-2.5">
                  {pollOptions.map((opt: any, idx: number) => {
                    const votes = optionVotes[idx] || 0;
                    const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
                    const isMyChoice = myVote === idx;
                    
                    return (
                      <button 
                        key={idx}
                        disabled={myVote !== null}
                        onClick={() => handlePostVote(idx)}
                        className={cn(
                          "w-full text-left relative overflow-hidden rounded-xl border p-3 flex justify-between items-center text-xs font-bold transition-all",
                          isMyChoice 
                            ? "bg-blue-950/20 border-blue-500/40 text-blue-300" 
                            : "bg-slate-950/30 border-zinc-900 hover:border-zinc-800 text-gray-300"
                        )}
                      >
                        {/* Progress Bar background */}
                        {myVote !== null && (
                          <div 
                            className="absolute top-0 bottom-0 left-0 bg-blue-600/10 transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        )}
                        <span className="z-10 flex items-center gap-2">
                          {isMyChoice && <Check className="w-4 h-4 text-blue-400" />}
                          {opt}
                        </span>
                        {myVote !== null && (
                          <span className="z-10 text-gray-400 text-[10px] font-black">{pct}% ({votes})</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Progress Bar update render */}
            {post.type === "PROGRESS_UPDATE" && (
              <div className="bg-[#121319] border border-[#1a1c23] p-4 rounded-xl flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs font-bold text-gray-400">
                  <span>Work In Progress Completion</span>
                  <span className="text-blue-400 font-extrabold">85% Complete</span>
                </div>
                <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-zinc-900">
                  <div className="h-full bg-blue-500 w-[85%] rounded-full shadow-[0_0_12px_rgba(59,130,246,0.3)] animate-pulse"></div>
                </div>
                <p className="text-[10px] text-gray-500 italic mt-1 font-semibold">Creator comment: "Finishing chapter outline and concept arts!"</p>
              </div>
            )}

            {/* Gallery Image rendering */}
            {mediaUrls.length > 0 && (
              <div className={cn(
                "grid gap-2 my-2 overflow-hidden rounded-xl border border-zinc-900",
                mediaUrls.length === 1 ? "grid-cols-1" : mediaUrls.length === 2 ? "grid-cols-2" : "grid-cols-3"
              )}>
                {mediaUrls.map((url: any, index: number) => (
                  <div key={index} className="relative aspect-video bg-zinc-950 group overflow-hidden cursor-pointer">
                    <img 
                      src={url} 
                      alt={`Post gallery media ${index}`} 
                      className="object-cover w-full h-full group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                      <Image className="w-6 h-6 text-white" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Interactions Action Bar */}
      <div className="flex items-center justify-between border-t border-zinc-900/60 pt-4 mt-2 text-xs font-bold text-gray-500">
        <div className="flex items-center gap-5">
          {/* Like */}
          <button 
            onClick={handleLike}
            className={cn(
              "flex items-center gap-1.5 transition-colors",
              liked ? "text-red-500" : "hover:text-white"
            )}
          >
            <Heart className={cn("w-4 h-4", liked && "fill-red-500")} />
            <span>{likeCount}</span>
          </button>

          {/* Comment */}
          <button 
            onClick={() => setShowComments(!showComments)}
            className={cn(
              "flex items-center gap-1.5 transition-colors hover:text-white",
              showComments && "text-blue-400"
            )}
          >
            <MessageSquare className="w-4 h-4" />
            <span>{comments?.length ?? post.commentsCount}</span>
          </button>

          {/* Bookmark */}
          <button 
            onClick={handleBookmark}
            className={cn(
              "flex items-center gap-1.5 transition-colors",
              bookmarked ? "text-amber-500" : "hover:text-white"
            )}
          >
            <Bookmark className={cn("w-4 h-4", bookmarked && "fill-amber-500")} />
          </button>

          {/* Share */}
          <button 
            onClick={handleShare}
            className="flex items-center gap-1.5 hover:text-white transition-colors"
          >
            <Forward className="w-4 h-4" />
            <span>{isCoping ? "Copied" : "Share"}</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Gift */}
          {currentUserId && !isCreatorOwner && (
            <button 
              onClick={() => setShowGiftModal(true)}
              className="bg-blue-950/30 hover:bg-blue-900/30 border border-blue-500/20 text-blue-400 px-3 py-1.5 rounded-xl transition flex items-center gap-1"
            >
              <Gift className="w-3.5 h-3.5" /> Gift
            </button>
          )}

          {/* Tip */}
          {currentUserId && !isCreatorOwner && (
            <button 
              onClick={() => setShowTipModal(true)}
              className="bg-amber-950/30 hover:bg-amber-900/30 border border-amber-500/20 text-amber-400 px-3 py-1.5 rounded-xl transition flex items-center gap-1"
            >
              <DollarSign className="w-3.5 h-3.5" /> Tip
            </button>
          )}
        </div>
      </div>

      {/* Gift Modal popup */}
      <AnimatePresence>
        {showGiftModal && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0d0e12] border border-[#1a1c23] p-6 rounded-2xl w-full max-w-sm flex flex-col gap-4 text-gray-200"
            >
              <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                <span className="font-extrabold text-sm text-white flex items-center gap-2">
                  <Gift className="w-4 h-4 text-blue-400" /> Send Custom Gift
                </span>
                <button onClick={() => setShowGiftModal(false)} className="text-gray-500 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: "Golden Pen", cost: 100 },
                  { name: "Magic Book", cost: 500 },
                  { name: "Golden Feather", cost: 1000 },
                  { name: "Super Support Pack", cost: 5000 }
                ].map((gift: any, idx: number) => (
                  <button 
                    key={idx}
                    onClick={() => handleSendGift(gift.name, gift.cost)}
                    className="p-3 bg-zinc-900 hover:bg-zinc-800 rounded-xl border border-zinc-800 hover:border-zinc-700 text-center flex flex-col items-center transition"
                  >
                    <Gift className="w-6 h-6 mb-1 text-blue-400" />
                    <span className="text-[10px] font-black text-white uppercase">{gift.name}</span>
                    <span className="text-xs text-amber-400 font-extrabold mt-1">{gift.cost} Credits</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Tip Modal popup */}
      <AnimatePresence>
        {showTipModal && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0d0e12] border border-[#1a1c23] p-6 rounded-2xl w-full max-w-sm flex flex-col gap-4 text-gray-200"
            >
              <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                <span className="font-extrabold text-sm text-white flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-amber-400" /> Tip Creator Wallet
                </span>
                <button onClick={() => setShowTipModal(false)} className="text-gray-500 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Select Credit Amount:</label>
                <div className="grid grid-cols-4 gap-2">
                  {[100, 500, 1000, 2500].map((amt: number) => (
                    <button 
                      key={amt}
                      onClick={() => setTipAmount(amt)}
                      className={cn(
                        "py-2 rounded-xl text-xs font-black transition border",
                        tipAmount === amt 
                          ? "bg-amber-600/10 border-amber-500 text-amber-400" 
                          : "bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-gray-300"
                      )}
                    >
                      {amt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between bg-zinc-950 border border-zinc-900 px-4 py-3 rounded-xl">
                <span className="text-xs text-gray-400 font-semibold">Tipping Amount:</span>
                <span className="text-sm font-black text-amber-400">{tipAmount} Credits</span>
              </div>

              <button 
                onClick={handleSendTip}
                className="bg-amber-500 hover:bg-amber-600 text-black font-extrabold py-3 rounded-xl text-xs uppercase tracking-wider shadow-lg transition"
              >
                Send Tip Credits
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Nested Comments thread panel */}
      {showComments && (
        <div className="border-t border-zinc-900/60 pt-4 mt-2 flex flex-col gap-4">
          <h4 className="font-extrabold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-blue-400" /> Reader Comments
          </h4>

          {/* New Comment input form */}
          {currentUserId ? (
            <form onSubmit={handlePostComment} className="flex gap-2">
              <input 
                type="text" 
                placeholder="Share your thoughts on this update..." 
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                className="flex-1 bg-[#121319] border border-zinc-800 hover:border-zinc-700 text-white rounded-xl px-4 py-2 text-xs focus:outline-none transition"
              />
              <button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-xl transition flex items-center justify-center shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <p className="text-[10px] text-gray-500 font-semibold italic">Please login to write a comment.</p>
          )}

          {/* Comments list thread */}
          <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto pr-2">
            {!comments || comments.length === 0 ? (
              <p className="text-xs text-gray-500 italic py-2">No comments posted yet.</p>
            ) : (
              // Group replies under parent comments
              (comments as any[]).filter((c: any) => !c.parentId).map((comment: any) => {
                const replies = (comments as any[]).filter((r: any) => r.parentId === comment.id);
                const isCommentCreator = currentUserId === comment.userId;
                
                return (
                  <div key={comment.id} className="flex flex-col gap-2 pb-3 border-b border-zinc-900/40 last:border-0 last:pb-0">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-900/40 flex items-center justify-center text-[10px] font-black uppercase text-white">
                          {comment.user.username.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-gray-200">@{comment.user.username}</span>
                          <span className="text-[8px] text-gray-500 font-bold uppercase tracking-wider">{getRelativeTime(comment.createdAt)}</span>
                        </div>

                        {/* Badges indicators */}
                        {comment.isPinned && (
                          <span className="bg-blue-600/10 text-blue-400 text-[7px] font-black uppercase px-1 rounded flex items-center gap-0.5">
                            <Pin className="w-2.5 h-2.5 rotate-45" /> Pinned
                          </span>
                        )}
                        {comment.isHearted && (
                          <span className="bg-red-600/10 text-red-400 text-[7px] font-black uppercase px-1 rounded flex items-center gap-0.5">
                            <Heart className="w-2.5 h-2.5 fill-red-400" /> Heart
                          </span>
                        )}
                      </div>

                      {/* Creator controls (Pin, Heart, Delete) */}
                      <div className="flex items-center gap-1.5 text-gray-500">
                        {isCreatorOwner && (
                          <>
                            <button 
                              onClick={() => pinCommentMutation.mutate({ commentId: comment.id })}
                              className={cn("hover:text-white p-0.5 transition", comment.isPinned && "text-blue-400")}
                              title="Pin comment"
                            >
                              <Pin className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => heartCommentMutation.mutate({ commentId: comment.id })}
                              className={cn("hover:text-white p-0.5 transition", comment.isHearted && "text-red-400")}
                              title="Heart comment"
                            >
                              <Heart className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        {(isCommentCreator || isCreatorOwner) && (
                          <button 
                            onClick={() => deleteCommentMutation.mutate({ commentId: comment.id })}
                            className="hover:text-red-400 p-0.5 transition"
                            title="Delete comment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-gray-300 pl-8 font-medium leading-relaxed">{comment.content}</p>

                    {/* Inline reply action */}
                    {currentUserId && (
                      <div className="pl-8 flex items-center gap-2">
                        <button 
                          onClick={() => setReplyingToCommentId(replyingToCommentId === comment.id ? null : comment.id)}
                          className="text-[10px] text-gray-500 hover:text-white uppercase tracking-wider font-extrabold transition-colors"
                        >
                          Reply
                        </button>
                      </div>
                    )}

                    {/* Reply Form */}
                    {replyingToCommentId === comment.id && (
                      <form onSubmit={(e) => handlePostReply(e, comment.id)} className="pl-8 flex gap-2 mt-1">
                        <input 
                          type="text" 
                          placeholder="Reply to this thread..." 
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          className="flex-1 bg-slate-950 border border-zinc-800 text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none transition"
                        />
                        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-3 rounded-lg text-[10px] font-black uppercase">
                          Send
                        </button>
                      </form>
                    )}

                    {/* Render child replies */}
                    {replies.length > 0 && (
                      <div className="pl-8 border-l border-zinc-900/60 ml-3 mt-2 flex flex-col gap-3">
                        {replies.map((reply: any) => {
                          const isReplyOwner = currentUserId === reply.userId;
                          
                          return (
                            <div key={reply.id} className="flex flex-col gap-1.5">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  <div className="w-5 h-5 rounded-full bg-blue-900/20 flex items-center justify-center text-[8px] font-black uppercase text-white">
                                    {reply.user.username.charAt(0)}
                                  </div>
                                  <span className="text-[11px] font-bold text-gray-400">@{reply.user.username}</span>
                                  <span className="text-[8px] text-gray-500 font-bold uppercase tracking-wider">{getRelativeTime(reply.createdAt)}</span>
                                </div>

                                {(isReplyOwner || isCreatorOwner) && (
                                  <button 
                                    onClick={() => deleteCommentMutation.mutate({ commentId: reply.id })}
                                    className="text-gray-500 hover:text-red-400 transition"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                              <p className="text-xs text-gray-300 pl-7 leading-relaxed">{reply.content}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Minimal Link wrapper to avoid routing errors
function Link({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) {
  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}
