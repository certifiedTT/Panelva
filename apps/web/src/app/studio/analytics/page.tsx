"use client";

import { useState } from "react";
import { trpc } from "../../../lib/trpc";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts";
import { TrendingUp, Users, DollarSign, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function StudioAnalyticsPage() {
  const [days, setDays] = useState(30);
  const { data: analytics, isLoading } = trpc.creator.getAnalytics.useQuery({ days });

  if (isLoading || !analytics) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "var(--bg-color)" }}>
        <p style={{ color: "var(--text-muted-color)" }}>Loading analytics...</p>
      </div>
    );
  }

  // Calculate totals for quick stats
  const totalViews = analytics.reduce((acc, curr) => acc + curr.views, 0);
  const totalRevenue = analytics.reduce((acc, curr) => acc + curr.revenue, 0);
  
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-color)", color: "var(--text-color)" }}>
      
      <header style={{ height: "64px", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", padding: "0 2rem", background: "var(--panel-color)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Link href="/studio" style={{ color: "var(--text-muted-color)", textDecoration: "none" }} className="hover:text-white">
            <ArrowLeft size={20} />
          </Link>
          <h1 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800 }}>Creator Analytics</h1>
        </div>
      </header>

      <main style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "2rem", maxWidth: "1200px", margin: "0 auto", width: "100%" }}>
        
        {/* Date Range Selector */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <select 
            value={days} 
            onChange={(e) => setDays(Number(e.target.value))}
            style={{ background: "var(--panel-color)", color: "var(--text-color)", border: "1px solid var(--border-color)", padding: "8px 12px", borderRadius: "8px", fontWeight: 600 }}
          >
            <option value={7}>Last 7 Days</option>
            <option value={30}>Last 30 Days</option>
            <option value={90}>Last 90 Days</option>
          </select>
        </div>

        {/* Quick Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
          <div style={{ background: "var(--panel-color)", padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: "1.5rem" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "rgba(59, 130, 246, 0.1)", display: "flex", justifyContent: "center", alignItems: "center", color: "#3b82f6" }}>
              <Users size={24} />
            </div>
            <div>
              <p style={{ margin: 0, color: "var(--text-muted-color)", fontSize: "0.85rem", fontWeight: 600 }}>Total Views</p>
              <h2 style={{ margin: "4px 0 0 0", fontSize: "1.8rem", fontWeight: 800 }}>{totalViews.toLocaleString()}</h2>
            </div>
          </div>
          
          <div style={{ background: "var(--panel-color)", padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: "1.5rem" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "rgba(16, 185, 129, 0.1)", display: "flex", justifyContent: "center", alignItems: "center", color: "#10b981" }}>
              <DollarSign size={24} />
            </div>
            <div>
              <p style={{ margin: 0, color: "var(--text-muted-color)", fontSize: "0.85rem", fontWeight: 600 }}>Estimated Revenue</p>
              <h2 style={{ margin: "4px 0 0 0", fontSize: "1.8rem", fontWeight: 800 }}>${totalRevenue.toLocaleString()}</h2>
            </div>
          </div>

          <div style={{ background: "var(--panel-color)", padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: "1.5rem" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "rgba(139, 92, 246, 0.1)", display: "flex", justifyContent: "center", alignItems: "center", color: "#8b5cf6" }}>
              <TrendingUp size={24} />
            </div>
            <div>
              <p style={{ margin: 0, color: "var(--text-muted-color)", fontSize: "0.85rem", fontWeight: 600 }}>Growth Rate</p>
              <h2 style={{ margin: "4px 0 0 0", fontSize: "1.8rem", fontWeight: 800 }}>+12.4%</h2>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "2rem" }}>
          
          {/* Readership Chart */}
          <div style={{ background: "var(--panel-color)", padding: "2rem", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
            <h3 style={{ margin: "0 0 1.5rem 0", fontSize: "1.2rem" }}>Readership Views</h3>
            <div style={{ width: "100%", height: "300px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="date" stroke="#888" tick={{ fill: '#888' }} tickMargin={10} minTickGap={30} />
                  <YAxis stroke="#888" tick={{ fill: '#888' }} />
                  <Tooltip contentStyle={{ background: "#111", border: "1px solid #333", borderRadius: "8px" }} />
                  <Legend />
                  <Line type="monotone" dataKey="views" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 6 }} name="Daily Views" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Revenue Chart */}
          <div style={{ background: "var(--panel-color)", padding: "2rem", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
            <h3 style={{ margin: "0 0 1.5rem 0", fontSize: "1.2rem" }}>Revenue & Payouts</h3>
            <div style={{ width: "100%", height: "300px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="date" stroke="#888" tick={{ fill: '#888' }} tickMargin={10} minTickGap={30} />
                  <YAxis stroke="#888" tick={{ fill: '#888' }} />
                  <Tooltip contentStyle={{ background: "#111", border: "1px solid #333", borderRadius: "8px" }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} name="W-Coin Revenue ($)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}
