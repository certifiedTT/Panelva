import React, { useState } from "react";
import { X, Crown, Check, Tv } from "lucide-react";
import { Button, Badge } from "@panelva/ui";

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
    highlightColor: "#3b82f6",
    badgeBg: "rgba(59, 130, 246, 0.15)",
    features: [
      { title: "Early access 2 hours after Premium", subtitle: "Read newly published releases 2 hours after Premium subscribers" },
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
      { title: "Instant early access to all new content", subtitle: "Immediate 0-hour access to all new series and chapters upon release" },
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
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[10000]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="access-modal-title"
    >
      {/* Modal Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-[460px] flex flex-col overflow-hidden text-white">
        
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              accessType === "PREMIUM" ? "bg-amber-500/10 text-amber-400" : "bg-blue-500/10 text-blue-400"
            }`}>
              {accessType === "PREMIUM" ? <Crown size={20} /> : <Tv size={20} />}
            </div>
            <div>
              <h3 id="access-modal-title" className="text-base font-bold leading-tight">
                {accessType === "PREMIUM" ? "Premium only" : "Ad-supported unlock"}
              </h3>
              <span className="text-xs text-slate-400">
                {seriesTitle} &bull; {chapterTitle}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Plan Segmented Toggle Control */}
        <div className="p-4 pb-2 flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Subscription Tiers
          </span>
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            {plans.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPlanId(p.id)}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${
                  selectedPlanId === p.id 
                    ? "bg-blue-600/20 text-blue-400 border border-blue-500/30" 
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Highlight Card */}
        <div className="px-4 py-2">
          <div className={`p-4 rounded-xl border flex items-center gap-3 ${
            currentPlan.id === "PREMIUM" 
              ? "bg-amber-500/10 border-amber-500/30" 
              : "bg-blue-500/10 border-blue-500/30"
          }`}>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
              currentPlan.id === "PREMIUM" ? "bg-amber-500/20 text-amber-400" : "bg-blue-500/20 text-blue-400"
            }`}>
              <Crown size={18} />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <strong className={`text-sm font-bold uppercase tracking-wider ${
                  currentPlan.id === "PREMIUM" ? "text-amber-400" : "text-blue-400"
                }`}>
                  {currentPlan.name}
                </strong>
                <span className="text-base font-extrabold">{currentPlan.price}</span>
                <span className="text-xs text-slate-400">{currentPlan.period}</span>
              </div>
              <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                Unlock premium chapters instantly and enjoy offline AES-256 secure downloads.
              </p>
            </div>
          </div>
        </div>

        {/* Feature List (Vertical stack) */}
        <div className="p-4 flex flex-col gap-2">
          {currentPlan.features.map((feature, idx) => (
            <div 
              key={idx} 
              className="flex items-start gap-3 bg-slate-950/60 border border-slate-800/80 rounded-xl p-3"
            >
              <div className={`mt-0.5 shrink-0 ${currentPlan.id === "PREMIUM" ? "text-amber-400" : "text-blue-400"}`}>
                <Check size={14} strokeWidth={3} />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-100">
                  {feature.title}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {feature.subtitle}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Actions Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center gap-3">
          {accessType === "AD_SUPPORTED" ? (
            <>
              <Button
                variant="secondary"
                size="md"
                className="flex-1"
                onClick={onUnlockWithAds}
                leftIcon={<Tv className="w-4 h-4" />}
              >
                Unlock with Ads
              </Button>
              <Button
                variant="primary"
                size="md"
                className="flex-1"
                onClick={() => onUpgradeSubscription(selectedPlanId)}
                leftIcon={<Crown className="w-4 h-4" />}
              >
                Go Premium
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="md"
                className="flex-1"
                onClick={onClose}
              >
                Not Now
              </Button>
              <Button
                variant="primary"
                size="md"
                className="flex-1"
                onClick={() => onUpgradeSubscription(selectedPlanId)}
                leftIcon={<Crown className="w-4 h-4" />}
              >
                Upgrade to {selectedPlanId === "PREMIUM" ? "Premium" : "Plus"}
              </Button>
            </>
          )}
        </div>

      </div>
    </div>
  );
};
