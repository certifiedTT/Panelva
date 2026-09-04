"use client";

import { useState } from "react";
import { trpc } from "../lib/trpc";
import { Card, Button, Badge } from "@panelva/ui";
import { 
  ThumbsUp, 
  ThumbsDown, 
  Sparkles, 
  MessageSquare, 
  Smile,
  Gift,
  Send,
  Coins,
  Trophy,
  X,
  Flame,
  Zap,
  Star
} from "lucide-react";

export const TierBadge = ({ role, subscription }: { role: string; subscription: string }) => {
  if (role === "MASTER_ADMIN") {
    return <Badge variant="danger" size="sm">MASTER ADMIN</Badge>;
  }
  if (role === "ADMIN") {
    return <Badge variant="primary" size="sm">STAFF</Badge>;
  }
  if (role === "CREATOR") {
    return <Badge variant="success" size="sm">CREATOR</Badge>;
  }
  if (subscription === "PREMIUM") {
    return <Badge variant="warning" size="sm">PREMIUM</Badge>;
  }
  if (subscription === "PLUS") {
    return <Badge variant="primary" size="sm">PLUS</Badge>;
  }
  return null;
};

export default function CommentsSection({ chapterId, currentUser }: { chapterId: string; currentUser: string }) {
  const [commentSort, setCommentSort] = useState<"best" | "newest" | "oldest">("best");
  const [newCommentText, setNewCommentText] = useState("");
  const [selectedSticker, setSelectedSticker] = useState<string | null>(null);
  const [selectedGif, setSelectedGif] = useState<{ id: string; title: string; url: string } | null>(null);
  const [selectedGift, setSelectedGift] = useState<{ id: string; name: string; credits: number } | null>(null);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showGiftPicker, setShowGiftPicker] = useState(false);
  const [gifSearchQuery, setGifSearchQuery] = useState("");
  const [activeGiftTier, setActiveGiftTier] = useState<0 | 1 | 2 | 3>(0);
  const [giftAnnouncement, setGiftAnnouncement] = useState<{ sender: string; gift: string; credits: number } | null>(null);

  const { data: dbComments, isLoading } = (trpc.chapter.getComments as any).useQuery(
    { chapterId: chapterId },
    { enabled: !!chapterId }
  );

  const { data: searchedGifs } = (trpc.sticker as any).searchGifs.useQuery(
    { query: gifSearchQuery, limit: 12 },
    { enabled: showGifPicker }
  );

  const utils = trpc.useContext();
  const postCommentMutation = trpc.chapter.postComment.useMutation({
    onMutate: async (newComment: any) => {
      await utils.chapter.getComments.cancel({ chapterId });
      const previousComments = utils.chapter.getComments.getData({ chapterId });
      
      if (previousComments) {
        utils.chapter.getComments.setData({ chapterId }, [
          {
            id: `temp-${Date.now()}`,
            content: newComment.content,
            priorityScore: 0,
            userId: currentUser,
            chapterId: chapterId,
            gifId: newComment.gifId,
            gifUrl: newComment.gifUrl,
            stickerId: newComment.stickerId,
            createdAt: new Date().toISOString() as any,
            updatedAt: new Date().toISOString() as any,
            user: { id: currentUser, username: currentUser, role: "USER", subscription: "NONE", avatarUrl: null, createdAt: new Date().toISOString() as any, updatedAt: new Date().toISOString() as any } as any
          },
          ...previousComments,
        ]);
      }
      return { previousComments };
    },
    onError: (err: any, newComment: any, context: any) => {
      if (context?.previousComments) {
        utils.chapter.getComments.setData({ chapterId }, context.previousComments);
      }
    },
    onSettled: () => {
      utils.chapter.getComments.invalidate({ chapterId });
    },
    onSuccess: () => {
      setNewCommentText("");
      setSelectedSticker(null);
      setSelectedGif(null);
      setSelectedGift(null);
    },
  });

  const handlePostComment = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    let content = newCommentText.trim();
    if (!content && (selectedSticker || selectedGif || selectedGift)) {
      content = selectedSticker
        ? `Sent sticker: ${selectedSticker}`
        : selectedGif
        ? `Sent GIF: ${selectedGif.title}`
        : `Sent gift: ${selectedGift?.name}`;
    }
    if (!content) return;

    const giftCredits = selectedGift?.credits || 0;
    if (giftCredits >= 10000) setActiveGiftTier(3);
    else if (giftCredits >= 5000) setActiveGiftTier(2);
    else if (giftCredits >= 2000) setActiveGiftTier(1);

    if (giftCredits >= 2000) {
      setGiftAnnouncement({
        sender: currentUser || "You",
        gift: selectedGift?.name || "Gift",
        credits: giftCredits,
      });
    }

    postCommentMutation.mutate({
      chapterId: chapterId,
      content,
      stickerId: selectedSticker || undefined,
      gifId: selectedGif?.id || undefined,
      gifUrl: selectedGif?.url || undefined,
      giftId: selectedGift?.id || undefined,
      giftCredits: giftCredits || undefined,
    } as any);

    setSelectedSticker(null);
    setSelectedGif(null);
    setSelectedGift(null);
    setShowStickerPicker(false);
    setShowGifPicker(false);
    setShowGiftPicker(false);
  };

  const commentsFeed = dbComments && (dbComments as any[]).length > 0 ? (dbComments as any[]).map((c: any) => ({
    id: c.id,
    author: c.user?.username || "Unknown User",
    avatar: (c.user?.username || "U")[0].toUpperCase(),
    text: c.content,
    likes: Math.floor(Math.random() * 500),
    dislikes: 0,
    timeAgo: "Just now",
    role: c.user?.role || "USER",
    subscription: c.user?.subscription || "NONE",
    stickerId: c.stickerId,
    gifId: c.gifId,
    gifUrl: c.gifUrl,
    giftId: c.giftId,
    giftCredits: c.giftCredits,
    giftTier: c.giftTier,
  })) : [
    {
      id: "demo-1",
      author: "LunaBlade",
      avatar: "L",
      text: "That panel transition at the climax was unbelievable! Outstanding artwork.",
      likes: 42,
      dislikes: 0,
      timeAgo: "1h ago",
      role: "CREATOR",
      subscription: "PREMIUM",
      giftId: "galaxy",
      giftCredits: 2000,
      giftTier: 1,
    },
    {
      id: "demo-2",
      author: "notjud3",
      avatar: "N",
      text: "System announcement: Official chapter discussion guidelines are in effect.",
      likes: 128,
      dislikes: 0,
      timeAgo: "3h ago",
      role: "MASTER_ADMIN",
      subscription: "PREMIUM",
    }
  ];

  return (
    <div className="w-full max-w-3xl flex flex-col gap-6 text-left relative">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-extrabold text-white">
          Chapter Discussion ({commentsFeed.length})
        </h3>
        
        {/* Filter Segmented Control */}
        <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-full gap-1">
          {[
            { id: "best", label: "Best" },
            { id: "newest", label: "Newest" },
            { id: "oldest", label: "Oldest" }
          ].map((sort: any) => (
            <button
              key={sort.id}
              onClick={() => setCommentSort(sort.id as any)}
              className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                commentSort === sort.id 
                  ? "bg-blue-600/20 text-blue-400 border border-blue-500/30" 
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {sort.label}
            </button>
          ))}
        </div>
      </div>

      {/* Gift Announcement Card (for gifts >= 2,000 Credits) */}
      {giftAnnouncement && (
        <div className="flex items-center justify-between bg-amber-950/40 border border-amber-500/40 p-3 rounded-xl gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-900 flex items-center justify-center font-bold">
              <Trophy size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-amber-200">
                <span>{giftAnnouncement.sender} sent a {giftAnnouncement.gift} Gift</span>
                <Sparkles size={12} className="text-amber-400" />
              </div>
              <span className="text-xs text-slate-400">Supporting the creator</span>
            </div>
          </div>
          <span className="text-xs font-bold bg-amber-500 text-slate-900 px-2.5 py-1 rounded-full flex items-center gap-1">
            <Coins size={12} /> {giftAnnouncement.credits.toLocaleString()} Credits
          </span>
        </div>
      )}

      {/* TikTok-Style Interaction Bar Composer */}
      <div className="flex flex-col gap-2 bg-[#0B1220] p-3 rounded-2xl border border-slate-800">
        {/* Attachment chips */}
        {(selectedSticker || selectedGif || selectedGift) && (
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {selectedSticker && (
              <span className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 text-xs px-2.5 py-1 rounded-full text-blue-300">
                <Sparkles size={12} /> Sticker: {selectedSticker}
                <button onClick={() => setSelectedSticker(null)} className="hover:text-white"><X size={12} /></button>
              </span>
            )}
            {selectedGif && (
              <span className="flex items-center gap-1.5 bg-sky-500/20 border border-sky-500/40 text-xs px-2.5 py-1 rounded-full text-sky-300">
                <Sparkles size={12} /> GIF: {selectedGif.title}
                <button onClick={() => setSelectedGif(null)} className="hover:text-white"><X size={12} /></button>
              </span>
            )}
            {selectedGift && (
              <span className="flex items-center gap-1.5 bg-amber-500/20 border border-amber-500/40 text-xs px-2.5 py-1 rounded-full text-amber-300">
                <Gift size={12} /> Gift: {selectedGift.name} ({selectedGift.credits} Credits)
                <button onClick={() => setSelectedGift(null)} className="hover:text-white"><X size={12} /></button>
              </span>
            )}
          </div>
        )}

        <div className="flex items-center gap-2.5">
          <input
            type="text"
            placeholder="Join the discussion..."
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handlePostComment(); }}
            className="flex-1 bg-[#1F2937] text-sm text-white px-4 py-2.5 rounded-full outline-none border border-slate-700 placeholder:text-slate-500"
          />

          {/* Sticker Action */}
          <button
            type="button"
            onClick={() => {
              setShowStickerPicker(!showStickerPicker);
              setShowGifPicker(false);
            }}
            className={`w-9 h-9 rounded-full bg-[#1F2937] hover:bg-slate-700 flex items-center justify-center transition ${selectedSticker ? 'text-blue-400 border border-blue-500' : 'text-slate-400'}`}
            title="Stickers"
          >
            <Smile size={18} />
          </button>

          {/* GIF Action */}
          <button
            type="button"
            onClick={() => {
              setShowGifPicker(!showGifPicker);
              setShowStickerPicker(false);
            }}
            className={`w-9 h-9 rounded-full bg-[#1F2937] hover:bg-slate-700 flex items-center justify-center transition ${selectedGif ? 'text-sky-400 border border-sky-500' : 'text-slate-400'}`}
            title="Tenor GIFs"
          >
            <Sparkles size={18} />
          </button>

          {/* Gift Action */}
          <button
            type="button"
            onClick={() => setShowGiftPicker(!showGiftPicker)}
            className={`w-9 h-9 rounded-full bg-[#1F2937] hover:bg-slate-700 flex items-center justify-center transition ${selectedGift ? 'text-amber-400 border border-amber-500' : 'text-slate-400'}`}
            title="Send Gift"
          >
            <Gift size={18} />
          </button>

          {/* Send Action */}
          <button
            type="button"
            onClick={() => handlePostComment()}
            disabled={!newCommentText.trim() && !selectedSticker && !selectedGif && !selectedGift}
            className="w-9 h-9 rounded-full bg-[#2563EB] hover:bg-blue-600 disabled:opacity-40 disabled:bg-slate-700 text-white flex items-center justify-center transition"
            title="Publish"
          >
            <Send size={16} />
          </button>
        </div>

        {/* Sticker Drawer Panel */}
        {showStickerPicker && (
          <div className="mt-3 p-3 bg-slate-900 border border-slate-800 rounded-xl grid grid-cols-4 sm:grid-cols-7 gap-2">
            {[
              { id: "fire", label: "On Fire", icon: <Flame size={18} className="text-orange-500" /> },
              { id: "hyped", label: "Hyped", icon: <Zap size={18} className="text-yellow-400" /> },
              { id: "crown", label: "Goat", icon: <Trophy size={18} className="text-amber-400" /> },
              { id: "sparkle", label: "Power Up", icon: <Sparkles size={18} className="text-purple-400" /> },
              { id: "star", label: "Peak", icon: <Star size={18} className="text-amber-300" /> },
              { id: "love", label: "Loved It", icon: <Sparkles size={18} className="text-rose-400" /> },
              { id: "gg", label: "Respect", icon: <ThumbsUp size={18} className="text-emerald-400" /> },
            ].map(st => (
              <button
                key={st.id}
                onClick={() => {
                  setSelectedSticker(st.label);
                  setSelectedGif(null); // Single attachment rule
                  setShowStickerPicker(false);
                }}
                className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 gap-1"
              >
                {st.icon}
                <span className="text-[10px]">{st.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Tenor GIF Drawer Panel */}
        {showGifPicker && (
          <div className="mt-3 p-3 bg-slate-900 border border-slate-800 rounded-xl flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search Tenor GIFs..."
                value={gifSearchQuery}
                onChange={(e) => setGifSearchQuery(e.target.value)}
                className="flex-1 bg-slate-800 text-xs text-white px-3 py-1.5 rounded-lg border border-slate-700 outline-none"
              />
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto">
              {(searchedGifs || []).map((gif: any) => (
                <button
                  key={gif.id}
                  type="button"
                  onClick={() => {
                    setSelectedGif({ id: gif.id, title: gif.title, url: gif.url });
                    setSelectedSticker(null); // Single attachment rule
                    setShowGifPicker(false);
                  }}
                  className="relative rounded-lg overflow-hidden h-20 border border-slate-800 hover:border-sky-500 transition group"
                >
                  <img src={gif.previewUrl || gif.url} alt={gif.title} className="w-full h-full object-cover" />
                  <span className="absolute bottom-1 right-1 bg-black/70 text-[9px] text-white px-1 rounded">GIF</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Gift Drawer Panel */}
        {showGiftPicker && (
          <div className="mt-3 p-3 bg-slate-900 border border-slate-800 rounded-xl flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span>Send a Gift to creator</span>
              <span className="text-blue-400 font-bold flex items-center gap-1"><Coins size={12} /> 420 Credits</span>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {[
                { id: "rose", name: "Rose", credits: 5 },
                { id: "coffee", name: "Coffee", credits: 20 },
                { id: "crystal", name: "Crystal", credits: 100 },
                { id: "crown", name: "Crown", credits: 400 },
                { id: "phoenix", name: "Phoenix", credits: 1000 },
                { id: "galaxy", name: "Galaxy", credits: 2000 },
                { id: "dragon", name: "Dragon", credits: 5000 },
                { id: "supernova", name: "Supernova", credits: 10000 },
              ].map(g => (
                <button
                  key={g.id}
                  onClick={() => { setSelectedGift(g); setShowGiftPicker(false); }}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg border text-xs gap-1 ${
                    g.credits >= 2000 ? "bg-amber-950/30 border-amber-500/40 text-amber-300" : "bg-slate-800 border-slate-700 text-slate-300"
                  }`}
                >
                  <Gift size={16} className={g.credits >= 2000 ? "text-amber-400" : "text-blue-400"} />
                  <span className="text-[11px] font-bold">{g.name}</span>
                  <span className="text-[10px] text-amber-400 font-semibold">{g.credits}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Empty State */}
      {commentsFeed.length === 0 && (
        <Card className="p-8 flex flex-col items-center justify-center text-center gap-2 border border-slate-800">
          <div className="w-12 h-12 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center text-slate-400 mb-1">
            <MessageSquare size={24} />
          </div>
          <h4 className="text-sm font-bold text-white">No comments yet</h4>
          <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
            Be the first to share your thoughts, reactions, stickers, or gifts!
          </p>
        </Card>
      )}

      {/* Comments List Feed with Role Highlighting */}
      {commentsFeed.length > 0 && (
        <div className="flex flex-col gap-3 mt-1">
          {commentsFeed.map((c: any) => {
            const isMasterAdmin = c.role === "MASTER_ADMIN";
            const isAdmin = c.role === "ADMIN" || c.role === "MODERATOR";
            const isCreator = c.role === "CREATOR";
            const isTier1 = c.giftCredits >= 2000;

            let roleCardClasses = "bg-[#171B26] border-[#262D3D]";
            if (isMasterAdmin) {
              roleCardClasses = "bg-red-950/20 border-red-500/40 shadow-sm shadow-red-900/20";
            } else if (isAdmin) {
              roleCardClasses = "bg-blue-950/20 border-blue-500/40 shadow-sm shadow-blue-900/20";
            } else if (isCreator) {
              roleCardClasses = "bg-emerald-950/20 border-emerald-500/40 shadow-sm shadow-emerald-900/20";
            } else if (isTier1) {
              roleCardClasses = "bg-amber-950/20 border-amber-400/70 shadow-sm shadow-amber-900/30";
            }

            return (
              <div key={c.id} className={`p-4 rounded-xl border flex gap-3 transition ${roleCardClasses}`}>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white shrink-0 ${
                  isMasterAdmin ? 'bg-red-600' : isAdmin ? 'bg-blue-600' : isCreator ? 'bg-emerald-600' : 'bg-slate-700'
                }`}>
                  {c.avatar}
                </div>
                
                <div className="flex flex-col gap-1 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-white">@{c.author}</span>
                    <TierBadge role={c.role} subscription={c.subscription} />
                    <span className="text-xs text-slate-400">{c.timeAgo}</span>
                  </div>

                  {c.giftCredits && c.giftCredits >= 2000 && (
                    <div className="flex items-center gap-1.5 text-xs text-amber-300 font-bold">
                      <Sparkles size={12} /> Gifted {c.giftId?.toUpperCase()} ({c.giftCredits.toLocaleString()} Credits)
                    </div>
                  )}
                  
                  {c.text && c.text !== "[Sticker]" && c.text !== "[GIF]" && (
                    <p className="text-sm text-slate-200 leading-relaxed">{c.text}</p>
                  )}

                  {c.gifUrl && (
                    <div className="mt-2 max-w-[260px] h-36 rounded-xl overflow-hidden border border-slate-700 relative">
                      <img src={c.gifUrl} alt="Attached GIF" className="w-full h-full object-cover" />
                      <span className="absolute bottom-1.5 right-1.5 bg-black/70 text-[9px] text-sky-300 font-bold px-1.5 py-0.5 rounded">
                        Tenor GIF
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
                    <button 
                      aria-label="Like comment"
                      className="flex items-center gap-1 hover:text-white transition-colors"
                    >
                      <ThumbsUp size={12} />
                      <span>{c.likes}</span>
                    </button>
                    <button 
                      aria-label="Dislike comment"
                      className="flex items-center gap-1 hover:text-white transition-colors"
                    >
                      <ThumbsDown size={12} />
                      <span>{c.dislikes}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
