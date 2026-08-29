"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Lock } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.updateUser({
        password: password,
      });

      if (resetError) {
        throw resetError;
      }

      setSuccess(true);
      alert("Password updated successfully!");
      setTimeout(() => {
        router.push("/auth");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#08090c",
      backgroundImage: "radial-gradient(circle at 50% 50%, rgba(37, 99, 235, 0.12) 0%, transparent 65%)",
      fontFamily: "var(--font-sans, sans-serif)",
      color: "#ffffff",
      padding: "1.5rem",
      boxSizing: "border-box"
    }}>
      <div style={{
        width: "100%",
        maxWidth: "380px",
        padding: "2.5rem 2rem",
        borderRadius: "20px",
        background: "rgba(20, 21, 26, 0.75)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        boxShadow: "0 15px 35px rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        boxSizing: "border-box"
      }}>
        <div style={{
          width: "48px",
          height: "48px",
          borderRadius: "12px",
          background: "rgba(37, 99, 235, 0.15)",
          border: "1px solid rgba(37, 99, 235, 0.25)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          marginBottom: "1rem"
        }}>
          <Lock size={20} className="text-blue-500" />
        </div>

        <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.5rem", textAlign: "center" }}>
          Reset Password
        </h2>
        <p style={{ fontSize: "0.8rem", color: "var(--text-dark-muted, #8a8d98)", marginBottom: "1.5rem", textAlign: "center" }}>
          Enter a new, secure password for your Panelva account.
        </p>

        {error && (
          <div style={{
            width: "100%",
            padding: "0.75rem",
            borderRadius: "10px",
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            color: "#f87171",
            fontSize: "0.8rem",
            marginBottom: "1rem",
            boxSizing: "border-box"
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            width: "100%",
            padding: "0.75rem",
            borderRadius: "10px",
            backgroundColor: "rgba(34, 197, 94, 0.1)",
            border: "1px solid rgba(34, 197, 94, 0.2)",
            color: "#4ade80",
            fontSize: "0.8rem",
            marginBottom: "1rem",
            boxSizing: "border-box"
          }}>
            Password updated successfully! Redirecting...
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ width: "100%", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-dark-muted, #8a8d98)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              New Password
            </label>
            <input
              type="password"
              placeholder="Min 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading || success}
              style={{
                width: "100%",
                boxSizing: "border-box",
                borderRadius: "10px",
                background: "rgba(13, 14, 18, 0.6)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                padding: "0.75rem 1rem",
                color: "#fff",
                fontSize: "0.85rem",
                outline: "none"
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-dark-muted, #8a8d98)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Confirm Password
            </label>
            <input
              type="password"
              placeholder="Repeat password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading || success}
              style={{
                width: "100%",
                boxSizing: "border-box",
                borderRadius: "10px",
                background: "rgba(13, 14, 18, 0.6)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                padding: "0.75rem 1rem",
                color: "#fff",
                fontSize: "0.85rem",
                outline: "none"
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading || success}
            style={{
              width: "100%",
              background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
              border: "none",
              color: "#fff",
              padding: "0.75rem",
              borderRadius: "10px",
              fontWeight: 700,
              fontSize: "0.85rem",
              cursor: "pointer",
              marginTop: "0.5rem",
              transition: "opacity 0.2s"
            }}
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
