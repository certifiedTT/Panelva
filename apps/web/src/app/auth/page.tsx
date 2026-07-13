"use client";

import * as React from "react";
import { useState } from "react";
import { LogIn, Lock, Mail, User } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const router = useRouter();
  const [isSignIn, setIsSignIn] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSignIn = () => {
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    
    // Log the user in and write to localStorage
    const displayUser = email.split("@")[0] || "User";
    localStorage.setItem("panelva_user", displayUser);
    window.dispatchEvent(new Event("panelva_user_update"));
    
    alert(`Successfully signed in as ${displayUser}!`);
    router.push("/");
  };

  const handleSignUp = () => {
    if (!email || !password || !username) {
      setError("Please fill in all fields.");
      return;
    }
    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    
    // Log the user in and write to localStorage
    const displayUser = username || email.split("@")[0] || "User";
    localStorage.setItem("panelva_user", displayUser);
    window.dispatchEvent(new Event("panelva_user_update"));
    
    alert(`Successfully registered as ${displayUser}!`);
    router.push("/");
  };

  const handleGoogleSignIn = () => {
    localStorage.setItem("panelva_user", "GoogleUser");
    window.dispatchEvent(new Event("panelva_user_update"));
    alert("Successfully signed in with Google!");
    router.push("/");
  };

  const handleAppleSignIn = () => {
    localStorage.setItem("panelva_user", "AppleUser");
    window.dispatchEvent(new Event("panelva_user_update"));
    alert("Successfully signed in with Apple!");
    router.push("/");
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
          )}

          {/* Email Input */}
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
              placeholder="Email Address"
              type="email"
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
                  onClick={() => alert("Password recovery demo triggered.")}
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
