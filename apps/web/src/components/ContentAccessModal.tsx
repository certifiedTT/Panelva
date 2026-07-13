import React, { useState } from "react";
import { X, Crown, Check, Tv, Sparkles, Download, ArrowRight, ShieldCheck } from "lucide-react";

export interface Plan {
  id: "PLUS" | "PREMIUM";
  name: string;
  price: string;
  period: string;
  features: { title: string; subtitle: string }[];
  highlightColor: string;
  badgeBg: string;
}

interface ContentAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  accessType: "AD_SUPPORTED" | "PREMIUM";
  seriesTitle: string;
  chapterTitle: string;
  onUnlockWithAds?: () => void;
  onUpgradeSubscription: (tier: "PLUS" | "PREMIUM") => void;
  plans?: Plan[];
}

const DEFAULT_PLANS: Plan[] = [
  {
    id: "PLUS",
    name: "Panelva Plus",
    price: "$4.99",
    period: "/ month",
    highlightColor: "#a78bfa",
    badgeBg: "rgba(167, 139, 250, 0.15)",
    features: [
      { title: "6-hour early access on new chapters", subtitle: "Read fresh releases before everyone else" },
      { title: "Basic offline downloads", subtitle: "Save up to 10 chapters encrypting at rest" },
      { title: "No banner ads", subtitle: "Enjoy a cleaner reading interface" }
    ]
  },
  {
    id: "PREMIUM",
    name: "Panelva Premium",
    price: "$9.99",
    period: "/ month",
    highlightColor: "#fbbf24",
    badgeBg: "rgba(251, 191, 36, 0.15)",
    features: [
      { title: "Instant early access to all content", subtitle: "No wait times or schedules on early chapters" },
      { title: "Unlimited offline downloads", subtitle: "AES-256 secure encrypted caching" },
      { title: "No ads, animated PFP & badges", subtitle: "Plus the rest of the Premium perks" }
    ]
  }
];

