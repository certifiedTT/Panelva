"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { trpc } from "../lib/trpc";
import { createClient } from "../utils/supabase/client";

interface UserProfile {
  id: string;
  email: string;
  username: string;
  role: string;
  avatarUrl: string | null;
  wCoinBalance: number;
  creditsBalance?: number;
  createdAt: string | Date;
}

interface AuthContextType {
  user: UserProfile | null;
  role: string; // effective role
  actualRole: string; // actual role (not previewed)
  isLoading: boolean;
  isSignedIn: boolean;
  refetchUser: () => Promise<any>;
  previewRole: string | null;
  setPreviewRole: (role: string) => void;
  clearPreviewRole: () => void;
  signOut: () => Promise<void>;
}


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [previewRole, setPreviewRoleState] = useState<string | null>(null);

  // We fetch the profile from the server using tRPC getMe
  const { data: dbUser, isLoading, error, refetch } = (trpc.user.getMe as any).useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedPreview = localStorage.getItem("admin-preview-role");
      if (storedPreview && storedPreview !== "ACTUAL") {
        setPreviewRoleState(storedPreview);
      }
    }
  }, []);

  const actualRole = dbUser?.role || "USER";
  const isSignedIn = !!dbUser;

  // Compute effective role (allow MASTER_ADMIN to preview)
  const role = (previewRole && actualRole === "MASTER_ADMIN") ? previewRole : actualRole;

  const setPreviewRole = (newRole: string) => {
    if (actualRole !== "MASTER_ADMIN") return;
    if (newRole === "ACTUAL") {
      clearPreviewRole();
      return;
    }
    localStorage.setItem("admin-preview-role", newRole);
    setPreviewRoleState(newRole);
    // Sync to legacy localStorage role for UI components not yet migrated
    localStorage.setItem("panelva_role", newRole);
    window.dispatchEvent(new Event("panelva_user_update"));
  };

  const clearPreviewRole = () => {
    localStorage.removeItem("admin-preview-role");
    setPreviewRoleState(null);
    localStorage.setItem("panelva_role", actualRole);
    window.dispatchEvent(new Event("panelva_user_update"));
  };

  // Sync basic fields to localStorage for legacy code compatibility
  useEffect(() => {
    if (dbUser) {
      localStorage.setItem("panelva_user", dbUser.username);
      localStorage.setItem("panelva_role", role);
      localStorage.setItem("panelva_actual_role", actualRole);
      // Fire update event for components listening
      window.dispatchEvent(new Event("panelva_user_update"));
    } else if (!isLoading && error) {
      // User is not signed in or session expired
      localStorage.removeItem("panelva_user");
      localStorage.removeItem("panelva_role");
      localStorage.removeItem("panelva_actual_role");
      localStorage.removeItem("admin-preview-role");
      window.dispatchEvent(new Event("panelva_user_update"));
    }
  }, [dbUser, isLoading, error, role, actualRole]);

  const signOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (e) {
      console.error("Failed to sign out from Supabase:", e);
    }
    localStorage.removeItem("panelva_user");
    localStorage.removeItem("panelva_role");
    localStorage.removeItem("panelva_actual_role");
    localStorage.removeItem("admin-preview-role");
    window.dispatchEvent(new Event("panelva_user_update"));
    await refetch();
  };

  return (
    <AuthContext.Provider
      value={{
        user: dbUser || null,
        role,
        actualRole,
        isLoading,
        isSignedIn,
        refetchUser: refetch,
        previewRole,
        setPreviewRole,
        clearPreviewRole,
        signOut,
      }}
    >

      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
