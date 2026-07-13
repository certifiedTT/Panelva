"use client";

import { useState } from "react";
import { SendIcon, SuccessIcon } from "@/components/StateIcons";

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
  const initialComments: Comment[] = [
    { id: "1", user: "AdminDave", role: "Admin", priority: 4, text: "Welcome to Panelva community boards! Please be respectful of others.", timestamp: "2 hours ago", avatarColor: "#e74c3c" },
    { id: "2", user: "PixelArtist", role: "Creator", priority: 3, text: "Chapter 10 draft is completed! Uploading to the studio later today.", timestamp: "1 hour ago", avatarColor: "#0ea5e9" },
    { id: "3", user: "PremiumGamer", role: "Premium", priority: 2, text: "Loving the new updates! The timer on subscription chapters is very clear.", timestamp: "45 mins ago", avatarColor: "#f1c40f" },
    { id: "4", user: "PlusReader", role: "Plus", priority: 1, text: "Panelva Plus is a steal at $1.99. No ads is so nice.", timestamp: "30 mins ago", avatarColor: "#3498db" },
    { id: "5", user: "CasualNovice", role: "User", priority: 0, text: "Hey guys! Can anyone recommend a sci-fi light novel?", timestamp: "5 mins ago", avatarColor: "#7f8c8d" }
  ];

  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newCommentText, setNewCommentText] = useState("");
  const [selectedRole, setSelectedRole] = useState<"Admin" | "Creator" | "Premium" | "Plus" | "User">("User");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Sort by priority (descending) so highest priority is pinned to the top
  const sortedComments = [...comments].sort((a, b) => b.priority - a.priority);

  const rolePriorityMap = {
    Admin: 4,
    Creator: 3,
    Premium: 2,
    Plus: 1,
    User: 0
  };

  const roleColorMap = {
    Admin: "#e74c3c",
    Creator: "#0ea5e9",
    Premium: "#f1c40f",
    Plus: "#3498db",
    User: "#7f8c8d"
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || isSubmitting) return;

    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);

      const newComment: Comment = {
        id: Date.now().toString(),
        user: selectedRole === "User" ? "MockUser" : `Mock${selectedRole}`,
        role: selectedRole,
        priority: rolePriorityMap[selectedRole],
        text: newCommentText,
        timestamp: "Just now",
        avatarColor: roleColorMap[selectedRole]
      };

      setComments((prev) => [newComment, ...prev]);
      setNewCommentText("");

      setTimeout(() => {
        setIsSuccess(false);
      }, 2000);
    }, 800);
  };

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
          
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--text-dark-muted)" }}>Post as role:</span>
            <select 
              value={selectedRole} 
              onChange={(e) => setSelectedRole(e.target.value as any)}
              style={{ background: "#111216", border: "1px solid var(--dark-border)", color: "#fff", padding: "6px 12px", borderRadius: "6px", fontSize: "0.85rem" }}
            >
              <option value="User">Normal User (Priority 0)</option>
              <option value="Plus">Panelva Plus Member (Priority 1)</option>
              <option value="Premium">Panelva Premium Member (Priority 2)</option>
              <option value="Creator">Creator (Priority 3)</option>
              <option value="Admin">Administrator (Priority 4)</option>
            </select>
          </div>

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
        </div>
      </div>
    </div>
  );
}