export const ContentAccessModal: React.FC<ContentAccessModalProps> = ({
  isOpen,
  onClose,
  accessType,
  seriesTitle,
  chapterTitle,
  onUnlockWithAds,
  onUpgradeSubscription,
  plans = DEFAULT_PLANS
}) => {
  const [selectedPlanId, setSelectedPlanId] = useState<"PLUS" | "PREMIUM">("PREMIUM");

  if (!isOpen) return null;

  const currentPlan = plans.find((p) => p.id === selectedPlanId) || plans[1];

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(10, 10, 15, 0.85)",
      backdropFilter: "blur(8px)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 10000,
      padding: "20px"
    }}>
      {/* Modal Container */}
      <div className="glass-panel" style={{
        background: "#12121a",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "16px",
        width: "100%",
        maxWidth: "460px",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.8)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        fontFamily: "var(--font-sans, system-ui, sans-serif)",
        color: "#ffffff"
      }}>
        
        {/* Header */}
        <div style={{
          padding: "1.25rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid rgba(255,255,255,0.06)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              backgroundColor: accessType === "PREMIUM" ? "rgba(251, 191, 36, 0.12)" : "rgba(52, 152, 219, 0.12)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              color: accessType === "PREMIUM" ? "#fbbf24" : "#3498db"
            }}>
              {accessType === "PREMIUM" ? <Crown size={20} /> : <Tv size={20} />}
            </div>
            <div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0, lineHeight: 1.2 }}>
                {accessType === "PREMIUM" ? "Premium only" : "Ad-supported unlock"}
              </h3>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted-color, #8e8e9f)" }}>
                {seriesTitle} &bull; {chapterTitle}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#8e8e9f",
              cursor: "pointer",
              padding: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "50%",
              transition: "background 0.2s"
            }}
            className="hover:bg-white/5"
          >
            <X size={18} />
          </button>
        </div>

        {/* Plan Segmented Toggle Control */}
        <div style={{
          padding: "1rem 1.25rem 0.5rem 1.25rem",
          display: "flex",
          flexDirection: "column",
          gap: "8px"
        }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#8e8e9f" }}>
            Subscription Tiers
          </span>
          <div style={{
            display: "flex",
            backgroundColor: "rgba(255,255,255,0.04)",
            padding: "4px",
            borderRadius: "10px",
            border: "1px solid rgba(255,255,255,0.04)"
          }}>
            {plans.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPlanId(p.id)}
                style={{
                  flex: 1,
                  padding: "8px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: selectedPlanId === p.id ? "rgba(108, 92, 231, 0.15)" : "transparent",
                  color: selectedPlanId === p.id ? "#c084fc" : "#8e8e9f",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Highlight Card (replicates gold card design) */}
        <div style={{ padding: "0.5rem 1.25rem" }}>
          <div style={{
            background: `linear-gradient(135deg, ${currentPlan.id === "PREMIUM" ? "rgba(251, 191, 36, 0.08)" : "rgba(167, 139, 250, 0.08)"}, rgba(18, 18, 26, 0.95))`,
            border: `1px solid ${currentPlan.id === "PREMIUM" ? "rgba(251, 191, 36, 0.25)" : "rgba(167, 139, 250, 0.25)"}`,
            borderRadius: "12px",
            padding: "1rem",
            display: "flex",
            gap: "12px",
            alignItems: "center"
          }}>
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              backgroundColor: currentPlan.id === "PREMIUM" ? "rgba(251, 191, 36, 0.15)" : "rgba(167, 139, 250, 0.15)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              color: currentPlan.highlightColor,
              flexShrink: 0
            }}>
              <Crown size={18} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                <strong style={{ color: currentPlan.highlightColor, fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                  {currentPlan.name}
                </strong>
                <span style={{ fontSize: "1rem", fontWeight: 800 }}>{currentPlan.price}</span>
                <span style={{ fontSize: "0.72rem", color: "#8e8e9f" }}>{currentPlan.period}</span>
              </div>
              <p style={{ margin: "2px 0 0 0", fontSize: "0.78rem", color: "#d1d1e0", lineHeight: "1.3" }}>
                Unlock premium chapters instantly and enjoy offline AES-256 secure downloads.
              </p>
            </div>
          </div>
        </div>

        {/* Feature List (Vertical stack) */}
        <div style={{
          padding: "0.75rem 1.25rem 1.25rem 1.25rem",
          display: "flex",
          flexDirection: "column",
          gap: "10px"
        }}>
          {currentPlan.features.map((feature, idx) => (
            <div key={idx} style={{
              display: "flex",
              gap: "12px",
              alignItems: "flex-start",
              backgroundColor: "rgba(255, 255, 255, 0.02)",
              border: "1px solid rgba(255, 255, 255, 0.04)",
              borderRadius: "8px",
              padding: "10px 12px"
            }}>
              <div style={{
                color: currentPlan.highlightColor,
                marginTop: "2px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <Check size={14} strokeWidth={3} />
              </div>
              <div>
                <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#f3f4f6" }}>
                  {feature.title}
                </div>
                <div style={{ fontSize: "0.72rem", color: "#8e8e9f", marginTop: "1px" }}>
                  {feature.subtitle}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Actions Footer */}
        <div style={{
          padding: "1rem 1.25rem",
          backgroundColor: "rgba(0,0,0,0.2)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          gap: "12px"
        }}>
          {accessType === "AD_SUPPORTED" ? (
            <>
              {/* Ad Supported State Buttons */}
              <button
                onClick={onUnlockWithAds}
                style={{
                  flex: 1,
                  background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                  color: "#ffffff",
                  border: "none",
                  padding: "12px",
                  borderRadius: "8px",
                  fontWeight: 750,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(124, 58, 237, 0.25)"
                }}
              >
                🎬 Unlock with Ads
              </button>
              <button
                onClick={() => onUpgradeSubscription(selectedPlanId)}
                style={{
                  flex: 1,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#ffffff",
                  padding: "12px",
                  borderRadius: "8px",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  cursor: "pointer"
                }}
              >
                👑 Go Premium
              </button>
            </>
          ) : (
            <>
              {/* Premium Only State Buttons */}
              <button
                onClick={onClose}
                style={{
                  flex: 1,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#ffffff",
                  padding: "12px",
                  borderRadius: "8px",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  cursor: "pointer"
                }}
              >
                Not Now
              </button>
              <button
                onClick={() => onUpgradeSubscription(selectedPlanId)}
                style={{
                  flex: 1,
                  background: `linear-gradient(135deg, ${currentPlan.id === "PREMIUM" ? "#fbbf24, #d97706" : "#a78bfa, #7c3aed"})`,
                  color: currentPlan.id === "PREMIUM" ? "#000000" : "#ffffff",
                  border: "none",
                  padding: "12px",
                  borderRadius: "8px",
                  fontWeight: 800,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  boxShadow: `0 4px 14px ${currentPlan.id === "PREMIUM" ? "rgba(251, 191, 36, 0.3)" : "rgba(167, 139, 250, 0.3)"}`
                }}
              >
                Upgrade to {selectedPlanId === "PREMIUM" ? "Premium" : "Plus"}
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
};
