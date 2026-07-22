"use client";

import { useState, useRef } from "react";
import { trpc } from "../lib/trpc";
import { Heart, ThumbsUp, ThumbsDown, ChevronUp, ChevronDown, Sparkles, Mail, Eye, BookOpen } from "lucide-react";


export const TierBadge = ({ role, subscription }: { role: string; subscription: string }) => {
  const badgeStyle: React.CSSProperties = {
    fontSize: "0.62rem",
    padding: "0.22em 0.8em",
    borderRadius: "9999px",
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.03em",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    lineHeight: "1",
    whiteSpace: "nowrap",
    verticalAlign: "middle"
  };

  if (role === "MASTER_ADMIN") {
    return (
      <span style={{ ...badgeStyle, background: "rgba(124, 58, 237, 0.15)", color: "#c084fc", border: "1px solid rgba(124, 58, 237, 0.3)" }}>
        MASTER
      </span>
    );
  }
  if (role === "ADMIN") {
    return (
      <span style={{ ...badgeStyle, background: "rgba(239, 68, 68, 0.15)", color: "#f87171", border: "1px solid rgba(239, 68, 68, 0.3)" }}>
        ADMIN
      </span>
    );
  }
  if (role === "CREATOR") {
    return (
      <span style={{ ...badgeStyle, background: "rgba(16, 185, 129, 0.15)", color: "#34d399", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
        CREATOR
      </span>
    );
  }
  if (subscription === "PREMIUM") {
    return (
      <span style={{ ...badgeStyle, background: "rgba(241, 196, 15, 0.15)", color: "#f1c40f", border: "1px solid rgba(241, 196, 15, 0.3)" }}>
        PREMIUM
      </span>
    );
  }
  if (subscription === "PLUS") {
    return (
      <span style={{ ...badgeStyle, background: "rgba(37, 99, 235, 0.15)", color: "#60a5fa", border: "1px solid rgba(37, 99, 235, 0.3)" }}>
        PLUS
      </span>
    );
  }
  return null;
};

export default function CommentsSection({ chapterId, currentUser }: { chapterId: string; currentUser: string }) {
  const [commentSort, setCommentSort] = useState<"best" | "newest" | "oldest">("best");
  const [newCommentText, setNewCommentText] = useState("");
  const [isVerified, setIsVerified] = useState(true);
  const [hasAgreedToRules, setHasAgreedToRules] = useState(false);
  const [showRulesNotice, setShowRulesNotice] = useState(false);
  const [showWebRulesModal, setShowWebRulesModal] = useState(false);
  const [shakeRulesBanner, setShakeRulesBanner] = useState(false);
  const [activeAccordionIndex, setActiveAccordionIndex] = useState<number | null>(null);

  const { data: dbComments, refetch: refetchComments } = trpc.chapter.getComments.useQuery(
    { chapterId: chapterId },
    { enabled: !!chapterId }
  );

  const utils = trpc.useContext();
  const postCommentMutation = trpc.chapter.postComment.useMutation({
    onMutate: async (newComment) => {
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
            createdAt: new Date().toISOString() as any,
            updatedAt: new Date().toISOString() as any,
            user: { id: currentUser, username: currentUser, role: "USER", subscription: "NONE", avatarUrl: null, createdAt: new Date().toISOString() as any, updatedAt: new Date().toISOString() as any } as any
          },
          ...previousComments,
        ]);
      }
      return { previousComments };
    },
    onError: (err, newComment, context) => {
      if (context?.previousComments) {
        utils.chapter.getComments.setData({ chapterId }, context.previousComments);
      }
    },
    onSettled: () => {
      utils.chapter.getComments.invalidate({ chapterId });
    },
    onSuccess: () => {
      setNewCommentText("");
    },
  });

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    if (!hasAgreedToRules) {
      setShowRulesNotice(true);
      setShakeRulesBanner(true);
      setTimeout(() => setShakeRulesBanner(false), 500);
      return;
    }

    postCommentMutation.mutate({
      chapterId: chapterId,
      content: newCommentText.trim()
    });
  };

  const commentsFeed = dbComments && dbComments.length > 0 ? dbComments.map(c => ({
    id: c.id,
    author: c.user?.username || "Unknown User",
    avatar: (c.user?.username || "U")[0].toUpperCase(),
    text: c.content,
    likes: Math.floor(Math.random() * 500),
    dislikes: 0,
    timeAgo: "Just now",
    role: c.user?.role || "USER",
    subscription: c.user?.subscription || "NONE",
    showReplies: false,
    replies: []
  })) : [];

  const handleSimulateVerification = () => {
    setIsVerified(true);
    alert("Email verification simulated!");
  };

  return (
    <div style={{ width: "100%", maxWidth: "800px", display: "flex", flexDirection: "column", gap: "1.5rem", textAlign: "left" }}>
      
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0 }}>
          Detailed Feed
        </h3>
        
        <div style={{ display: "flex", background: "var(--panel-color)", border: "1px solid var(--border-color)", padding: "3px", borderRadius: "20px", gap: "2px" }}>
          {[
            { id: "best", label: "Best" },
            { id: "newest", label: "Newest" },
            { id: "oldest", label: "Oldest" }
          ].map(sort => (
            <button
              key={sort.id}
              onClick={() => setCommentSort(sort.id as any)}
              style={{
                background: commentSort === sort.id ? "rgba(37,99,235,0.12)" : "transparent",
                border: "none",
                color: commentSort === sort.id ? "#2563eb" : "var(--text-muted-color)",
                padding: "6px 14px",
                borderRadius: "15px",
                fontSize: "0.8rem",
                fontWeight: 650,
                cursor: "pointer"
              }}
            >
              {sort.label}
            </button>
          ))}
        </div>
      </div>

      {/* Side-by-Side Flex Layout Container */}
      <div style={{ display: "flex", flexDirection: "row", gap: "1.5rem", width: "100%", flexWrap: "wrap", alignItems: "flex-start" }}>
        
        {/* Left Side: Banners & Comment Form */}
        <div style={{ flex: "1 1 450px", minWidth: "280px", display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Banners */}
          {!isVerified && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(124, 58, 237, 0.08)", border: "1px solid rgba(124, 58, 237, 0.2)", padding: "1rem 1.25rem", borderRadius: "12px" }}>
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(124, 58, 237, 0.15)", display: "flex", justifyContent: "center", alignItems: "center", color: "#8b5cf6" }}>
                    <Sparkles size={16} style={{ fill: "#8b5cf6" }} />
                  </div>
                  <div>
                    <strong style={{ display: "block", fontSize: "0.9rem" }}>You must verify your email to use tokens.</strong>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted-color)" }}>Verify your email to claim daily tokens and unlock chapters.</span>
                  </div>
                </div>
                <button onClick={handleSimulateVerification} style={{ background: "transparent", border: "1px solid rgba(124, 58, 237, 0.4)", color: "#8b5cf6", padding: "8px 16px", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}>
                  Verify Email
                </button>
              </div>
            </div>
          )}

          {/* Comment Area Box */}
          <form onSubmit={handlePostComment} className="glass-panel" style={{ padding: "1.25rem", background: "var(--panel-color)", border: "1px solid var(--border-color)", borderRadius: "12px", display: "flex", flexDirection: "column", gap: "1rem", position: "relative" }}>
            
            <textarea 
              placeholder="Write a comment..."
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              maxLength={2000}
              style={{ width: "100%", background: "transparent", border: "none", outline: "none", resize: "none", minHeight: "60px", fontSize: "0.9rem", boxSizing: "border-box" }}
            />
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-color)", paddingTop: "10px" }}>
              <div style={{ display: "flex", gap: "12px", color: "var(--text-muted-color)" }}>
                <span style={{ fontWeight: 800, cursor: "pointer" }} className="hover:text-white">B</span>
                <span style={{ fontStyle: "italic", cursor: "pointer" }} className="hover:text-white">I</span>
                <span style={{ textDecoration: "line-through", cursor: "pointer" }} className="hover:text-white">S</span>
              </div>
              
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted-color)" }}>
                  {newCommentText.length}/2000
                </span>
                <button 
                  type="submit" 
                  disabled={!newCommentText.trim()}
                  style={{ 
                    background: newCommentText.trim() ? "#8b5cf6" : "rgba(139, 92, 246, 0.2)", 
                    color: newCommentText.trim() ? "#fff" : "rgba(255,255,255,0.25)", 
                    border: "none", 
                    padding: "8px 20px", 
                    borderRadius: "8px", 
                    fontWeight: 700, 
                    cursor: newCommentText.trim() ? "pointer" : "not-allowed" 
                  }}
                >
                  Post
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Comments List Feed */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", marginTop: "1rem" }}>
        {commentsFeed.map((c) => (
          <div key={c.id} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            
            {/* Single Comment */}
            <div style={{ display: "flex", gap: "12px" }}>
              <div style={{ 
                width: "36px", 
                height: "36px", 
                borderRadius: "50%", 
                background: "#2563eb", 
                color: "#fff", 
                display: "flex", 
                justifyContent: "center", 
                alignItems: "center", 
                fontWeight: 700, 
                fontSize: "0.95rem",
                flexShrink: 0
              }}>
                {c.avatar}
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontWeight: 750, fontSize: "0.9rem" }}>{c.author}</span>
                  <TierBadge role={c.role} subscription={c.subscription} />
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted-color)" }}>{c.timeAgo}</span>
                </div>
                
                <p style={{ margin: 0, fontSize: "0.9rem", lineHeight: 1.4 }}>{c.text}</p>
                
                <div style={{ display: "flex", gap: "16px", color: "var(--text-muted-color)", fontSize: "0.75rem", alignItems: "center", marginTop: "4px" }}>
                  <button style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }} className="hover:text-white transition">
                    <ThumbsUp size={12} /> {c.likes}
                  </button>
                  <button style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }} className="hover:text-white transition">
                    <ThumbsDown size={12} /> {c.dislikes}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
