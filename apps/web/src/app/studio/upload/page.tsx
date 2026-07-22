"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { UploadCloud, CheckCircle, AlertCircle, File, ArrowLeft } from "lucide-react";

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB

export default function StudioUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setUploadStatus("idle");
      setUploadProgress(0);
      setErrorMessage("");
    }
  };

  const uploadFile = async () => {
    if (!file) return;

    setUploadStatus("uploading");
    setUploadProgress(0);
    setErrorMessage("");

    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

    try {
      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        const formData = new FormData();
        formData.append("chunk", chunk);
        formData.append("filename", file.name);
        formData.append("chunkIndex", chunkIndex.toString());
        formData.append("totalChunks", totalChunks.toString());

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Upload failed at chunk ${chunkIndex}`);
        }

        const progress = Math.round(((chunkIndex + 1) / totalChunks) * 100);
        setUploadProgress(progress);
      }

      setUploadStatus("success");
    } catch (error: any) {
      console.error(error);
      setUploadStatus("error");
      setErrorMessage(error.message || "An error occurred during upload.");
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-color)", color: "var(--text-color)" }}>
      
      {/* Header */}
      <header style={{ height: "64px", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", padding: "0 2rem", background: "var(--panel-color)", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Link href="/studio" style={{ color: "var(--text-muted-color)", textDecoration: "none", display: "flex", alignItems: "center" }} className="hover:text-white">
            <ArrowLeft size={20} />
          </Link>
          <h1 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800 }}>Upload New Episode</h1>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, padding: "2rem", display: "flex", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: "600px", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          <div style={{ background: "var(--panel-color)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem", alignItems: "center", textAlign: "center" }}>
            
            <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "rgba(124, 58, 237, 0.15)", display: "flex", justifyContent: "center", alignItems: "center", color: "#8b5cf6" }}>
              <UploadCloud size={32} />
            </div>

            <div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "0 0 8px 0" }}>Upload Master File</h2>
              <p style={{ color: "var(--text-muted-color)", margin: 0, fontSize: "0.95rem" }}>
                Select a high-resolution PDF or ZIP file containing your comic pages. We support files up to 2GB.
              </p>
            </div>

            <div 
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: "100%",
                padding: "2rem",
                border: "2px dashed var(--border-color)",
                borderRadius: "12px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "12px",
                cursor: uploadStatus === "uploading" ? "not-allowed" : "pointer",
                background: "rgba(255,255,255,0.02)",
                transition: "all 0.2s ease-in-out"
              }}
              className={uploadStatus !== "uploading" ? "hover:border-purple-500 hover:bg-purple-900/10" : ""}
            >
              {file ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                  <File size={32} color="#a78bfa" />
                  <span style={{ fontWeight: 700, fontSize: "1.1rem" }}>{file.name}</span>
                  <span style={{ color: "var(--text-muted-color)", fontSize: "0.85rem" }}>{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontWeight: 700, fontSize: "1.1rem" }}>Click to select a file</span>
                  <span style={{ color: "var(--text-muted-color)", fontSize: "0.85rem" }}>PDF or ZIP</span>
                </div>
              )}
            </div>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileSelect} 
              style={{ display: "none" }} 
              accept=".pdf,.zip"
              disabled={uploadStatus === "uploading"}
            />

            {uploadStatus === "uploading" && (
              <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", fontWeight: 700 }}>
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div style={{ width: "100%", height: "8px", background: "rgba(255,255,255,0.1)", borderRadius: "4px", overflow: "hidden" }}>
                  <div style={{ width: `${uploadProgress}%`, height: "100%", background: "#8b5cf6", transition: "width 0.2s" }} />
                </div>
              </div>
            )}

            {uploadStatus === "success" && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#10b981", fontWeight: 700, padding: "12px", background: "rgba(16, 185, 129, 0.1)", borderRadius: "8px", width: "100%", justifyContent: "center" }}>
                <CheckCircle size={20} />
                Upload completed successfully!
              </div>
            )}

            {uploadStatus === "error" && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#ef4444", fontWeight: 700, padding: "12px", background: "rgba(239, 68, 68, 0.1)", borderRadius: "8px", width: "100%", justifyContent: "center" }}>
                <AlertCircle size={20} />
                {errorMessage}
              </div>
            )}

            <button 
              onClick={uploadFile} 
              disabled={!file || uploadStatus === "uploading" || uploadStatus === "success"}
              style={{
                width: "100%",
                padding: "14px",
                background: (!file || uploadStatus === "uploading" || uploadStatus === "success") ? "rgba(139, 92, 246, 0.3)" : "#7c3aed",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontWeight: 800,
                fontSize: "1rem",
                cursor: (!file || uploadStatus === "uploading" || uploadStatus === "success") ? "not-allowed" : "pointer",
                transition: "background 0.2s"
              }}
            >
              Start Upload
            </button>

          </div>

        </div>
      </main>
    </div>
  );
}
