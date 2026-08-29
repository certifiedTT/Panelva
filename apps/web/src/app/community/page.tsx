"use client";

import { useState, useMemo } from "react";
import { SendIcon, SuccessIcon } from "@/components/StateIcons";
import { trpc } from "../../lib/trpc";
import { useAuth } from "../../components/AuthContext";

interface Comment {
  id: string;
  user: string;
  role: "Admin" | "Creator" | "Premium" | "Plus" | "User";
  priority: number;
  text: string;
  timestamp: string;
  avatarColor: string;
}

export default function CommunityPage() {
  const { user } = useAuth();
  const [newCommentText, setNewCommentText] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const { data: dbComments, refetch: refetchComments, isLoading } = trpc.chapter.getCommunityComments.useQuery();

  const postCommentMutation = trpc.chapter.postCommunityComment.useMutation({
    onSuccess: () => {
      refetchComments();
      setNewCommentText("");
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 2000);
    },
    onError: (err: any) => {
      alert(err.message || "Failed to post comment");
    }
  });

  const roleColorMap = {
    Admin: "#e74c3c",
    Creator: "#0ea5e9",
    Premium: "#f1c40f",
    Plus: "#3498db",
    User: "#7f8c8d"
  };

  const getDisplayRole = (role: string) => {
    if (role === "MASTER_ADMIN" || role === "ADMIN") return "Admin";
    if (role === "CREATOR" || role === "VERIFIED_CREATOR") return "Creator";
    if (role === "PREMIUM") return "Premium";
    if (role === "PLUS") return "Plus";
    return "User";
  };

  const comments = useMemo(() => {
    return (dbComments || []).map((c: any) => {
      const displayRole = getDisplayRole(c.role);
      return {
        id: c.id,
        user: c.user,
        role: displayRole as any,
        priority: c.priority,
        text: c.text,
        timestamp: c.timestamp,
        avatarColor: roleColorMap[displayRole as keyof typeof roleColorMap] || "#7f8c8d",
      };
    });
  }, [dbComments]);

  // Sort by priority (descending) so highest priority is pinned to the top
  const sortedComments = [...comments].sort((a, b) => b.priority - a.priority);

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Please log in first to join the discussion.");
      return;
    }
    if (!newCommentText.trim()) return;
    postCommentMutation.mutate({ content: newCommentText.trim() });
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "var(--dark-bg)", color: "var(--text-dark)", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <p style={{ color: "var(--text-dark-muted)" }}>Loading discussion...</p>
      </div>
    );
  }

  const isSubmitting = postCommentMutation.isLoading;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--dark-bg)", color: "var(--text-dark)", padding: "4rem 2rem", fontFamily: "var(--font-sans)" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "3rem", fontWeight: 800, marginBottom: "0.5rem" }}>
          Community <span style={{ color: "var(--secondary)" }}>Feed</span>
        </h1>
        <p style={{ color: "var(--text-dark-muted)", fontSize: "1.1rem", marginBottom: "3rem" }}>
          See pinned announcements and talk about your favorite titles. Comments are sorted by Priority Rank.
        </p>

        {/* Post comment box */}
        <form onSubmit={handlePostComment} className="glass-panel" style={{ padding: "1.5rem", marginBottom: "2rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Add to the discussion</h3>
          
          <textarea
            placeholder="Write a comment..."
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            rows={3}
            style={{ width: "100%", background: "#111216", border: "1px solid var(--dark-border)", padding: "12px", borderRadius: "8px", color: "#fff", fontSize: "0.9rem", resize: "none", boxSizing: "border-box" }}
          />

          <button 
            type="submit" 
            disabled={isSubmitting || !newCommentText.trim()}
            style={{ 
              alignSelf: "flex-end", 
              background: "var(--gradient-main)", 
              border: "none", 
              color: "#fff", 
              padding: "10px 24px", 
              borderRadius: "20px", 
              fontWeight: 700, 
              cursor: isSubmitting || !newCommentText.trim() ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              minWidth: "150px",
              justifyContent: "center",
              opacity: !newCommentText.trim() ? 0.6 : 1,
              transition: "all 0.2s"
            }}
          >
            {isSuccess ? (
              <>
                <SuccessIcon size={16} color="#fff" activeState={true} />
                <span>Posted!</span>
              </>
            ) : isSubmitting ? (
              <>
                <SendIcon size={16} color="#fff" activeState={true} />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <SendIcon size={16} color="#fff" activeState={false} />
                <span>Post Comment</span>
              </>
            )}
          </button>
        </form>

        {/* Comments stream */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {sortedComments.map((comment) => (
            <div key={comment.id} className="glass-panel" style={{ padding: "1.5rem", borderLeft: `4px solid ${comment.avatarColor}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: comment.avatarColor, display: "flex", justifyContent: "center", alignItems: "center", fontSize: "0.75rem", fontWeight: "bold", color: "#fff" }}>
                    {comment.user.substring(0, 2).toUpperCase()}
                  </div>
                  <strong style={{ fontSize: "0.95rem" }}>{comment.user}</strong>
                  <span style={{ 
                    fontSize: "0.7rem", 
                    backgroundColor: comment.role === "Admin" ? "rgba(231, 76, 60, 0.15)" : comment.role === "Creator" ? "rgba(14, 165, 233, 0.15)" : comment.role === "Premium" ? "rgba(241, 196, 15, 0.15)" : comment.role === "Plus" ? "rgba(52, 152, 219, 0.15)" : "transparent",
                    color: comment.avatarColor,
                    padding: "2px 8px",
                    borderRadius: "10px",
                    fontWeight: 700
                  }}>
                    {comment.role} (Rank {comment.priority})
                  </span>
                </div>
                <span style={{ fontSize: "0.8rem", color: "var(--text-dark-muted)" }}>{comment.timestamp}</span>
              </div>
              <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--text-dark)", lineHeight: 1.4 }}>{comment.text}</p>
            </div>
          ))}
          {sortedComments.length === 0 && (
            <div style={{ textAlign: "center", padding: "3rem", border: "1px dashed var(--dark-border)", borderRadius: "12px", color: "var(--text-dark-muted)" }}>
              No comments posted yet. Be the first to start the conversation!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
