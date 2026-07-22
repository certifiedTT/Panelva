"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { 
  ArrowLeft, Upload, CheckCircle2, AlertCircle, FileText, 
  Sparkles, Globe, Users, PenTool, BookOpen, Clock, RefreshCw, Send
} from "lucide-react";
import { trpc } from "../../../lib/trpc";

// Extensible form configuration definitions for role-based signups
const CREATOR_CATEGORIES = {
  ARTIST: {
    id: "ARTIST",
    title: "Comic Artist / Illustrator",
    icon: <PenTool className="w-5 h-5" />,
    description: "Submit details about your visual styles, panel experience, and storyboard files.",
    fields: [
      { 
        id: "artStyle", 
        label: "Primary Art Style", 
        type: "text", 
        placeholder: "e.g., Manga, Semi-Realistic, Webtoon Digital Style", 
        required: true,
        description: "Specify the main aesthetic of your illustrations."
      },
      { 
        id: "software", 
        label: "Preferred Illustration Software", 
        type: "text", 
        placeholder: "e.g., Clip Studio Paint, Photoshop, Procreate", 
        required: true,
        description: "The tools you use to create and edit your pages."
      },
      { 
        id: "sketchLinks", 
        label: "Storyboard / Rough Sketch Links (Optional)", 
        type: "url", 
        placeholder: "https://drive.google.com/drive/folders/...", 
        required: false,
        description: "Shared folder of raw sketches to help us assess your process."
      },
      { 
        id: "sampleWork", 
        label: "Illustration Portfolio File", 
        type: "file", 
        accept: "image/*", 
        required: true, 
        description: "Upload a copy of your best webtoon panel or illustration (PNG/JPG up to 10MB)." 
      }
    ]
  },
  NOVELIST: {
    id: "NOVELIST",
    title: "Novelist",
    icon: <BookOpen className="w-5 h-5" />,
    description: "Submit details about your prose writing style and outline drafts.",
    fields: [
      { 
        id: "synopsis", 
        label: "Novel Synopsis", 
        type: "textarea", 
        placeholder: "Brief summary of your novel's core plot, conflict, and protagonist...", 
        required: true,
        description: "Give us the hook and brief story arc outline."
      },
      { 
        id: "wordCount", 
        label: "Estimated Total Word Count", 
        type: "number", 
        placeholder: "e.g. 60000", 
        required: true,
        description: "Your target or current word count for the full project."
      },
      { 
        id: "prevPublications", 
        label: "Previous Publications (Optional)", 
        type: "text", 
        placeholder: "e.g., Wattpad, Royal Road, personal site", 
        required: false,
        description: "List any websites or hubs where you have published work."
      },
      { 
        id: "chapterSample", 
        label: "First Chapter / Excerpt Manuscript", 
        type: "file", 
        accept: ".pdf,.doc,.docx", 
        required: true, 
        description: "Upload a PDF or Word document containing your first chapter (up to 5MB)." 
      }
    ]
  },
  WRITER: {
    id: "WRITER",
    title: "Author / Writer",
    icon: <FileText className="w-5 h-5" />,
    description: "Submit your general writing samples, scripts, or narrative designs.",
    fields: [
      { 
        id: "genreFocus", 
        label: "Specialized Genres", 
        type: "text", 
        placeholder: "e.g., Fantasy, Sci-Fi, LitRPG, Romance", 
        required: true,
        description: "List the primary genres you write in."
      },
      { 
        id: "bloggingLinks", 
        label: "Blogging or Article Portfolio (Optional)", 
        type: "url", 
        placeholder: "e.g. https://medium.com/@yourprofile", 
        required: false,
        description: "Links to articles, scripts, or blog posts."
      },
      { 
        id: "writingSampleText", 
        label: "Short Prose Sample", 
        type: "textarea", 
        placeholder: "Write a short creative excerpt directly here (up to 1,000 words)...", 
        required: true,
        description: "Provide a quick showcase of your dialogue and pacing."
      }
    ]
  },
  STUDIO: {
    id: "STUDIO",
    title: "Studio Production Entity",
    icon: <Users className="w-5 h-5" />,
    description: "Submit details about your team capacity, registration, and licenses.",
    fields: [
      { 
        id: "legalName", 
        label: "Studio Legal / Registration Name", 
        type: "text", 
        placeholder: "e.g., Panelva Comics Studio LLC", 
        required: true,
        description: "Official legal name of the entity."
      },
      { 
        id: "teamSize", 
        label: "Core Team Size", 
        type: "number", 
        placeholder: "e.g. 6", 
        required: true,
        description: "Number of full-time artists, writers, and editors in your studio."
      },
      { 
        id: "studioWebsite", 
        label: "Official Website", 
        type: "url", 
        placeholder: "https://www.yourstudio.com", 
        required: true,
        description: "Your official studio portal."
      },
      { 
        id: "businessLicense", 
        label: "Business Registration Certificate", 
        type: "file", 
        accept: ".pdf", 
        required: true, 
        description: "Upload a PDF proof of business registration or trade certificate." 
      }
    ]
  }
};

