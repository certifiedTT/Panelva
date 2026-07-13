"use client";

import Link from "next/link";
import { useState } from "react";

export default function CreatorApplyPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("iseniyijude@gmail.com");
  const [role, setRole] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [fileUploaded, setFileUploaded] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      alert("You must agree to the Terms of Use and Content Guidelines!");
      return;
    }
    alert(`Application submitted successfully for ${name || "Anonymous"}!`);
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--dark-bg)", color: "var(--text-dark)", fontFamily: "var(--font-sans)" }}>
      
      {/* Main Content Layout */}
      <div style={{ display: "flex", maxWidth: "1200px", margin: "0 auto", padding: "4rem 2rem", gap: "4rem", alignItems: "center", justifyContent: "space-between" }}>
        
        {/* Left Column */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Back Button */}
          <Link href="/" style={{ color: "var(--text-dark-muted)", textDecoration: "none", display: "flex", alignItems: "center", gap: "8px", fontSize: "0.9rem", fontWeight: 600 }}>
            <span>←</span> Back
          </Link>

          {/* Spark Icon Wrapper */}
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", backgroundColor: "var(--primary-alpha)", display: "flex", justifyContent: "center", alignItems: "center" }}>
            <span style={{ fontSize: "1.5rem", color: "var(--primary)" }}>✦</span>
          </div>

          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "3.25rem", fontWeight: 800, lineHeight: 1.1, margin: 0, letterSpacing: "-0.02em" }}>
            Share your <span style={{ color: "var(--secondary)" }}>stories</span> with the world.
          </h1>

          <p style={{ color: "var(--text-dark-muted)", fontSize: "1rem", lineHeight: 1.6, margin: 0 }}>
            Join the Panelva creative community. Whether you're an author, artist, or a full studio, we provide the tools to build your audience and earn from your craft.
          </p>

          {/* Value Props */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", marginTop: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "#111216", border: "1px solid var(--dark-border)", display: "flex", justifyContent: "center", alignItems: "center" }}>
                🌐
              </div>
              <div>
                <strong style={{ display: "block", fontSize: "0.95rem" }}>Global Reach</strong>
                <span style={{ color: "var(--text-dark-muted)", fontSize: "0.85rem" }}>Connect with readers across continents instantly.</span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "#111216", border: "1px solid var(--dark-border)", display: "flex", justifyContent: "center", alignItems: "center" }}>
                ⚡
              </div>
              <div>
                <strong style={{ display: "block", fontSize: "0.95rem" }}>Fast Uploads</strong>
                <span style={{ color: "var(--text-dark-muted)", fontSize: "0.85rem" }}>Optimized pipelines for high-resolution chapters.</span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "#111216", border: "1px solid var(--dark-border)", display: "flex", justifyContent: "center", alignItems: "center" }}>
                🛠️
              </div>
              <div>
                <strong style={{ display: "block", fontSize: "0.95rem" }}>Creator Tools</strong>
                <span style={{ color: "var(--text-dark-muted)", fontSize: "0.85rem" }}>Advanced scheduling and team management.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Form Card) */}
        <div style={{ flex: 1, maxWidth: "520px", width: "100%" }}>
          <div style={{ backgroundColor: "#08090c", borderRadius: "24px", border: "1px solid var(--dark-border)", overflow: "hidden", boxShadow: "0 20px 40px rgba(0,0,0,0.5)" }}>
            
            {/* Header portion of the card */}
            <div style={{ backgroundColor: "var(--primary)", padding: "2.5rem 2rem", color: "#fff" }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 700, margin: "0 0 0.5rem 0" }}>Apply Now</h2>
              <p style={{ margin: 0, opacity: 0.85, fontSize: "0.9rem", lineHeight: 1.4 }}>
                Fill out the form below to get started. Our team reviews all applications within 3-5 business days.
              </p>
            </div>

            {/* Form body */}
            <form onSubmit={handleSubmit} style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              
              {/* Form Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#fff", marginBottom: "8px" }}>Creator Name</label>
                  <input 
                    type="text" 
                    placeholder="Your public identity"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ width: "100%", background: "#111216", border: "1px solid var(--dark-border)", padding: "12px", borderRadius: "8px", color: "#fff", boxSizing: "border-box", outline: "none" }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#fff", marginBottom: "8px" }}>Contact Email</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ width: "100%", background: "#111216", border: "1px solid var(--dark-border)", padding: "12px", borderRadius: "8px", color: "#fff", boxSizing: "border-box", outline: "none" }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#fff", marginBottom: "8px" }}>Primary Role</label>
                  <select 
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    style={{ width: "100%", background: "#111216", border: "1px solid var(--dark-border)", padding: "12px", borderRadius: "8px", color: "#fff", boxSizing: "border-box", outline: "none" }}
                    required
                  >
                    <option value="">Select your role</option>
                    <option value="ARTIST">Artist / Comic Artist</option>
                    <option value="NOVELIST">Novelist</option>
                    <option value="WRITER">Author / Writer</option>
                    <option value="STUDIO">Studio production entity</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#fff", marginBottom: "8px" }}>Portfolio (Optional)</label>
                  <input 
                    type="url" 
                    placeholder="https://..."
                    value={portfolio}
                    onChange={(e) => setPortfolio(e.target.value)}
                    style={{ width: "100%", background: "#111216", border: "1px solid var(--dark-border)", padding: "12px", borderRadius: "8px", color: "#fff", boxSizing: "border-box", outline: "none" }}
                  />
                </div>
              </div>

              {/* Sample Work Upload box */}
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#fff", marginBottom: "8px" }}>Sample Work</label>
                <div 
                  onClick={() => setFileUploaded(true)}
                  style={{ border: "2px dashed var(--dark-border)", borderRadius: "12px", padding: "2rem", textAlign: "center", backgroundColor: "#08090c", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}
                >
                  <span style={{ fontSize: "2rem" }}>📤</span>
                  <strong style={{ fontSize: "0.9rem" }}>{fileUploaded ? "File attached!" : "Upload your best work"}</strong>
                  <span style={{ color: "var(--text-dark-muted)", fontSize: "0.75rem" }}>PNG, JPG, or GIF up to 10MB</span>
                </div>
              </div>

              {/* Consent checkbox */}
              <div style={{ display: "flex", gap: "12px", alignItems: "start", background: "#060709", border: "1px solid var(--dark-border)", padding: "1rem", borderRadius: "12px" }}>
                <input 
                  type="checkbox" 
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  style={{ marginTop: "4px", cursor: "pointer" }}
                  required
                />
                <span style={{ fontSize: "0.75rem", color: "var(--text-dark-muted)", lineHeight: 1.4 }}>
                  I agree to the Panelva <span style={{ color: "var(--secondary)", cursor: "pointer", fontWeight: 600 }}>Terms of Use</span> and <span style={{ color: "var(--secondary)", cursor: "pointer", fontWeight: 600 }}>Content Guidelines</span>. I confirm that I own all rights to the content I intend to publish.
                </span>
              </div>

              {/* Submit button */}
              <button 
                type="submit"
                style={{ 
                  background: "var(--primary)", border: "none", color: "#fff", padding: "14px", borderRadius: "8px", 
                  fontWeight: 700, fontSize: "1rem", cursor: "pointer", marginTop: "0.5rem",
                  boxShadow: "0 4px 15px rgba(59, 130, 246, 0.4)", transition: "background-color 0.2s"
                }}
              >
                Submit Application
              </button>

            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
