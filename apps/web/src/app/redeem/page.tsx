"use client";

import React, { useState } from "react";
import { Ticket, ShieldCheck, History, Info } from "lucide-react";

export default function RedeemPage() {
  const [code, setCode] = useState("");
  const [log, setLog] = useState<string[]>([]);
  const [currentUserStatus, setCurrentUserStatus] = useState({
    tier: "Free Member",
    isPromotional: false,
    viewEarningContributed: true
  });

  const handleRedeem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    const codeUpper = code.trim().toUpperCase();
    let message = "";
    let updatedStatus = { ...currentUserStatus };

    if (codeUpper.startsWith("PROMO")) {
      updatedStatus = {
        tier: codeUpper.includes("PREMIUM") ? "Panelva Premium (Promo)" : "Panelva Plus (Promo)",
        isPromotional: true,
        viewEarningContributed: false
      };
      message = `Success! Activated promotional code "${codeUpper}". Promotional accounts exclude creator view payout cuts.`;
    } else if (codeUpper.startsWith("PAID") || codeUpper.startsWith("GIFT")) {
      updatedStatus = {
        tier: codeUpper.includes("PREMIUM") ? "Panelva Premium (Paid)" : "Panelva Plus (Paid)",
        isPromotional: false,
        viewEarningContributed: true
      };
      message = `Success! Activated paid subscription code "${codeUpper}". Regular subscriber view analytics enabled.`;
    } else {
      message = `Error: Code "${codeUpper}" is invalid. Try "PROMO-PREMIUM" or "PAID-PREMIUM".`;
    }

    if (!message.startsWith("Error")) {
      setCurrentUserStatus(updatedStatus);
    }
    setLog((prev) => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev]);
    setCode("");
  };

  return (
    <main className="min-h-screen bg-[#0b0c10] pt-24 pb-12 text-white">
      <div className="mx-auto max-w-4xl px-6">
        
        {/* Header Section */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Redeem <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Promo Code</span>
          </h1>
          <p className="mt-3 text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
            Enter your 16-character code below to instantly activate your Panelva Plus or Premium subscription.
          </p>
        </div>

        {/* Main Split Grid */}
        <div className="grid gap-6 md:grid-cols-2 items-stretch">
          
          {/* Action Card: Activate Subscription */}
          <div className="flex flex-col rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-6 backdrop-blur-sm">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Ticket size={18} />
              </div>
              <h2 className="text-sm font-bold tracking-wide uppercase text-zinc-300">Activate Subscription</h2>
            </div>
            
            <form onSubmit={handleRedeem} className="space-y-4 flex-1 flex flex-col justify-center">
              <div>
                <input 
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g., PANELVA-PLUS-2026" 
                  className="w-full rounded-xl bg-zinc-950 px-4 py-3 text-sm text-white placeholder-zinc-600 border border-zinc-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all uppercase tracking-wider"
                />
              </div>

              <button type="submit" className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-500 transition shadow-lg shadow-blue-600/10 active:scale-[0.99]">
                Redeem Code
              </button>
            </form>

            {/* Test Codes Box */}
            <div className="mt-6 rounded-lg bg-yellow-500/5 border border-yellow-500/10 p-3 text-[11px] text-zinc-500">
              <span className="font-bold text-yellow-500 flex items-center gap-1 mb-1">
                <Info size={12} /> Test Simulation Codes:
              </span>
              <ul className="list-disc pl-4 space-y-0.5 font-mono">
                <li>PROMO-PREMIUM (Promo Sub, views excluded)</li>
                <li>PAID-PREMIUM (Standard Sub, views counted)</li>
              </ul>
            </div>
          </div>

          {/* Status Card: Active Subscription Status */}
          <div className="flex flex-col rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-6 backdrop-blur-sm justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-6">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck size={18} />
                </div>
                <h2 className="text-sm font-bold tracking-wide uppercase text-zinc-300">Subscription Status</h2>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Current Tier</label>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xl font-black text-white">{currentUserStatus.tier}</span>
                    <span className="rounded-full bg-zinc-800 border border-zinc-700 px-2.5 py-0.5 text-[10px] font-medium text-zinc-400">
                      {currentUserStatus.isPromotional ? "Promotional Account" : "Standard Account"}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-800/60">
                  <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Platform Impact</label>
                  <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
                    {currentUserStatus.viewEarningContributed ? (
                      <>
                        Your views currently <span className="text-emerald-400 font-medium">increment metrics normally</span>, directly supporting authors and creators across the ecosystem.
                      </>
                    ) : (
                      <>
                        Your views are currently <span className="text-rose-400 font-medium">excluded from metrics</span> to prevent unfair analytics inflating for promotional subscriptions.
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 text-[11px] text-zinc-500 italic">
              System active and verified.
            </div>
          </div>

        </div>

        {/* Bottom Section: Redemption Log */}
        <div className="mt-8 rounded-2xl border border-zinc-800/80 bg-zinc-900/10 p-6">
          <div className="flex items-center gap-2 mb-4 text-zinc-400">
            <History size={16} />
            <h2 className="text-xs font-bold tracking-wide uppercase">Redemption Log</h2>
          </div>
          
          {log.length === 0 ? (
            <div className="rounded-xl bg-zinc-950/40 border border-zinc-900 py-8 text-center">
              <p className="text-xs text-zinc-600 font-medium">No promo codes redeemed during this session.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {log.map((entry, idx) => (
                <div key={idx} className="rounded-xl bg-zinc-950/40 border border-zinc-900/50 p-3 text-xs text-zinc-300 font-mono">
                  {entry}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
