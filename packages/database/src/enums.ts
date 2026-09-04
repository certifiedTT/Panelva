/**
 * PostgreSQL and Application Enums for Panelva
 * Source of truth for database constraints and client typing.
 */

export enum UserRole {
  MASTER_ADMIN = 'MASTER_ADMIN',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
  CREATOR = 'CREATOR',
  READER = 'READER',
}

export enum SeriesStatus {
  ONGOING = 'ONGOING',
  COMPLETED = 'COMPLETED',
  HIATUS = 'HIATUS',
  COMING_SOON = 'COMING_SOON',
}

export enum SeriesType {
  COMIC = 'COMIC',
  NOVEL = 'NOVEL',
}

export enum ChapterTier {
  FREE = 'FREE',
  AD_UNLOCK = 'AD_UNLOCK',
  PREMIUM = 'PREMIUM',
}

export enum UserSubscription {
  NONE = 'NONE',
  PLUS = 'PLUS',
  PREMIUM = 'PREMIUM',
}

export enum CreatorApplicationType {
  WRITER = 'WRITER',
  ARTIST = 'ARTIST',
  STUDIO = 'STUDIO',
}

export enum CreatorApplicationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum NotificationType {
  FOLLOW = 'FOLLOW',
  LIKE = 'LIKE',
  COMMENT = 'COMMENT',
  SYSTEM = 'SYSTEM',
  PAYOUT = 'PAYOUT',
}

export enum PostType {
  UPDATE = 'UPDATE',
  ARTWORK = 'ARTWORK',
  ANNOUNCEMENT = 'ANNOUNCEMENT',
  POLL = 'POLL',
}

export enum WalletTransactionType {
  PURCHASE = 'PURCHASE',
  CHAPTER_UNLOCK = 'CHAPTER_UNLOCK',
  AD_REWARD = 'AD_REWARD',
  REFUND = 'REFUND',
  GIFT = 'GIFT',
  BONUS = 'BONUS',
}

export enum PayoutStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PAID = 'PAID',
}

export enum SubscriptionPlan {
  PLUS = 'PLUS',
  PREMIUM = 'PREMIUM',
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export enum StudioRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  WRITER = 'WRITER',
  ARTIST = 'ARTIST',
  COLORIST = 'COLORIST',
  LETTERER = 'LETTERER',
  EDITOR = 'EDITOR',
}

export enum ChapterTaskStage {
  SCRIPT = 'SCRIPT',
  SKETCH = 'SKETCH',
  LINEART = 'LINEART',
  COLOR = 'COLOR',
  LETTERING = 'LETTERING',
  REVIEW = 'REVIEW',
  PUBLISH = 'PUBLISH',
}

export enum ChapterTaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW = 'REVIEW',
  DONE = 'DONE',
}

export enum ContractStatus {
  DRAFT = 'DRAFT',
  PENDING_SIGNATURE = 'PENDING_SIGNATURE',
  SIGNED = 'SIGNED',
  TERMINATED = 'TERMINATED',
}

export enum ReportTargetType {
  POST = 'POST',
  COMMENT = 'COMMENT',
  CHAPTER = 'CHAPTER',
  SERIES = 'SERIES',
  USER = 'USER',
}

export enum ReportReason {
  SPAM = 'SPAM',
  HARASSMENT = 'HARASSMENT',
  INAPPROPRIATE_CONTENT = 'INAPPROPRIATE_CONTENT',
  COPYRIGHT = 'COPYRIGHT',
  OTHER = 'OTHER',
}

export enum ReportStatus {
  PENDING = 'PENDING',
  IN_REVIEW = 'IN_REVIEW',
  RESOLVED = 'RESOLVED',
  DISMISSED = 'DISMISSED',
}

export enum ModerationAction {
  NONE = 'NONE',
  WARN = 'WARN',
  REMOVE_CONTENT = 'REMOVE_CONTENT',
  TEMPORARY_BAN = 'TEMPORARY_BAN',
  PERMANENT_BAN = 'PERMANENT_BAN',
}

export enum TicketCategory {
  PAYMENT = 'PAYMENT',
  CREATOR = 'CREATOR',
  BUG = 'BUG',
  ACCOUNT = 'ACCOUNT',
  COPYRIGHT = 'COPYRIGHT',
}

export enum TicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  WAITING_USER = 'WAITING_USER',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export enum CopyrightStatus {
  FILED = 'FILED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  UPHELD_REMOVED = 'UPHELD_REMOVED',
  REJECTED = 'REJECTED',
}



