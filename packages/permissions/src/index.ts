import { UserRole, StudioRole } from '@panelva/database';

/**
 * Panelva Enterprise RBAC & Capabilities Matrix
 * Enforces strict role boundaries across Admin, Operations, Moderation, and Studio teams.
 */

// ==========================================
// 1. SYSTEM & ADMIN CONSOLE CAPABILITIES
// ==========================================

export function canAccessFinancials(role: UserRole | string): boolean {
  return role === UserRole.MASTER_ADMIN || role === 'MASTER_ADMIN';
}

export function canViewAuditLogs(role: UserRole | string): boolean {
  return role === UserRole.MASTER_ADMIN || role === 'MASTER_ADMIN';
}

export function canManageUsers(role: UserRole | string): boolean {
  return (
    role === UserRole.MASTER_ADMIN ||
    role === UserRole.ADMIN ||
    role === 'MASTER_ADMIN' ||
    role === 'ADMIN'
  );
}

export function canModerateContent(role: UserRole | string): boolean {
  return (
    role === UserRole.MASTER_ADMIN ||
    role === UserRole.ADMIN ||
    role === UserRole.MODERATOR ||
    role === 'MASTER_ADMIN' ||
    role === 'ADMIN' ||
    role === 'MODERATOR'
  );
}

export function canManageCreatorApplications(role: UserRole | string): boolean {
  return (
    role === UserRole.MASTER_ADMIN ||
    role === UserRole.ADMIN ||
    role === 'MASTER_ADMIN' ||
    role === 'ADMIN'
  );
}

export function canManageSupportTickets(role: UserRole | string): boolean {
  return (
    role === UserRole.MASTER_ADMIN ||
    role === UserRole.ADMIN ||
    role === UserRole.MODERATOR ||
    role === 'MASTER_ADMIN' ||
    role === 'ADMIN' ||
    role === 'MODERATOR'
  );
}

// ==========================================
// 2. STUDIO COLLABORATION CAPABILITIES
// ==========================================

export function canManageStudioTeam(studioRole: StudioRole | string): boolean {
  return (
    studioRole === StudioRole.OWNER ||
    studioRole === StudioRole.ADMIN ||
    studioRole === 'OWNER' ||
    studioRole === 'ADMIN'
  );
}

export function canUploadArtwork(studioRole: StudioRole | string): boolean {
  return (
    studioRole === StudioRole.OWNER ||
    studioRole === StudioRole.ADMIN ||
    studioRole === StudioRole.ARTIST ||
    studioRole === StudioRole.COLORIST ||
    studioRole === StudioRole.LETTERER ||
    studioRole === 'OWNER' ||
    studioRole === 'ADMIN' ||
    studioRole === 'ARTIST' ||
    studioRole === 'COLORIST' ||
    studioRole === 'LETTERER'
  );
}

export function canPublishChapter(studioRole: StudioRole | string): boolean {
  return (
    studioRole === StudioRole.OWNER ||
    studioRole === StudioRole.ADMIN ||
    studioRole === StudioRole.EDITOR ||
    studioRole === 'OWNER' ||
    studioRole === 'ADMIN' ||
    studioRole === 'EDITOR'
  );
}

export function canDeleteStudioSeries(studioRole: StudioRole | string): boolean {
  return studioRole === StudioRole.OWNER || studioRole === 'OWNER';
}
