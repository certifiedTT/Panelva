"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UploadCloud, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import { trpc } from "../../../lib/trpc";

export default function StudioUploadPage() {
  const router = useRouter();
  
  // Fetch creator's series list
  const { data: seriesList } = trpc.series.getCreatorSeries.useQuery();

  // Form states
  const [selectedSeriesId, setSelectedSeriesId] = useState("");
  const [chapterNumber, setChapterNumber] = useState("1");
  const [chapterSubtitle, setChapterSubtitle] = useState("");
  const [tier, setTier] = useState<"FREE" | "AD_SUPPORTED" | "PREMIUM">("FREE");
  const [waitDays, setWaitDays] = useState(7);
  const [textContent, setTextContent] = useState("");
  
  // Upload assets states
  const [uploadedPages, setUploadedPages] = useState<string[]>([]);
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Selected series model details
  const selectedSeries = seriesList?.find((s: any) => s.id === selectedSeriesId);
  const isComic = selectedSeries ? selectedSeries.type === "COMIC" : true;

  // Compute live formatted chapter preview
  const getFormattedPreview = (num: string, sub?: string) => {
    const raw = (num || "1").trim();
    const lower = raw.toLowerCase();
    let prefix = raw;
    if (
      !lower.startsWith("chapter") &&
      !lower.startsWith("ch.") &&
      !lower.startsWith("ch ") &&
      !lower.startsWith("prologue") &&
      !lower.startsWith("epilogue") &&
      !lower.startsWith("special") &&
      !lower.startsWith("extra") &&
      !lower.startsWith("side story")
    ) {
      prefix = `Chapter ${raw}`;
    } else {
      prefix = raw.charAt(0).toUpperCase() + raw.slice(1);
    }
    return sub?.trim() ? `${prefix}: ${sub.trim()}` : prefix;
  };

  // Handle files selection queue
  const handleFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFilesToUpload(Array.from(e.target.files));
      setUploadStatus("idle");
      setUploadProgress(0);
      setErrorMessage("");
    }
  };

  // Perform real chunked multi-file upload
  const uploadFiles = async () => {
    if (filesToUpload.length === 0) return;

    setUploadStatus("uploading");
    setUploadProgress(0);
    setErrorMessage("");

    const totalFiles = filesToUpload.length;
    const urls: string[] = [];

    try {
      for (let fileIdx = 0; fileIdx < totalFiles; fileIdx++) {
        const file = filesToUpload[fileIdx];
        const CHUNK_SIZE = 1024 * 1024; // 1MB chunks
        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
        const filename = `${Date.now()}_${fileIdx}_${file.name}`;
        
        let fileUrl = "";

        for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
          const start = chunkIndex * CHUNK_SIZE;
          const end = Math.min(start + CHUNK_SIZE, file.size);
          const chunk = file.slice(start, end);

          const formData = new FormData();
          formData.append("chunk", chunk);
          formData.append("filename", filename);
          formData.append("chunkIndex", chunkIndex.toString());
          formData.append("totalChunks", totalChunks.toString());

          const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            throw new Error(`Upload failed for "${file.name}" at chunk ${chunkIndex}`);
          }

          const data = await response.json();
          if (chunkIndex === totalChunks - 1 && data.url) {
            fileUrl = data.url;
          }

          // Calculate collective progress pct
          const currentFileProgress = (chunkIndex + 1) / totalChunks;
          const overallProgress = Math.round(((fileIdx + currentFileProgress) / totalFiles) * 100);
          setUploadProgress(overallProgress);
        }
        
        if (fileUrl) {
          urls.push(fileUrl);
        }
      }

      setUploadedPages(urls);
      setUploadStatus("success");
    } catch (error: any) {
      console.error(error);
      setUploadStatus("error");
      setErrorMessage(error.message || "An error occurred during upload.");
    }
  };

  // Chapter creation mutation
  const createChapterMutation = trpc.creator.createChapter.useMutation({
    onSuccess: () => {
      alert("Episode published successfully!");
      router.push("/studio");
    },
    onError: (err: any) => {
      alert(err.message || "Failed to publish episode.");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSeriesId) {
      alert("Please select a series first.");
      return;
    }
    if (!chapterNumber.trim()) {
      alert("Please enter a chapter number (e.g. 1, 0.5, 3.1.5, Prologue).");
      return;
    }

    if (isComic && uploadedPages.length === 0) {
      alert("Please upload comic pages first.");
      return;
    }

    if (!isComic && !textContent.trim()) {
      alert("Please enter text content for this novel chapter.");
      return;
    }

    createChapterMutation.mutate({
      seriesId: selectedSeriesId,
      displayNumber: chapterNumber.trim(),
      title: chapterSubtitle.trim() || undefined,
      tier,
      waitTierDropDays: tier !== "FREE" ? waitDays : undefined,
      pages: isComic ? uploadedPages : undefined,
      textContent: !isComic ? textContent.trim() : undefined,
    });
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#08090c", color: "#ffffff" }}>
      
      {/* Header */}
      <header style={{ height: "64px", borderBottom: "1px solid #1a1c23", display: "flex", alignItems: "center", padding: "0 2rem", background: "#0d0e12", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Link href="/studio" style={{ color: "#8a8d98", textDecoration: "none", display: "flex", alignItems: "center" }} className="hover:text-white">
            <ArrowLeft size={20} />
          </Link>
          <h1 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800 }}>Upload New Episode</h1>
        </div>
      </header>

      {/* Main Content Form */}
      <main style={{ flex: 1, padding: "3rem 2rem", display: "flex", justifyContent: "center" }}>
        <form onSubmit={handleSubmit} style={{ width: "100%", maxWidth: "800px", display: "flex", flexDirection: "column", gap: "2rem" }}>
          
          <div style={{ background: "#0d0e12", border: "1px solid #1a1c23", borderRadius: "16px", padding: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0 }}>Episode Details</h3>

            {/* Select Series */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "0.7rem", color: "#9ca3af", fontWeight: 800, textTransform: "uppercase" }}>Select Series *</label>
              <select
                required
                value={selectedSeriesId}
                onChange={(e) => {
                  setSelectedSeriesId(e.target.value);
                  setUploadedPages([]);
                  setFilesToUpload([]);
                  setUploadStatus("idle");
                }}
                style={{ background: "#07080a", border: "1px solid #1c1e24", padding: "10px", borderRadius: "10px", color: "#fff", fontSize: "0.85rem", outline: "none" }}
              >
                <option value="">-- Choose Series --</option>
                {seriesList?.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.title} ({s.type})</option>
                ))}
              </select>
            </div>

            {/* Dynamic Chapter Number & Subtitle Inputs */}
            <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: "1rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "0.7rem", color: "#9ca3af", fontWeight: 800, textTransform: "uppercase" }}>Chapter Number *</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. 1, 0.5, 3.1.5, Prologue"
                  value={chapterNumber}
                  onChange={(e) => setChapterNumber(e.target.value)}
                  style={{ background: "#07080a", border: "1px solid #1c1e24", padding: "10px", borderRadius: "10px", color: "#fff", fontSize: "0.85rem", outline: "none" }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "0.7rem", color: "#9ca3af", fontWeight: 800, textTransform: "uppercase" }}>Chapter Title (Subtitle, Optional)</label>
                <input 
                  type="text"
                  placeholder="e.g. Reunion, Side Story, Echoes of Steel"
                  value={chapterSubtitle}
                  onChange={(e) => setChapterSubtitle(e.target.value)}
                  style={{ background: "#07080a", border: "1px solid #1c1e24", padding: "10px", borderRadius: "10px", color: "#fff", fontSize: "0.85rem", outline: "none" }}
                />
              </div>
            </div>

            {/* Live Formatted Title Preview */}
            <div style={{ background: "rgba(59, 130, 246, 0.08)", border: "1px solid rgba(59, 130, 246, 0.2)", borderRadius: "10px", padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.7rem", color: "#93c5fd", fontWeight: 700, textTransform: "uppercase" }}>Display Format:</span>
              <span style={{ fontSize: "0.85rem", color: "#ffffff", fontWeight: 800 }}>{getFormattedPreview(chapterNumber, chapterSubtitle)}</span>
            </div>

            {/* Tier Select */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "0.7rem", color: "#9ca3af", fontWeight: 800, textTransform: "uppercase" }}>Chapter Tier *</label>
                <select
                  value={tier}
                  onChange={(e: any) => setTier(e.target.value)}
                  style={{ background: "#07080a", border: "1px solid #1c1e24", padding: "10px", borderRadius: "10px", color: "#fff", fontSize: "0.85rem", outline: "none" }}
                >
                  <option value="FREE">Free</option>
                  <option value="AD_SUPPORTED">Watch to Unlock</option>
                  <option value="PREMIUM">Premium / Early Access</option>
                </select>
              </div>

              {tier !== "FREE" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "0.7rem", color: "#9ca3af", fontWeight: 800, textTransform: "uppercase" }}>Wait-For-Free (Days) *</label>
                  <input 
                    type="number"
                    min={1}
                    value={waitDays}
                    onChange={(e) => setWaitDays(Number(e.target.value))}
                    style={{ background: "#07080a", border: "1px solid #1c1e24", padding: "10px", borderRadius: "10px", color: "#fff", fontSize: "0.85rem", outline: "none" }}
                  />
                </div>
              )}
            </div>

          </div>

          {/* Dynamic Content Panel (Comic vs Novel) */}
          {selectedSeriesId && (
            <div style={{ background: "#0d0e12", border: "1px solid #1a1c23", borderRadius: "16px", padding: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              
              {isComic ? (
                // Comic File Upload Widget
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", width: "100%" }}>
                  <div>
                    <h4 style={{ fontSize: "1rem", fontWeight: 800, margin: "0 0 4px 0" }}>Comic Page Panels</h4>
                    <p style={{ fontSize: "0.75rem", color: "#9ca3af", margin: 0 }}>Select multiple comic panels/images. Slices are stitched sequentially.</p>
                  </div>

                  <div 
                    onClick={() => uploadStatus !== "uploading" && fileInputRef.current?.click()}
                    style={{
                      padding: "2.5rem 2rem",
                      border: "2px dashed #1a1c23",
                      borderRadius: "12px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "12px",
                      cursor: uploadStatus === "uploading" ? "not-allowed" : "pointer",
                      background: "rgba(255,255,255,0.01)",
                      transition: "border-color 0.2s"
                    }}
                    className="hover:border-blue-500/50"
                  >
                    <UploadCloud size={32} color="#3b82f6" />
                    <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>
                      {filesToUpload.length > 0 ? `${filesToUpload.length} files selected` : "Click to select panels"}
                    </span>
                    <span style={{ color: "#6b7280", fontSize: "0.75rem" }}>PNG or JPG up to 10MB per file</span>
                  </div>

                  <input 
                    type="file" 
                    multiple
                    ref={fileInputRef} 
                    onChange={handleFilesSelect} 
                    style={{ display: "none" }} 
                    accept="image/*"
                    disabled={uploadStatus === "uploading"}
                  />

                  {filesToUpload.length > 0 && uploadStatus === "idle" && (
                    <button
                      type="button"
                      onClick={uploadFiles}
                      style={{ background: "#3b82f6", color: "#fff", border: "none", padding: "10px 16px", borderRadius: "10px", fontSize: "0.8rem", fontWeight: 800, cursor: "pointer", width: "fit-content" }}
                    >
                      Start Uploading Files
                    </button>
                  )}

                  {uploadStatus === "uploading" && (
                    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", fontWeight: 700 }}>
                        <span>Uploading pages...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div style={{ width: "100%", height: "6px", background: "rgba(255,255,255,0.1)", borderRadius: "3px", overflow: "hidden" }}>
                        <div style={{ width: `${uploadProgress}%`, height: "100%", background: "#3b82f6", transition: "width 0.2s" }} />
                      </div>
                    </div>
                  )}

                  {uploadStatus === "success" && (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#10b981", fontWeight: 700, fontSize: "0.85rem", padding: "12px", background: "rgba(16, 185, 129, 0.1)", borderRadius: "10px" }}>
                      <CheckCircle size={18} />
                      Stitched {uploadedPages.length} panels successfully!
                    </div>
                  )}

                  {uploadStatus === "error" && (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#ef4444", fontWeight: 700, fontSize: "0.85rem", padding: "12px", background: "rgba(239, 68, 68, 0.1)", borderRadius: "10px" }}>
                      <AlertCircle size={18} />
                      {errorMessage}
                    </div>
                  )}
                </div>
              ) : (
                // Novel Text Area Content
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
                  <label style={{ fontSize: "0.7rem", color: "#9ca3af", fontWeight: 800, textTransform: "uppercase" }}>Chapter Story Content *</label>
                  <textarea 
                    rows={15}
                    required
                    placeholder="Write or paste your web novel chapter text here..."
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    style={{ background: "#07080a", border: "1px solid #1c1e24", padding: "12px", borderRadius: "12px", color: "#fff", fontSize: "0.9rem", outline: "none", resize: "vertical", fontFamily: "monospace", lineHeight: 1.5 }}
                  />
                </div>
              )}

            </div>
          )}

          {/* Submit Actions */}
          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
            <Link 
              href="/studio"
              style={{ background: "#141620", border: "1px solid #2a2e40", color: "#fff", textDecoration: "none", padding: "12px 24px", borderRadius: "12px", fontSize: "0.85rem", fontWeight: 800, display: "flex", alignItems: "center" }}
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={createChapterMutation.isLoading || uploadStatus === "uploading"}
              style={{ background: "#10b981", border: "none", color: "#fff", padding: "12px 28px", borderRadius: "12px", fontSize: "0.85rem", fontWeight: 800, cursor: "pointer", opacity: (createChapterMutation.isLoading || uploadStatus === "uploading") ? 0.5 : 1 }}
            >
              {createChapterMutation.isLoading ? "Publishing..." : "Publish Episode"}
            </button>
          </div>

        </form>
      </main>

    </div>
  );
}
