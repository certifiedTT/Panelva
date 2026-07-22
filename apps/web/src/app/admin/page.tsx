"use client";

import { useState } from "react";
import { trpc } from "../../lib/trpc";
import { ShieldAlert, Users, CheckCircle, RefreshCcw } from "lucide-react";

export default function AdminDashboardPage() {
  const [selectedApps, setSelectedApps] = useState<Set<string>>(new Set());
  const [selectedReports, setSelectedReports] = useState<Set<string>>(new Set());

  const { data: apps, refetch: refetchApps } = trpc.admin.getPendingApplications.useQuery();
  const { data: reports, refetch: refetchReports } = trpc.admin.getSafetyReports.useQuery();

  const approveAppsMutation = trpc.admin.batchApproveApplications.useMutation({
    onSuccess: () => {
      setSelectedApps(new Set());
      refetchApps();
    }
  });

  const resolveReportsMutation = trpc.admin.batchResolveReports.useMutation({
    onSuccess: () => {
      setSelectedReports(new Set());
      refetchReports();
    }
  });

  const handleAppToggle = (id: string) => {
    const next = new Set(selectedApps);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedApps(next);
  };

  const handleReportToggle = (id: string) => {
    const next = new Set(selectedReports);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedReports(next);
  };

  const handleBatchApprove = () => {
    if (selectedApps.size === 0) return;
    approveAppsMutation.mutate({ applicationIds: Array.from(selectedApps) });
  };

  const handleBatchResolve = () => {
    if (selectedReports.size === 0) return;
    resolveReportsMutation.mutate({ reportIds: Array.from(selectedReports) });
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-color)", color: "var(--text-color)" }}>
      <header style={{ padding: "1.5rem 2rem", borderBottom: "1px solid var(--border-color)", background: "var(--panel-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "10px" }}>
          <ShieldAlert color="#ef4444" /> Panelva Admin Control
        </h1>
        <button onClick={() => { refetchApps(); refetchReports(); }} style={{ background: "none", border: "1px solid var(--border-color)", color: "var(--text-color)", padding: "8px 12px", borderRadius: "8px", cursor: "pointer", display: "flex", gap: "6px" }}>
          <RefreshCcw size={16} /> Refresh
        </button>
      </header>

      <main style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "2rem" }}>
        
        {/* Creator Applications Section */}
        <section style={{ background: "var(--panel-color)", borderRadius: "12px", border: "1px solid var(--border-color)", padding: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              <Users size={20} color="#3b82f6" /> Pending Creator Applications
            </h2>
            <button 
              onClick={handleBatchApprove}
              disabled={selectedApps.size === 0 || approveAppsMutation.isLoading}
              style={{ background: selectedApps.size > 0 ? "#10b981" : "rgba(16, 185, 129, 0.2)", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "8px", fontWeight: 600, cursor: selectedApps.size > 0 ? "pointer" : "not-allowed" }}
            >
              Approve Selected ({selectedApps.size})
            </button>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-color)", color: "var(--text-muted-color)" }}>
                <th style={{ padding: "12px", width: "40px" }}></th>
                <th style={{ padding: "12px" }}>User</th>
                <th style={{ padding: "12px" }}>Pen Name</th>
                <th style={{ padding: "12px" }}>Type</th>
                <th style={{ padding: "12px" }}>Portfolio</th>
                <th style={{ padding: "12px" }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {apps?.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted-color)" }}>No pending applications.</td>
                </tr>
              ) : (
                apps?.map(app => (
                  <tr key={app.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "12px" }}>
                      <input type="checkbox" checked={selectedApps.has(app.id)} onChange={() => handleAppToggle(app.id)} />
                    </td>
                    <td style={{ padding: "12px" }}>{app.user.username}</td>
                    <td style={{ padding: "12px", fontWeight: 600 }}>{app.penName}</td>
                    <td style={{ padding: "12px" }}>{app.type}</td>
                    <td style={{ padding: "12px" }}>
                      <a href={app.portfolioUrl} target="_blank" rel="noreferrer" style={{ color: "#3b82f6" }}>Link</a>
                    </td>
                    <td style={{ padding: "12px", color: "var(--text-muted-color)" }}>{new Date(app.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>

        {/* Safety Reports Section */}
        <section style={{ background: "var(--panel-color)", borderRadius: "12px", border: "1px solid var(--border-color)", padding: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              <ShieldAlert size={20} color="#ef4444" /> Active Safety Reports
            </h2>
            <button 
              onClick={handleBatchResolve}
              disabled={selectedReports.size === 0 || resolveReportsMutation.isLoading}
              style={{ background: selectedReports.size > 0 ? "#7c3aed" : "rgba(124, 58, 237, 0.2)", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "8px", fontWeight: 600, cursor: selectedReports.size > 0 ? "pointer" : "not-allowed" }}
            >
              Resolve Selected ({selectedReports.size})
            </button>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-color)", color: "var(--text-muted-color)" }}>
                <th style={{ padding: "12px", width: "40px" }}></th>
                <th style={{ padding: "12px" }}>Reporter</th>
                <th style={{ padding: "12px" }}>Target</th>
                <th style={{ padding: "12px" }}>Reason</th>
                <th style={{ padding: "12px" }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {reports?.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted-color)" }}>No active reports.</td>
                </tr>
              ) : (
                reports?.map(report => (
                  <tr key={report.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "12px" }}>
                      <input type="checkbox" checked={selectedReports.has(report.id)} onChange={() => handleReportToggle(report.id)} />
                    </td>
                    <td style={{ padding: "12px" }}>{report.reporter.username}</td>
                    <td style={{ padding: "12px" }}>
                      {report.chapterId ? `Chapter: ${report.chapter?.title || "Unknown"}` : (report.commentId ? `Comment ID: ${report.commentId}` : "Other")}
                    </td>
                    <td style={{ padding: "12px", fontWeight: 600 }}>{report.reason}</td>
                    <td style={{ padding: "12px", color: "var(--text-muted-color)" }}>{new Date(report.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>

      </main>
    </div>
  );
}
