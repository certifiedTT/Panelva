"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { LogIn, Lock, Mail, User } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { trpc } from "../../lib/trpc";
import { createClient } from "@/utils/supabase/client";

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams?.get("next") || "/";
  const [isSignIn, setIsSignIn] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [usernameError, setUsernameError] = useState("");

  const validateEmail = (emailStr: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr);
  };

  // Real-time username validation query
  const { data: validationResult } = (trpc.user.validateUsername as any).useQuery(
    { username },
    { enabled: !isSignIn && username.length >= 3 }
  );

  // Lazy query to resolve email by username during sign-in
  const { refetch: fetchEmail } = (trpc.user.getEmailByUsername as any).useQuery(
    { username: email },
    { enabled: false }
  );

  useEffect(() => {
    if (isSignIn) {
      setUsernameError("");
      return;
    }
    if (username.length === 0) {
      setUsernameError("");
    } else if (username.length < 3) {
      setUsernameError("Username must be at least 3 characters.");
    } else if (validationResult) {
      if (!validationResult.valid) {
        setUsernameError((validationResult as any).message || "Username is invalid.");
      } else {
        setUsernameError("");
      }
    }
  }, [username, validationResult, isSignIn]);

  const handleSignIn = async () => {
    if (!email || !password) {
      setError("Please enter both email/username and password.");
      return;
    }

    let authEmail = email;
    let displayUser = "";

    const isEmailInput = email.includes("@");

    if (isEmailInput) {
      if (!validateEmail(email)) {
        setError("Please enter a valid email address.");
        return;
      }
      authEmail = email;
      displayUser = email.split("@")[0];
    } else {
      // Input is a username, resolve email via tRPC
      setError("");
      try {
        const result = await fetchEmail();
        if (result.data && result.data.email) {
          authEmail = result.data.email;
          displayUser = email;
        } else {
          setError("User with this username not found.");
          return;
        }
      } catch (err) {
        setError("Account lookup failed. Please try again.");
        return;
      }
    }

    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authEmail, password })
      });

      const resJson = await response.json();
      if (response.status !== 200 || resJson.status === "fail") {
        setError(resJson.error || "Authentication failed.");
        return;
      }

      // Success
      const actualUsername = resJson.username || displayUser;
      const actualRole = resJson.role || "USER";

      localStorage.setItem("panelva_user", actualUsername);
      localStorage.setItem("panelva_role", actualRole);

      window.dispatchEvent(new Event("panelva_user_update"));
      alert(`Successfully signed in as @${actualUsername}!`);
      router.push(nextParam);
    } catch (err) {
      setError("Login request failed. Check server connection.");
    }
  };

  const handleSignUp = async () => {
    if (!email || !password || !username) {
      setError("Please fill in all fields.");
      return;
    }
    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      setError("Password must contain at least one uppercase letter, one lowercase letter, and one number.");
      return;
    }
    if (usernameError) {
      setError("Please resolve the username error first.");
      return;
    }
    setError("");

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, username })
      });

      const resJson = await response.json();
      if (response.status !== 201 || resJson.status === "fail") {
        setError(resJson.error || "Registration failed.");
        return;
      }

      // Success
      localStorage.setItem("panelva_user", username);
      localStorage.setItem("panelva_role", "USER");
      window.dispatchEvent(new Event("panelva_user_update"));

      alert(`Successfully registered as @${username}!`);
      router.push(nextParam);
    } catch (err) {
      setError("Sign up request failed. Check server connection.");
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || "Google Sign-In failed.");
    }
  };

  const handleAppleSignIn = async () => {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "apple",
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || "Apple Sign-In failed.");
    }
  };

  const handleForgotPassword = async () => {
    const recoveryEmail = window.prompt("Enter your email address to receive a password reset link:");
    if (!recoveryEmail) return;
    if (!validateEmail(recoveryEmail)) {
      alert("Please enter a valid email address.");
      return;
    }
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(recoveryEmail, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) throw error;
      alert("Password reset link sent! Check your inbox.");
    } catch (err: any) {
      alert(err.message || "Failed to send password reset email.");
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
        {/* Logo Icon */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "54px",
          height: "54px",
          borderRadius: "14px",
          background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
          marginBottom: "1.2rem",
          boxShadow: "0 8px 20px rgba(37, 99, 235, 0.25)"
        }}>
          <LogIn className="w-6 h-6 text-white" />
        </div>

        {/* Header Title */}
        <h2 style={{
          fontSize: "1.35rem",
          fontWeight: 750,
          color: "#ffffff",
          margin: "0 0 6px 0",
          fontFamily: "var(--font-display, sans-serif)",
          textAlign: "center"
        }}>
          {isSignIn ? "Welcome to Panelva" : "Create an Account"}
        </h2>

        {/* Subtitle */}
        <p style={{
          fontSize: "0.82rem",
          color: "#a1a1aa",
          textAlign: "center",
          margin: "0 0 1.8rem 0",
          lineHeight: 1.4
        }}>
          {isSignIn
            ? "Sign in to unlock free episodes, keep track of bookmarks, and access premium splits."
            : "Sign up to track your library, unlock free episodes, and get creator alerts."
          }
        </p>

        {/* Inputs section */}
        <div style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          marginBottom: "1.2rem"
        }}>
          {/* Username (Sign Up Mode Only) */}
          {!isSignIn && (
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", width: "100%" }}>
              <div style={{ position: "relative", width: "100%" }}>
                <span style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#71717a",
                  display: "flex",
                  alignItems: "center"
                }}>
                  <User className="w-4 h-4" />
                </span>
                <input
                  placeholder="Username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={{
                    width: "100%",
                    background: "#0d0e12",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "10px",
                    color: "#ffffff",
                    padding: "11px 14px 11px 40px",
                    fontSize: "0.88rem",
                    outline: "none",
                    boxSizing: "border-box",
                    transition: "border-color 0.2s"
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = "#2563eb"}
                  onBlur={(e) => e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)"}
                />
              </div>
              {usernameError && (
                <span style={{ fontSize: "0.72rem", color: "#ef4444", alignSelf: "flex-start", paddingLeft: "4px" }}>
                  {usernameError}
                </span>
              )}
            </div>
          )}

          {/* Email or Username Input (Sign In) / Email Address (Sign Up) */}
          <div style={{ position: "relative", width: "100%" }}>
            <span style={{
              position: "absolute",
              left: "14px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#71717a",
              display: "flex",
              alignItems: "center"
            }}>
              <Mail className="w-4 h-4" />
            </span>
            <input
              placeholder={isSignIn ? "Email or Username" : "Email Address"}
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: "100%",
                background: "#0d0e12",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "10px",
                color: "#ffffff",
                padding: "11px 14px 11px 40px",
                fontSize: "0.88rem",
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.2s"
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = "#2563eb"}
              onBlur={(e) => e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)"}
            />
          </div>

          {/* Password Input */}
          <div style={{ position: "relative", width: "100%" }}>
            <span style={{
              position: "absolute",
              left: "14px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#71717a",
              display: "flex",
              alignItems: "center"
            }}>
              <Lock className="w-4 h-4" />
            </span>
            <input
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: "100%",
                background: "#0d0e12",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "10px",
                color: "#ffffff",
                padding: "11px 14px 11px 40px",
                fontSize: "0.88rem",
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.2s"
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = "#2563eb"}
              onBlur={(e) => e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)"}
            />
          </div>

          {/* Error and recovery row */}
          <div style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            alignItems: "stretch"
          }}>
            {error && (
              <div style={{ fontSize: "0.8rem", color: "#ef4444", textAlign: "left" }}>
                {error}
              </div>
            )}
            {isSignIn && (
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#2563eb",
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    padding: 0,
                    fontFamily: "inherit"
                  }}
                >
                  Forgot password?
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Submit button */}
        <button
          onClick={isSignIn ? handleSignIn : handleSignUp}
          style={{
            width: "100%",
            background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
            border: "none",
            color: "#ffffff",
            fontWeight: 700,
            fontSize: "0.92rem",
            padding: "11px",
            borderRadius: "10px",
            cursor: "pointer",
            boxShadow: "0 6px 16px rgba(29, 78, 216, 0.2)",
            transition: "transform 0.2s, brightness 0.2s",
            marginBottom: "1.2rem",
            marginTop: "0.4rem"
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.01)"}
          onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
        >
          {isSignIn ? "Sign In" : "Sign Up"}
        </button>

        {/* Form Mode Toggle */}
        <div style={{ fontSize: "0.8rem", color: "#a1a1aa", textAlign: "center", marginBottom: "0.8rem" }}>
          {isSignIn ? "Don't have an account? " : "Already have an account? "}
          <button
            type="button"
            onClick={() => {
              setIsSignIn(!isSignIn);
              setError("");
              setEmail("");
              setUsername("");
            }}
            style={{
              background: "none",
              border: "none",
              color: "#2563eb",
              fontWeight: 650,
              cursor: "pointer",
              padding: 0,
              fontFamily: "inherit",
              fontSize: "inherit"
            }}
          >
            {isSignIn ? "Sign Up" : "Sign In"}
          </button>
        </div>

        {/* Divider */}
        <div style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          margin: "0.8rem 0"
        }}>
          <div style={{ flex: 1, borderTop: "1px dashed rgba(255, 255, 255, 0.1)" }}></div>
          <span style={{ margin: "0 10px", fontSize: "0.75rem", color: "#71717a" }}>Or continue with</span>
          <div style={{ flex: 1, borderTop: "1px dashed rgba(255, 255, 255, 0.1)" }}></div>
        </div>

        {/* Social logins */}
        <div style={{
          display: "flex",
          gap: "16px",
          width: "100%",
          justifyContent: "center",
          marginTop: "0.6rem"
        }}>
          {/* Google */}
          <button
            onClick={handleGoogleSignIn}
            style={{
              flex: 1,
              height: "44px",
              borderRadius: "10px",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              background: "rgba(255, 255, 255, 0.02)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "background-color 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.06)"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.02)"}
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
              style={{ width: "20px", height: "20px" }}
            />
          </button>

          {/* Apple */}
          <button
            onClick={handleAppleSignIn}
            style={{
              flex: 1,
              height: "44px",
              borderRadius: "10px",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              background: "rgba(255, 255, 255, 0.02)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "background-color 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.06)"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.02)"}
          >
            <img
              src="https://www.svgrepo.com/show/511330/apple-173.svg"
              alt="Apple"
              style={{ width: "20px", height: "20px" }}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
