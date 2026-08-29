/**
 * roleUtils.ts — Centralized Role Resolution Module
 *
 * Single source of truth for determining user roles across the Panelva platform.
 * Replaces all duplicated getRoleForUser() logic in Header.tsx and admin/page.tsx.
 *
 * Principles:
 * - The database role (stored in localStorage "panelva_role" at login) is the source of truth.
 * - Preview roles are client-side only and never modify the database.
 * - Only MASTER_ADMIN accounts can activate Role Preview mode.
 */

/** All roles that can be previewed by a Master Admin */
export const SUPPORTED_PREVIEW_ROLES = [
  { value: "ACTUAL", label: "Actual Role (Exit Preview)" },
  { value: "USER", label: "Standard User" },
  { value: "CREATOR", label: "Creator" },
  { value: "VERIFIED_CREATOR", label: "Verified Creator" },
  { value: "MASTER_ADMIN", label: "Master Admin" },
  { value: "ADMIN", label: "Admin" },
  { value: "FINANCE_ADMIN", label: "Finance Admin" },
  { value: "COMMUNITY_MODERATOR", label: "Community Moderator" },
  { value: "SAFETY_SPECIALIST", label: "Trust & Safety Specialist" },
  { value: "CUSTOMER_SUPPORT", label: "Customer Support" },
  { value: "EDITORIAL_TEAM", label: "Editorial Team" },
  { value: "MARKETING_MANAGER", label: "Marketing Manager" },
  { value: "PARTNERSHIP_MANAGER", label: "Partnership Manager" },
  { value: "REGIONAL_ADMIN", label: "Regional Administrator" },
  { value: "OPERATIONS_ADMIN", label: "Operations Admin" },
  { value: "BUSINESS_ADMIN", label: "Business Admin" },
  { value: "MODERATOR", label: "Moderator" },
] as const;

/** Human-readable display name for a role value */
export const ROLE_DISPLAY_NAMES: Record<string, string> = {
  USER: "Standard User",
  CREATOR: "Creator",
  VERIFIED_CREATOR: "Verified Creator",
  MASTER_ADMIN: "Master Admin",
  ADMIN: "Admin",
  FINANCE_ADMIN: "Finance Admin",
  COMMUNITY_MODERATOR: "Community Moderator",
  SAFETY_SPECIALIST: "Trust & Safety Specialist",
  CUSTOMER_SUPPORT: "Customer Support",
  EDITORIAL_TEAM: "Editorial Team",
  MARKETING_MANAGER: "Marketing Manager",
  PARTNERSHIP_MANAGER: "Partnership Manager",
  REGIONAL_ADMIN: "Regional Administrator",
  OPERATIONS_ADMIN: "Operations Admin",
  BUSINESS_ADMIN: "Business Admin",
  MODERATOR: "Moderator",
};

const PREVIEW_ROLE_KEY = "admin-preview-role";
const ROLE_KEY = "panelva_role";
const USER_KEY = "panelva_user";

/**
 * Get the user's actual database role stored at login time.
 * This NEVER returns a preview role.
 */
export function getActualRole(): string {
  if (typeof window === "undefined") return "USER";

  const storedRole = localStorage.getItem(ROLE_KEY);
  const storedUser = localStorage.getItem(USER_KEY);

  // If no user is signed in, default to USER
  if (!storedUser || storedUser === "Guest") return "USER";

  // If there's a preview role active, we need to read the actual role
  // which was stored before preview was activated
  const actualRoleBackup = localStorage.getItem("panelva_actual_role");
  if (actualRoleBackup) return actualRoleBackup;

  // Use the stored role from login
  if (storedRole) return storedRole;

  return "USER";
}

/**
 * Get the effective role — the role that should be used for UI rendering.
 * Returns the preview role if preview mode is active AND the actual role is MASTER_ADMIN.
 * Otherwise returns the actual role.
 */
export function getEffectiveRole(): string {
  if (typeof window === "undefined") return "USER";

  const actualRole = getActualRole();
  const previewRole = localStorage.getItem(PREVIEW_ROLE_KEY);

  // Only MASTER_ADMIN can have an active preview
  if (previewRole && previewRole !== "ACTUAL" && actualRole === "MASTER_ADMIN") {
    return previewRole;
  }

  return actualRole;
}

/**
 * Check if the current user is a MASTER_ADMIN based on their actual DB role.
 * Preview role is never considered — this checks the real identity.
 */
export function isMasterAdmin(): boolean {
  return getActualRole() === "MASTER_ADMIN";
}

/**
 * Check if preview mode is currently active.
 */
export function isPreviewActive(): boolean {
  if (typeof window === "undefined") return false;
  const previewRole = localStorage.getItem(PREVIEW_ROLE_KEY);
  return !!(previewRole && previewRole !== "ACTUAL" && isMasterAdmin());
}

/**
 * Get the current preview role value, or null if not in preview mode.
 */
export function getPreviewRole(): string | null {
  if (!isPreviewActive()) return null;
  return localStorage.getItem(PREVIEW_ROLE_KEY);
}

/**
 * Activate a preview role. Only works for MASTER_ADMIN accounts.
 * Backs up the actual role before overriding.
 */
export function setPreviewRole(role: string): void {
  if (typeof window === "undefined") return;
  if (!isMasterAdmin()) return;

  if (role === "ACTUAL") {
    clearPreviewRole();
    return;
  }

  // Back up the actual role before overriding
  const actualRole = getActualRole();
  localStorage.setItem("panelva_actual_role", actualRole);
  localStorage.setItem(PREVIEW_ROLE_KEY, role);

  // Dispatch event so other components re-read role state
  window.dispatchEvent(new Event("panelva_user_update"));
}

/**
 * Deactivate preview mode and restore the actual role.
 */
export function clearPreviewRole(): void {
  if (typeof window === "undefined") return;

  const actualRole = localStorage.getItem("panelva_actual_role");

  localStorage.removeItem(PREVIEW_ROLE_KEY);
  localStorage.removeItem("panelva_actual_role");

  // Restore the actual role to panelva_role
  if (actualRole) {
    localStorage.setItem(ROLE_KEY, actualRole);
  }

  window.dispatchEvent(new Event("panelva_user_update"));
}

/**
 * Get human-readable display name for a role value.
 */
export function getRoleDisplayName(role: string): string {
  return ROLE_DISPLAY_NAMES[role] || role.replace(/_/g, " ");
}

/**
 * Check if a role value represents a creator role (CREATOR or VERIFIED_CREATOR).
 */
export function isCreatorRole(role: string): boolean {
  return role === "CREATOR" || role === "VERIFIED_CREATOR";
}

/**
 * Check if a role value represents an administrative role (not USER or CREATOR).
 */
export function isAdminRole(role: string): boolean {
  return role !== "USER" && role !== "CREATOR" && role !== "VERIFIED_CREATOR" && role !== "Guest";
}
