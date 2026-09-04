/**
 * Panelva Server-Side Notification Builders
 * Enforces rule: Notifications are generated server-side. Never generate in UI components.
 */

export interface NotificationPayload {
  title: string;
  message: string;
  type: string;
  linkUrl?: string;
  avatarUrl?: string;
}

export function buildChapterReleaseNotification(params: {
  creatorName: string;
  seriesTitle: string;
  chapterNumber: number;
  chapterTitle: string;
  seriesId: string;
  avatarUrl?: string;
}): NotificationPayload {
  return {
    title: 'New Chapter Released!',
    message: `${params.creatorName} published Episode ${params.chapterNumber}: "${params.chapterTitle}" in ${params.seriesTitle}.`,
    type: 'CHAPTER_RELEASE',
    linkUrl: `/series/${params.seriesId}`,
    avatarUrl: params.avatarUrl,
  };
}

export function buildFollowerNotification(params: {
  followerName: string;
  followerId: string;
  avatarUrl?: string;
}): NotificationPayload {
  return {
    title: 'New Follower',
    message: `${params.followerName} started following your creator profile.`,
    type: 'FOLLOW',
    linkUrl: `/creator/${params.followerId}`,
    avatarUrl: params.avatarUrl,
  };
}

export function buildPayoutNotification(params: {
  amountUsd: number;
  status: 'APPROVED' | 'PAID' | 'REJECTED';
}): NotificationPayload {
  const statusText =
    params.status === 'PAID'
      ? 'has been sent to your payout destination.'
      : params.status === 'APPROVED'
      ? 'has been approved and is being processed.'
      : 'was declined. Please review your account details.';

  return {
    title: `Payout ${params.status}`,
    message: `Your withdrawal request for $${params.amountUsd.toFixed(2)} ${statusText}`,
    type: 'PAYOUT',
    linkUrl: '/creator/revenue',
  };
}

export function buildModerationNotification(params: {
  action: 'WARN' | 'REMOVE_CONTENT' | 'TEMPORARY_BAN';
  reason: string;
}): NotificationPayload {
  const actionText =
    params.action === 'WARN'
      ? 'A warning has been issued for your account regarding:'
      : params.action === 'REMOVE_CONTENT'
      ? 'A reported post or comment was removed due to:'
      : 'Your account has been temporarily restricted due to:';

  return {
    title: 'Trust & Safety Notice',
    message: `${actionText} ${params.reason}`,
    type: 'SYSTEM',
    linkUrl: '/support',
  };
}
