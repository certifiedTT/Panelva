import * as React from "react";

export const ROLE_BADGE_CONFIG: Record<string, { label: string; bg: string; text: string; fullName: string }> = {
  MASTER_ADMIN: { label: "Admin", bg: "#DC2626", text: "#FFFFFF", fullName: "Master Admin" },
  OPERATIONS_ADMIN: { label: "Ops", bg: "#7C3AED", text: "#FFFFFF", fullName: "Operations Admin" },
  BUSINESS_ADMIN: { label: "Biz", bg: "#059669", text: "#FFFFFF", fullName: "Business Admin" },
  ADMIN: { label: "Admin", bg: "#EA580C", text: "#FFFFFF", fullName: "Admin" },
  MODERATOR: { label: "Mod", bg: "#2563EB", text: "#FFFFFF", fullName: "Moderator" },
  
  // Map other db roles for visual consistency
  FINANCE_ADMIN: { label: "Biz", bg: "#059669", text: "#FFFFFF", fullName: "Business Admin" },
  COMMUNITY_MODERATOR: { label: "Mod", bg: "#2563EB", text: "#FFFFFF", fullName: "Moderator" },
  SAFETY_SPECIALIST: { label: "Safety", bg: "#6B7280", text: "#FFFFFF", fullName: "Trust & Safety Specialist" },
  CUSTOMER_SUPPORT: { label: "Support", bg: "#6B7280", text: "#FFFFFF", fullName: "Customer Support" },
  EDITORIAL_TEAM: { label: "Editorial", bg: "#6B7280", text: "#FFFFFF", fullName: "Editorial Team" },
  MARKETING_MANAGER: { label: "Marketing", bg: "#6B7280", text: "#FFFFFF", fullName: "Marketing Manager" },
  PARTNERSHIP_MANAGER: { label: "Partner", bg: "#6B7280", text: "#FFFFFF", fullName: "Partnership Manager" },
  REGIONAL_ADMIN: { label: "Regional", bg: "#6B7280", text: "#FFFFFF", fullName: "Regional Administrator" },
  CREATOR: { label: "Creator", bg: "#8B5CF6", text: "#FFFFFF", fullName: "Creator" },
};

export default function RoleBadge({ role }: { role: string | null | undefined }) {
  if (!role) return null;
  const config = ROLE_BADGE_CONFIG[role];
  if (!config) return null;
  
  return (
    <span 
      title={config.fullName}
      style={{
        backgroundColor: config.bg,
        color: config.text,
        fontSize: "0.65rem",
        fontWeight: 600,
        textTransform: "uppercase",
        padding: "0.15rem 0.45rem",
        borderRadius: "9999px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        lineHeight: 1,
        letterSpacing: "0.025em",
        cursor: "help",
        border: "1px solid rgba(255, 255, 255, 0.15)",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.2)"
      }}
    >
      {config.label}
    </span>
  );
}
