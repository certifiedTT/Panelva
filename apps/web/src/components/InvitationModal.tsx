"use client";

import React from "react";
import { trpc } from "../lib/trpc";
import { X, Calendar, MessageSquare, ShieldAlert, Check, AlertCircle } from "lucide-react";

interface InvitationModalProps {
  invitation: {
    id: string;
    seriesId: string;
    receiverId: string;
    role: string;
    roleDescription?: string | null;
    shareRatio: number;
    message?: string | null;
    terms?: string | null;
    createdAt: string | Date;
    series: {
      title: string;
      coverUrl: string;
      description: string;
      genre: string;
      creator: {
        penName: string;
        user: {
          avatarUrl?: string | null;
          username: string;
        };
      };
    };
    sender: {
      username: string;
      avatarUrl?: string | null;
    };
  };
  onClose: () => void;
  onResponse: (response: "ACCEPT" | "DECLINE") => void;
}

export function InvitationModal({ invitation, onClose, onResponse }: InvitationModalProps) {
  // Query other collaborations to show the breakdown
  const { data: collabData, isLoading } = trpc.collaboration.getSeriesCollaborations.useQuery(
    { seriesId: invitation.seriesId },
    { enabled: !!invitation.seriesId }
  );

  const formattedDate = new Date(invitation.createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Calculate proposed splits preview
  const splitsPreview = React.useMemo(() => {
    if (!collabData) return [];

    // Find the primary creator's collaboration entry
    const activeOthers = collabData.activeCollaborators.filter(
      (c) => c.user.id !== invitation.sender.username // sender username is actually primary user username or id
    );

    const activeOtherTotal = activeOthers.reduce((acc, c) => acc + c.shareRatio, 0);
    const newPrimaryShare = 100 - (activeOtherTotal + invitation.shareRatio);

    const list = [
      {
        name: invitation.series.creator.penName,
        role: "Primary Creator",
        ratio: newPrimaryShare,
        isYou: false,
        isActive: true,
      },
      {
        name: "You",
        role: invitation.role,
        ratio: invitation.shareRatio,
        isYou: true,
        isActive: false, // Currently pending
      },
    ];

    // Add other active co-creators
    collabData.activeCollaborators.forEach((c) => {
      const isPrimary = c.role === "PrimaryCreator" || c.user.username === invitation.series.creator.user.username;
      if (!isPrimary) {
        list.push({
          name: c.user.creatorProfiles[0]?.penName || c.user.username,
          role: c.role || "Contributor",
          ratio: c.shareRatio,
          isYou: c.user.id === invitation.receiverId, // Wait, invitation receiver
          isActive: true,
        });
      }
    });

    return list;
  }, [collabData, invitation]);

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      backgroundColor: "rgba(3, 4, 6, 0.85)",
      backdropFilter: "blur(8px)",
      zIndex: 100,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "1.5rem",
      overflowY: "auto",
    }}>
      <div style={{
        backgroundColor: "#0d0e12",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "20px",
        width: "100%",
        maxWidth: "680px",
        maxHeight: "90vh",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 20px 40px rgba(0, 0, 0, 0.8)",
        overflow: "hidden",
      }}>
        {/* Modal Header */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1.25rem 1.5rem",
          borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
        }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#fff", margin: 0 }}>
            Collaboration Invitation
          </h2>
          <button 
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#a1a1aa",
              cursor: "pointer",
              padding: "4px",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Content - Scrollable */}
        <div style={{
          padding: "1.5rem",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
        }}>
          {/* Series Intro Grid */}
          <div style={{ display: "flex", gap: "1.25rem" }} className="flex-col sm:flex-row">
            <img 
              src={invitation.series.coverUrl} 
              alt={invitation.series.title}
              style={{
                width: "100px",
                height: "140px",
                borderRadius: "10px",
                objectFit: "cover",
                border: "1px solid rgba(255,255,255,0.1)",
                flexShrink: 0,
              }}
            />
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <span style={{
                  fontSize: "0.65rem",
                  background: "rgba(37, 99, 235, 0.15)",
                  color: "#3b82f6",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}>
                  {invitation.series.genre}
                </span>
                <h3 style={{ fontSize: "1.4rem", fontWeight: 850, color: "#fff", margin: "6px 0" }}>
                  {invitation.series.title}
                </h3>
                <p style={{
                  fontSize: "0.85rem",
                  color: "#a1a1aa",
                  margin: 0,
                  lineHeight: 1.5,
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}>
                  {invitation.series.description}
                </p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "10px" }}>
                <span style={{ fontSize: "0.75rem", color: "#71717a" }}>Initiator:</span>
                <span style={{ fontSize: "0.8rem", color: "#fff", fontWeight: 600 }}>
                  @{invitation.series.creator.penName}
                </span>
              </div>
            </div>
          </div>

          <hr style={{ border: 0, borderTop: "1px solid rgba(255,255,255,0.05)", margin: 0 }} />

          {/* Invitation Details Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }} className="grid-cols-1 sm:grid-cols-2">
            <div>
              <span style={{ fontSize: "0.75rem", color: "#71717a", fontWeight: 600, textTransform: "uppercase" }}>Proposed Role</span>
              <div style={{ fontSize: "1.1rem", fontWeight: 750, color: "#3b82f6", marginTop: "4px" }}>
                {invitation.role}
              </div>
              {invitation.roleDescription && (
                <p style={{ fontSize: "0.8rem", color: "#a1a1aa", marginTop: "4px", lineHeight: 1.4 }}>
                  {invitation.roleDescription}
                </p>
              )}
            </div>

            <div>
              <span style={{ fontSize: "0.75rem", color: "#71717a", fontWeight: 600, textTransform: "uppercase" }}>Revenue Split Share</span>
              <div style={{ fontSize: "1.1rem", fontWeight: 750, color: "#10b981", marginTop: "4px" }}>
                {invitation.shareRatio}% Revenue Share
              </div>
              <span style={{ fontSize: "0.75rem", color: "#71717a", display: "block", marginTop: "4px" }}>
                Active upon acceptance
              </span>
            </div>
          </div>

          {/* Splits Breakdown Preview */}
          <div style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.04)",
            borderRadius: "12px",
            padding: "1rem 1.25rem",
          }}>
            <h4 style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", color: "#e4e4e7", margin: "0 0 10px 0" }}>
              Proposed Revenue splits breakdown
            </h4>
            {isLoading ? (
              <div style={{ fontSize: "0.8rem", color: "#71717a" }}>Loading distribution info...</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {splitsPreview.map((item, idx) => (
                  <div 
                    key={idx} 
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: "0.85rem",
                      padding: "4px 0",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ 
                        color: item.isYou ? "#10b981" : "#fff", 
                        fontWeight: item.isYou ? 700 : 500 
                      }}>
                        {item.name} {item.isYou && "(You)"}
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "#71717a" }}>• {item.role}</span>
                      {!item.isActive && (
                        <span style={{
                          fontSize: "0.6rem",
                          background: "rgba(245,158,11,0.15)",
                          color: "#f59e0b",
                          padding: "1px 4px",
                          borderRadius: "4px",
                          fontWeight: 600,
                        }}>
                          Pending
                        </span>
                      )}
                    </div>
                    <strong style={{ color: item.isYou ? "#10b981" : "#fff" }}>
                      {item.ratio.toFixed(1)}%
                    </strong>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Optional Message */}
          {invitation.message && (
            <div style={{ display: "flex", gap: "10px", background: "rgba(37,99,235,0.03)", border: "1px solid rgba(37,99,235,0.1)", borderRadius: "10px", padding: "1rem" }}>
              <MessageSquare size={18} color="#3b82f6" style={{ flexShrink: 0, marginTop: "2px" }} />
              <div>
                <strong style={{ display: "block", fontSize: "0.8rem", color: "#fff", marginBottom: "4px" }}>
                  Message from @{invitation.sender.username}
                </strong>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "#d1d5db", lineHeight: 1.5 }}>
                  "{invitation.message}"
                </p>
              </div>
            </div>
          )}

          {/* Terms and Conditions */}
          {invitation.terms && (
            <div style={{ display: "flex", gap: "10px", background: "rgba(245,158,11,0.03)", border: "1px solid rgba(245,158,11,0.1)", borderRadius: "10px", padding: "1rem" }}>
              <ShieldAlert size={18} color="#f59e0b" style={{ flexShrink: 0, marginTop: "2px" }} />
              <div>
                <strong style={{ display: "block", fontSize: "0.8rem", color: "#fff", marginBottom: "4px" }}>
                  Additional Terms & Conditions
                </strong>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "#d1d5db", lineHeight: 1.5 }}>
                  {invitation.terms}
                </p>
              </div>
            </div>
          )}

          {/* Invitation Date */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.75rem", color: "#71717a" }}>
            <Calendar size={14} />
            <span>Invited on {formattedDate}</span>
          </div>
        </div>

        {/* Modal Actions */}
        <div style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "12px",
          padding: "1.25rem 1.5rem",
          backgroundColor: "#08090c",
          borderTop: "1px solid rgba(255, 255, 255, 0.05)",
        }}>
          <button
            onClick={() => onResponse("DECLINE")}
            style={{
              background: "none",
              border: "1px solid rgba(239, 68, 68, 0.4)",
              color: "#ef4444",
              padding: "10px 20px",
              borderRadius: "10px",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "background-color 0.2s",
            }}
            className="hover:bg-red-500/10"
          >
            Decline Invitation
          </button>
          <button
            onClick={() => onResponse("ACCEPT")}
            style={{
              background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
              border: "none",
              color: "#fff",
              padding: "10px 24px",
              borderRadius: "10px",
              fontSize: "0.85rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "transform 0.2s",
            }}
            className="hover:scale-102"
          >
            <Check size={16} /> Accept & Join Project
          </button>
        </div>
      </div>
    </div>
  );
}
