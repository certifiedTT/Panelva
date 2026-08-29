import { UserRole } from "@panelva/db";

export type Permission =
  | "users.view"
  | "users.edit"
  | "users.suspend"
  | "creators.view"
  | "creators.verify"
  | "creators.manage"
  | "applications.review"
  | "series.review"
  | "series.feature"
  | "community.manage"
  | "comments.moderate"
  | "reports.manage"
  | "support.manage"
  | "analytics.view"
  | "finance.view"
  | "finance.manage"
  | "payouts.manage"
  | "promotions.manage"
  | "partnerships.manage"
  | "subscriptions.manage"
  | "fraud.manage"
  | "settings.manage"
  | "admins.manage"
  | "audit.view"
  | "featureflags.manage";

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  MASTER_ADMIN: [
    "users.view", "users.edit", "users.suspend", "creators.view", "creators.verify", "creators.manage",
    "applications.review", "series.review", "series.feature", "community.manage", "comments.moderate",
    "reports.manage", "support.manage", "analytics.view", "finance.view", "finance.manage", "payouts.manage",
    "promotions.manage", "partnerships.manage", "subscriptions.manage", "fraud.manage", "settings.manage",
    "admins.manage", "audit.view", "featureflags.manage"
  ],
  OPERATIONS_ADMIN: [
    "users.view", "creators.view", "creators.manage", "applications.review", "series.review", "series.feature",
    "comments.moderate", "reports.manage", "support.manage", "community.manage", "analytics.view"
  ],
  BUSINESS_ADMIN: [
    "finance.view", "finance.manage", "payouts.manage", "promotions.manage", "partnerships.manage",
    "subscriptions.manage", "fraud.manage", "analytics.view"
  ],
  ADMIN: [
    "creators.verify", "support.manage", "reports.manage", "users.view"
  ],
  MODERATOR: [
    "comments.moderate", "reports.manage", "community.manage"
  ],
  USER: [],
  CREATOR: [],
  FINANCE_ADMIN: [
    "finance.view", "finance.manage", "payouts.manage", "analytics.view"
  ],
  COMMUNITY_MODERATOR: [
    "comments.moderate", "reports.manage", "community.manage"
  ],
  SAFETY_SPECIALIST: [
    "reports.manage", "users.view", "users.suspend", "fraud.manage"
  ],
  CUSTOMER_SUPPORT: [
    "support.manage", "users.view", "reports.manage"
  ],
  EDITORIAL_TEAM: [
    "series.review", "series.feature", "creators.view"
  ],
  MARKETING_MANAGER: [
    "promotions.manage", "analytics.view"
  ],
  PARTNERSHIP_MANAGER: [
    "partnerships.manage", "applications.review", "creators.view"
  ],
  REGIONAL_ADMIN: [
    "users.view", "reports.manage"
  ]
};

export function hasPermission(role: string | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  const permissions = ROLE_PERMISSIONS[role as UserRole];
  if (!permissions) return false;
  return permissions.includes(permission);
}
