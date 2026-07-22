"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { 
  ArrowLeft, User, Mail, Calendar, Briefcase, Globe, FileText, 
  CheckCircle2, XCircle, Info, RefreshCw, Clock, ExternalLink, ShieldAlert,
  ArrowRight, ShieldCheck, HelpCircle
} from "lucide-react";
import { trpc } from "../../../../lib/trpc";
import { TimeAgo } from "../../../../components/TimeAgo";

export default function ApplicationDetailsPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, refetch, isLoading } = trpc.creator.getApplicationDetails.useQuery({
    applicationId: id
  });

  const vetMutation = trpc.creator.vetApplication.useMutation({
    onSuccess: () => {
      setIsSubmitting(false);
      setNotes("");
      refetch();
      alert("Application successfully reviewed!");
    },
    onError: (err) => {
      setIsSubmitting(false);
      alert(`Review Error: ${err.message}`);
    }
  });

  const handleAction = (status: "APPROVED" | "DENIED" | "INFO_REQUESTED") => {
    if (status === "DENIED" && !notes.trim()) {
      alert("Please provide reviewer notes explaining the reason for denial.");
      return;
    }
    if (status === "INFO_REQUESTED" && !notes.trim()) {
      alert("Please provide notes explaining what additional information is requested.");
      return;
    }

    setIsSubmitting(true);
    vetMutation.mutate({
      applicationId: id,
      status: status as any,
      reviewerNotes: notes.trim()
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#07080a] text-white flex flex-col justify-center items-center p-6">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mb-4" />
        <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Loading Application Details...</span>
      </div>
    );
  }

  if (!data || !data.application) {
    return (
      <div className="min-h-screen bg-[#07080a] text-white flex flex-col justify-center items-center p-6">
        <ShieldAlert className="w-8 h-8 text-red-500 mb-4" />
        <h2 className="text-lg font-bold">Application Not Found</h2>
        <p className="text-xs text-zinc-500 mt-2">The application ID might be invalid or has been deleted.</p>
        <Link href="/admin" className="mt-6 bg-zinc-800 text-white font-bold text-xs py-2.5 px-6 rounded-xl transition">
          Return to Admin Panel
        </Link>
      </div>
    );
  }

  const { application, auditLogs } = data;
  
  // Parse dynamic details
  let details: Record<string, any> = {};
  let history: Array<any> = [];
  try {
    details = JSON.parse(application.detailsJson || "{}");
    history = details.reviewHistory || [];
  } catch (e) {
    details = {};
    history = [];
  }

  // Get status badge colors
  let statusBg = "rgba(37, 99, 235, 0.1)";
  let statusColor = "#3b82f6";
  if (application.status === "APPROVED") {
    statusBg = "rgba(16, 185, 129, 0.1)";
    statusColor = "#10b981";
  } else if (application.status === "DENIED") {
    statusBg = "rgba(239, 68, 68, 0.1)";
    statusColor = "#ef4444";
  } else if (application.status === "INFO_REQUESTED") {
    statusBg = "rgba(245, 158, 11, 0.1)";
    statusColor = "#f59e0b";
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#07080a", color: "#fff", fontFamily: "var(--font-sans, sans-serif)", paddingBottom: "5rem" }}>
      
      {/* Header Bar */}
      <div className="mx-auto max-w-7xl px-6 pt-24 pb-6 flex items-center justify-between border-b border-zinc-900">
        <div className="space-y-1.5">
          <Link href="/admin" className="text-zinc-500 hover:text-white transition flex items-center gap-2 text-sm font-semibold mb-2">
            <ArrowLeft size={16} /> Back to Vetting Queue
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight">{application.penName}</h1>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, padding: "4px 10px", borderRadius: "9999px", backgroundColor: statusBg, color: statusColor, textTransform: "uppercase" }}>
              {application.status.replace("_", " ")}
            </span>
          </div>
        </div>
        <span className="text-xs text-zinc-500 font-mono">ID: {application.id}</span>
      </div>

      <div className="mx-auto max-w-7xl px-6 grid gap-8 lg:grid-cols-12 mt-8 items-start">
        
        {/* Left Area: Submission Details */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Section 1: User Profile Context */}
          <div className="glass-panel" style={{ padding: "1.75rem", background: "#0d0e12", border: "1px solid #1c1e24", borderRadius: "16px" }}>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-zinc-400 mb-4">Applicant Profile</h3>
            
            <div className="grid gap-6 sm:grid-cols-3">
              <div className="flex items-center gap-3 bg-zinc-950/40 p-3 rounded-xl border border-zinc-900">
                <User className="text-blue-500 w-5 h-5 shrink-0" />
                <div className="space-y-0.5">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold block">Username</span>
                  <span className="text-xs font-semibold text-zinc-200">@{application.user?.username || "user"}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-zinc-950/40 p-3 rounded-xl border border-zinc-900">
                <Mail className="text-blue-500 w-5 h-5 shrink-0" />
                <div className="space-y-0.5">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold block">Email Contact</span>
                  <span className="text-xs font-semibold text-zinc-200 break-all">{application.user?.email}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-zinc-950/40 p-3 rounded-xl border border-zinc-900">
                <Calendar className="text-blue-500 w-5 h-5 shrink-0" />
                <div className="space-y-0.5">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold block">Member Since</span>
                  <span className="text-xs font-semibold text-zinc-200">
                    {application.user?.createdAt ? new Date(application.user.createdAt).toLocaleDateString() : "Just now"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: General Submission Information */}
          <div className="glass-panel" style={{ padding: "1.75rem", background: "#0d0e12", border: "1px solid #1c1e24", borderRadius: "16px" }}>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-zinc-400 mb-4">Application Details</h3>
            
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-bold block">Primary Creator Category</span>
                  <span className="text-sm font-extrabold text-white mt-0.5 block">{application.type}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-bold block">Portfolio URL</span>
                  <a href={application.portfolioUrl} target="_blank" rel="noreferrer" className="text-sm font-bold text-blue-400 hover:underline inline-flex items-center gap-1 mt-0.5 break-all">
                    {application.portfolioUrl} <ExternalLink size={12} />
                  </a>
                </div>
              </div>

              <div className="pt-2">
                <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Biography</span>
                <p className="text-xs text-zinc-300 bg-zinc-950/40 p-4 border border-zinc-900 rounded-xl leading-relaxed whitespace-pre-wrap">
                  {application.bio || "No biography provided."}
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Extensible Category Fields */}
          <div className="glass-panel" style={{ padding: "1.75rem", background: "#0d0e12", border: "1px solid #1c1e24", borderRadius: "16px" }}>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-zinc-400 mb-4">
              Category-Specific Forms ({application.type})
            </h3>

            <div className="space-y-5">
              {application.type === "ARTIST" && (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-900">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold block">Art Style</span>
                      <span className="text-xs font-semibold text-zinc-200 block mt-0.5">{details.artStyle || "N/A"}</span>
                    </div>
                    <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-900">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold block">Preferred Software</span>
                      <span className="text-xs font-semibold text-zinc-200 block mt-0.5">{details.software || "N/A"}</span>
                    </div>
                  </div>

                  {details.sketchLinks && (
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Storyboard / Draft Sketch folder</span>
                      <a href={details.sketchLinks} target="_blank" rel="noreferrer" className="text-xs font-semibold text-blue-400 hover:underline inline-flex items-center gap-1">
                        Open Draft Sketches <ExternalLink size={12} />
                      </a>
                    </div>
                  )}

                  {details.sampleWork && (
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-2">Portfolio Sample Attachment</span>
                      <div className="bg-zinc-950/60 p-3 border border-zinc-900 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText size={16} className="text-emerald-400" />
                          <span className="text-xs font-medium text-zinc-300">Portfolio_Sample.png</span>
                        </div>
                        <a href={details.sampleWork} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-400 hover:underline">
                          View Uploaded Sample
                        </a>
                      </div>
                      
                      {/* Embed Image Mock Preview */}
                      <div className="mt-4 border border-zinc-900 rounded-xl overflow-hidden bg-zinc-950/20 max-w-sm">
                        <img 
                          src="https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=600&auto=format&fit=crop" 
                          alt="Portfolio Artwork Mock" 
                          className="w-full h-auto object-cover max-h-60 opacity-90"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {application.type === "NOVELIST" && (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-900">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold block">Estimated Word Count</span>
                      <span className="text-xs font-semibold text-zinc-200 block mt-0.5">
                        {details.wordCount ? Number(details.wordCount).toLocaleString() : "N/A"} words
                      </span>
                    </div>
                    <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-900">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold block">Previous Platforms</span>
                      <span className="text-xs font-semibold text-zinc-200 block mt-0.5">{details.prevPublications || "None listed"}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Novel Plot Synopsis</span>
                    <p className="text-xs text-zinc-300 bg-zinc-950/40 p-4 border border-zinc-900 rounded-xl leading-relaxed">
                      {details.synopsis || "N/A"}
                    </p>
                  </div>

                  {details.chapterSample && (
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-2">Manuscript Chapter Sample</span>
                      <div className="bg-zinc-950/60 p-3 border border-zinc-900 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText size={16} className="text-blue-400" />
                          <span className="text-xs font-medium text-zinc-300">Manuscript_Sample.pdf</span>
                        </div>
                        <a href={details.chapterSample} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-400 hover:underline">
                          Download PDF Excerpt
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {application.type === "WRITER" && (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-900">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold block">Genres of Interest</span>
                      <span className="text-xs font-semibold text-zinc-200 block mt-0.5">{details.genreFocus || "N/A"}</span>
                    </div>
                    {details.bloggingLinks && (
                      <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-900">
                        <span className="text-[10px] text-zinc-500 uppercase font-bold block">Blogging Portfolio</span>
                        <a href={details.bloggingLinks} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-400 hover:underline block mt-0.5 break-all">
                          {details.bloggingLinks}
                        </a>
                      </div>
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Short Story Prose Excerpt</span>
                    <p className="text-xs text-zinc-300 bg-zinc-950/40 p-4 border border-zinc-900 rounded-xl leading-relaxed whitespace-pre-wrap">
                      {details.writingSampleText || "N/A"}
                    </p>
                  </div>
                </div>
              )}

              {application.type === "STUDIO" && (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-900">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold block">Studio Legal Name</span>
                      <span className="text-xs font-semibold text-zinc-200 block mt-0.5">{details.legalName || "N/A"}</span>
                    </div>
                    <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-900">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold block">Active Team Size</span>
                      <span className="text-xs font-semibold text-zinc-200 block mt-0.5">{details.teamSize || "N/A"} members</span>
                    </div>
                    <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-900">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold block">Studio Portal Website</span>
                      {details.studioWebsite ? (
                        <a href={details.studioWebsite} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-400 hover:underline block mt-0.5 break-all">
                          {details.studioWebsite}
                        </a>
                      ) : (
                        <span className="text-xs text-zinc-500 block mt-0.5">N/A</span>
                      )}
                    </div>
                  </div>

                  {details.businessLicense && (
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-2">Legal Registration Document</span>
                      <div className="bg-zinc-950/60 p-3 border border-zinc-900 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText size={16} className="text-pink-400" />
                          <span className="text-xs font-medium text-zinc-300">Registration_Certificate.pdf</span>
                        </div>
                        <a href={details.businessLicense} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-400 hover:underline">
                          Download Certificate PDF
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Area: Action Panel & History */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Action Card */}
          <div className="glass-panel" style={{ padding: "1.75rem", background: "#0d0e12", border: "1px solid #1c1e24", borderRadius: "16px" }}>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-zinc-400 mb-4">Vetting Decisions</h3>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Internal Review Notes</label>
                <textarea
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Provide review reasoning, rejection grounds, or detailed requests for information..."
                  className="w-full rounded-xl bg-zinc-950 border border-zinc-850 px-3.5 py-2.5 text-xs text-white placeholder-zinc-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all resize-none"
                />
              </div>

              {application.status === "PENDING" ? (
                <div className="space-y-2">
                  <button
                    onClick={() => handleAction("APPROVED")}
                    disabled={isSubmitting}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl transition text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/10 disabled:opacity-50"
                  >
                    <ShieldCheck size={14} /> Approve Application
                  </button>
                  
                  <button
                    onClick={() => handleAction("DENIED")}
                    disabled={isSubmitting}
                    className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-xl transition text-xs flex items-center justify-center gap-1.5 shadow-md shadow-red-600/10 disabled:opacity-50"
                  >
                    <XCircle size={14} /> Deny Application
                  </button>

                  <button
                    onClick={() => handleAction("INFO_REQUESTED")}
                    disabled={isSubmitting}
                    className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold py-2.5 rounded-xl transition text-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <HelpCircle size={14} /> Request Information
                  </button>
                </div>
              ) : (
                <div className="p-4 bg-zinc-950/60 border border-zinc-900 rounded-xl text-center space-y-1.5">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Decision Recorded</span>
                  <p className="text-xs text-zinc-400 leading-normal">
                    This application was set to <strong className="text-white uppercase">{application.status}</strong> and can no longer be updated unless resubmitted.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Audit Logs & Action History */}
          <div className="glass-panel" style={{ padding: "1.75rem", background: "#0d0e12", border: "1px solid #1c1e24", borderRadius: "16px" }}>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="text-zinc-400 w-4 h-4" />
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-zinc-400">Review History</h3>
            </div>

            {history.length === 0 ? (
              <div className="text-xs text-zinc-600 italic py-2 text-center">No actions recorded.</div>
            ) : (
              <div className="space-y-4">
                {history.map((h, idx) => {
                  let actionText = h.action;
                  let color = "text-blue-500";
                  if (h.action === "APPROVED") {
                    actionText = "Approved";
                    color = "text-emerald-400";
                  } else if (h.action === "DENIED") {
                    actionText = "Denied";
                    color = "text-red-400";
                  } else if (h.action === "INFO_REQUESTED") {
                    actionText = "Info Requested";
                    color = "text-yellow-500";
                  } else if (h.action === "SUBMIT") {
                    actionText = "Initial Submission";
                    color = "text-blue-400";
                  } else if (h.action === "RESUBMIT") {
                    actionText = "Resubmitted";
                    color = "text-sky-400";
                  }

                  return (
                    <div key={idx} className="border-l-2 border-zinc-800 pl-3.5 space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <strong className={color}>{actionText}</strong>
                        <span className="text-[10px] text-zinc-500">
                          {new Date(h.timestamp).toLocaleDateString()} {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      
                      {h.reviewerName && (
                        <span className="text-[10px] text-zinc-500 block">By @{h.reviewerName}</span>
                      )}

                      {h.notes && (
                        <p className="text-zinc-400 font-medium italic mt-1 leading-relaxed bg-zinc-950/20 p-2 rounded border border-zinc-900/30">
                          "{h.notes}"
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