export default function CreatorApplyPage() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState("");
  const [penName, setPenName] = useState("");
  const [bio, setBio] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [creatorType, setCreatorType] = useState<"ARTIST" | "NOVELIST" | "WRITER" | "STUDIO">("ARTIST");
  const [agreed, setAgreed] = useState(false);
  
  // Dynamic fields state map
  const [dynamicValues, setDynamicValues] = useState<Record<string, any>>({});
  const [uploadStatus, setUploadStatus] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // tRPC Status Queries
  const { data: appStatus, refetch: refetchStatus, isLoading: isLoadingStatus } = trpc.creator.getApplicantStatus.useQuery(undefined, {
    enabled: isSignedIn
  });

  const submitMutation = trpc.creator.submitApplication.useMutation({
    onSuccess: () => {
      setIsSubmitting(false);
      refetchStatus();
      alert("Application submitted successfully!");
    },
    onError: (err) => {
      setIsSubmitting(false);
      alert(`Submission Error: ${err.message}`);
    }
  });

  useEffect(() => {
    const user = localStorage.getItem("panelva_user");
    if (user) {
      setIsSignedIn(true);
      setCurrentUser(user);
      setPenName(user);
    }
  }, []);

  // Set default values when creator type changes
  useEffect(() => {
    const defaultVals: Record<string, any> = {};
    CREATOR_CATEGORIES[creatorType].fields.forEach(f => {
      defaultVals[f.id] = "";
    });
    setDynamicValues(defaultVals);
    setUploadStatus({});
  }, [creatorType]);

  const handleInputChange = (fieldId: string, val: any) => {
    setDynamicValues(prev => ({
      ...prev,
      [fieldId]: val
    }));
  };

  const handleFileUploadMock = (fieldId: string, accept: string) => {
    // Simulate dynamic file uploading to keep UX reactive
    const fakeFileName = `uploaded_${fieldId}_${Math.random().toString(36).substring(7)}` + 
                         (accept.includes("image") ? ".png" : ".pdf");
    setUploadStatus(prev => ({ ...prev, [fieldId]: true }));
    setDynamicValues(prev => ({
      ...prev,
      [fieldId]: `https://panelva-assets.s3.amazonaws.com/uploads/${fakeFileName}`
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      alert("You must agree to the Terms of Use and Content Guidelines.");
      return;
    }

    // Verify all required dynamic fields are filled
    const activeFields = CREATOR_CATEGORIES[creatorType].fields;
    for (const f of activeFields) {
      if (f.required && !dynamicValues[f.id]) {
        alert(`Please complete the required field: ${f.label}`);
        return;
      }
    }

    setIsSubmitting(true);

    submitMutation.mutate({
      penName: penName.trim(),
      bio: bio.trim(),
      type: creatorType as any,
      portfolioUrl: portfolioUrl.trim(),
      details: dynamicValues
    });
  };

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-[#07080a] text-white flex flex-col justify-center items-center p-6 font-sans">
        <div className="max-w-md w-full text-center space-y-6 bg-zinc-900/40 p-8 border border-zinc-800 rounded-2xl">
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl inline-block">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Authentication Required</h2>
          <p className="text-sm text-zinc-400">
            Please sign in to your Panelva account to access the creator vetting application portal.
          </p>
          <Link href="/auth" className="block w-full text-center bg-blue-600 hover:bg-blue-500 transition py-3 rounded-xl font-bold text-sm">
            Sign In to Panelva
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#07080a", color: "#fff", fontFamily: "var(--font-sans, sans-serif)", paddingBottom: "4rem" }}>
      
      {/* Dynamic Header */}
      <div className="mx-auto max-w-7xl px-6 pt-24 pb-8 flex items-center justify-between">
        <Link href="/" className="text-zinc-500 hover:text-white transition flex items-center gap-2 text-sm font-semibold">
          <ArrowLeft size={16} /> Back to Home
        </Link>
        <span className="text-xs text-zinc-500 font-medium">Logged in as @{currentUser}</span>
      </div>

      <div className="mx-auto max-w-7xl px-6 grid gap-12 lg:grid-cols-12 items-start">
        
        {/* Left Column: Info Hub */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-3 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl inline-block">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-none">
            Share your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">creations</span> with the world.
          </h1>
          <p className="text-zinc-400 text-sm md:text-base leading-relaxed">
            Join the Panelva creative ecosystem. Whether you illustate comics, write novels, publish articles, or lead a studio production, we offer deep integrations and monetization models to support your work.
          </p>

          {/* Quick Checklist */}
          <div className="space-y-4 pt-6 border-t border-zinc-800/80">
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-[10px] text-blue-400 font-bold">1</div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wide text-zinc-300">Select Creator Type</h4>
                <p className="text-xs text-zinc-500">Pick the category that matches your core publishing medium.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-[10px] text-blue-400 font-bold">2</div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wide text-zinc-300">Upload Samples</h4>
                <p className="text-xs text-zinc-500">Provide manuscript excerpts or illustration panels to show your quality.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-[10px] text-blue-400 font-bold">3</div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wide text-zinc-300">Get Approved</h4>
                <p className="text-xs text-zinc-500">Our vetting staff reviews submissions within 3 days to unlock Creator Studio.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Portal Workflow Card */}
        <div className="lg:col-span-7">
          {isLoadingStatus ? (
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-4">
              <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
              <span className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">Retrieving Application Status...</span>
            </div>
          ) : appStatus ? (
            /* Render Application status feedback if they have already submitted */
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-3xl p-8 backdrop-blur-sm space-y-6">
              
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
                <h3 className="text-lg font-bold">Application Status</h3>
                <span className="text-xs text-zinc-500 font-mono">ID: {appStatus.id.substring(0, 8)}...</span>
              </div>

              {appStatus.status === "PENDING" && (
                <div className="p-5 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex gap-4">
                  <Clock className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <strong className="text-yellow-500 text-sm block">Review In Progress</strong>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Your application to join as a <strong>{appStatus.type}</strong> has been received and is currently in the vetting queue. Reviews typically take 24-72 hours.
                    </p>
                  </div>
                </div>
              )}

              {appStatus.status === "INFO_REQUESTED" && (
                <div className="space-y-6">
                  <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-2xl flex gap-4">
                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <strong className="text-red-400 text-sm block">Action Required: More Info Needed</strong>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        The reviewing administrator has requested additional details to process your request.
                      </p>
                    </div>
                  </div>

                  {appStatus.reviewerNotes && (
                    <div className="bg-zinc-950/80 p-4 border border-zinc-800/60 rounded-xl space-y-1">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Reviewer Feedback Notes</span>
                      <p className="text-xs text-zinc-300 font-medium italic">{appStatus.reviewerNotes}</p>
                    </div>
                  )}

                  <div className="pt-4 border-t border-zinc-850 flex justify-end">
                    <button
                      onClick={() => {
                        // Prepopulate files and open resubmit mode
                        setPenName(appStatus.penName);
                        setBio(appStatus.bio || "");
                        setPortfolioUrl(appStatus.portfolioUrl);
                        setCreatorType(appStatus.type as any);
                        // Trigger client-side state force clear to allow page reload
                        window.location.reload();
                      }}
                      className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2.5 px-5 rounded-xl transition flex items-center gap-1.5"
                    >
                      <RefreshCw size={13} /> Edit & Resubmit Application
                    </button>
                  </div>
                </div>
              )}

              {appStatus.status === "APPROVED" && (
                <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl space-y-4">
                  <div className="flex gap-4">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                    <div className="space-y-1">
                      <strong className="text-emerald-400 text-sm block">Congratulations! Approved</strong>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Your creator application has been approved by the vetting team. Your account role has been updated.
                      </p>
                    </div>
                  </div>
                  <div className="pt-2">
                    <Link href="/creator" className="inline-block bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 px-6 rounded-xl transition">
                      Enter Creator Studio
                    </Link>
                  </div>
                </div>
              )}

              {appStatus.status === "DENIED" && (
                <div className="space-y-6">
                  <div className="p-5 bg-zinc-950 border border-zinc-850 rounded-2xl flex gap-4">
                    <AlertCircle className="w-5 h-5 text-zinc-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <strong className="text-zinc-300 text-sm block">Application Not Approved</strong>
                      <p className="text-xs text-zinc-500 leading-relaxed">
                        Your application to publish was reviewed but unfortunately not accepted.
                      </p>
                    </div>
                  </div>

                  {appStatus.reviewerNotes && (
                    <div className="bg-zinc-950/80 p-4 border border-zinc-800/60 rounded-xl space-y-1">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Feedback Notes</span>
                      <p className="text-xs text-zinc-400 font-medium italic">{appStatus.reviewerNotes}</p>
                    </div>
                  )}

                  <div className="pt-4 border-t border-zinc-850 flex justify-end">
                    <button
                      onClick={() => {
                        // Clear database application record by deleting or just forcing clean
                        // We will allow resubmission by resetting state
                        refetchStatus();
                        // Forcing page redirect or clear
                        localStorage.removeItem("panelva_application_cached");
                        window.location.reload();
                      }}
                      className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs py-2.5 px-5 rounded-xl transition"
                    >
                      Submit a New Application
                    </button>
                  </div>
                </div>
              )}

              {/* Submitted fields summary details */}
              <div className="bg-zinc-950/40 p-5 rounded-2xl border border-zinc-800/80 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Your Submission Details</h4>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-zinc-600 block">Creator Name</span>
                    <span className="font-semibold text-zinc-300">{appStatus.penName}</span>
                  </div>
                  <div>
                    <span className="text-zinc-600 block">Category</span>
                    <span className="font-semibold text-zinc-300">{CREATOR_CATEGORIES[appStatus.type as keyof typeof CREATOR_CATEGORIES]?.title || appStatus.type}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-zinc-600 block">Portfolio URL</span>
                    <a href={appStatus.portfolioUrl} target="_blank" rel="noreferrer" className="font-semibold text-blue-400 hover:underline break-all">
                      {appStatus.portfolioUrl}
                    </a>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            /* Become a Creator Form Card */
            <div className="bg-[#0b0c10] border border-zinc-850 rounded-3xl overflow-hidden shadow-2xl">
              
              {/* Card top banner */}
              <div className="bg-blue-600 px-8 py-6 text-white space-y-1">
                <h2 className="text-2xl font-extrabold tracking-tight">Become a Creator</h2>
                <p className="text-xs opacity-80 leading-normal max-w-md">
                  Complete this dynamic questionnaire to request publishing access. Review workflows are completed within 72 hours.
                </p>
              </div>

              {/* Interactive Category Selector */}
              <div className="p-8 pb-4 space-y-3">
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">1. Select Your Creator Role</label>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {(Object.keys(CREATOR_CATEGORIES) as Array<keyof typeof CREATOR_CATEGORIES>).map((catKey) => {
                    const catObj = CREATOR_CATEGORIES[catKey];
                    const isSelected = creatorType === catKey;
                    return (
                      <button
                        key={catKey}
                        type="button"
                        onClick={() => setCreatorType(catKey)}
                        className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-center transition-all cursor-pointer ${
                          isSelected 
                            ? "bg-blue-600/10 border-blue-500 text-blue-400 shadow-md shadow-blue-500/5 scale-[1.01]" 
                            : "bg-zinc-950 border-zinc-850 text-zinc-500 hover:border-zinc-800 hover:text-zinc-400"
                        }`}
                      >
                        <div className="mb-2 shrink-0">{catObj.icon}</div>
                        <span className="text-[10px] font-bold tracking-wide uppercase leading-tight">{catObj.title.split(" / ")[0]}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-zinc-500 italic mt-1.5 leading-relaxed">
                  {CREATOR_CATEGORIES[creatorType].description}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="p-8 pt-0 space-y-6">
                
                {/* 2. Core Identity Details */}
                <div className="space-y-4 pt-4 border-t border-zinc-900">
                  <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">2. Identity & Background</label>
                  
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-300">Creator Pen Name</label>
                      <input
                        type="text"
                        value={penName}
                        onChange={(e) => setPenName(e.target.value)}
                        placeholder="Public alias, e.g., StanLee"
                        required
                        className="w-full rounded-xl bg-zinc-950 border border-zinc-850 px-4 py-2.5 text-xs text-white placeholder-zinc-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-300">Portfolio Website / Hub</label>
                      <input
                        type="url"
                        value={portfolioUrl}
                        onChange={(e) => setPortfolioUrl(e.target.value)}
                        placeholder="https://behance.net/username"
                        required
                        className="w-full rounded-xl bg-zinc-950 border border-zinc-850 px-4 py-2.5 text-xs text-white placeholder-zinc-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300">Short Creator Bio</label>
                    <textarea
                      rows={3}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell us about yourself, your story roots, or your creative experience (max 500 characters)..."
                      required
                      className="w-full rounded-xl bg-zinc-950 border border-zinc-850 px-4 py-2.5 text-xs text-white placeholder-zinc-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all resize-none"
                    />
                  </div>
                </div>

                {/* 3. Tailored Category Dynamic Forms */}
                <div className="space-y-4 pt-4 border-t border-zinc-900">
                  <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                    3. Required Details for {CREATOR_CATEGORIES[creatorType].title}
                  </label>

                  <div className="space-y-4">
                    {CREATOR_CATEGORIES[creatorType].fields.map((field) => {
                      const value = dynamicValues[field.id] || "";
                      const isUploaded = uploadStatus[field.id] || false;

                      return (
                        <div key={field.id} className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-zinc-300">
                              {field.label} {field.required && <span className="text-red-500 font-bold">*</span>}
                            </label>
                            {field.description && (
                              <span className="text-[10px] text-zinc-500">{field.description}</span>
                            )}
                          </div>

                          {field.type === "text" && (
                            <input
                              type="text"
                              value={value}
                              onChange={(e) => handleInputChange(field.id, e.target.value)}
                              placeholder={field.placeholder}
                              required={field.required}
                              className="w-full rounded-xl bg-zinc-950 border border-zinc-850 px-4 py-2.5 text-xs text-white placeholder-zinc-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                            />
                          )}

                          {field.type === "url" && (
                            <input
                              type="url"
                              value={value}
                              onChange={(e) => handleInputChange(field.id, e.target.value)}
                              placeholder={field.placeholder}
                              required={field.required}
                              className="w-full rounded-xl bg-zinc-950 border border-zinc-850 px-4 py-2.5 text-xs text-white placeholder-zinc-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                            />
                          )}

                          {field.type === "number" && (
                            <input
                              type="number"
                              value={value}
                              onChange={(e) => handleInputChange(field.id, e.target.valueAsNumber || e.target.value)}
                              placeholder={field.placeholder}
                              required={field.required}
                              className="w-full rounded-xl bg-zinc-950 border border-zinc-850 px-4 py-2.5 text-xs text-white placeholder-zinc-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                            />
                          )}

                          {field.type === "textarea" && (
                            <textarea
                              rows={4}
                              value={value}
                              onChange={(e) => handleInputChange(field.id, e.target.value)}
                              placeholder={field.placeholder}
                              required={field.required}
                              className="w-full rounded-xl bg-zinc-950 border border-zinc-850 px-4 py-2.5 text-xs text-white placeholder-zinc-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all resize-none"
                            />
                          )}

                          {field.type === "file" && (
                            <div 
                              onClick={() => handleFileUploadMock(field.id, (field as any).accept || "")}
                              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                                isUploaded 
                                  ? "border-emerald-500/40 bg-emerald-500/5" 
                                  : "border-zinc-850 bg-zinc-950/40 hover:border-zinc-800"
                              }`}
                            >
                              <Upload className={`w-5 h-5 ${isUploaded ? "text-emerald-400" : "text-zinc-500"}`} />
                              <div>
                                <strong className="text-xs block text-zinc-300">
                                  {isUploaded ? "Document successfully loaded!" : "Click to select a file"}
                                </strong>
                                <span className="text-[10px] text-zinc-500 block mt-0.5">
                                  {isUploaded ? "Mock S3 URL Generated" : field.description || "PDF or Word document up to 10MB"}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Consent & Guidelines Checklist */}
                <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-2xl flex gap-3.5 items-start">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    required
                    className="mt-1 shrink-0 h-4 w-4 rounded border-zinc-800 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <div className="text-[11px] text-zinc-500 leading-normal">
                    I declare that all materials submitted are my original creations or licensed intellectual property. I agree to comply with the Panelva 
                    <span className="text-blue-400 font-semibold cursor-pointer hover:underline mx-1">Terms of Use</span> and 
                    <span className="text-blue-400 font-semibold cursor-pointer hover:underline mx-1">Content Guidelines</span>.
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all hover:scale-[1.005] active:scale-[0.995] shadow-lg shadow-blue-600/10 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Submitting Application...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> Submit Application
                    </>
                  )}
                </button>

              </form>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
