import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export * from "@prisma/client";

export enum Role {
  USER = "USER",
  CREATOR = "CREATOR",
  ADMIN = "ADMIN",
  MASTER_ADMIN = "MASTER_ADMIN",
}

export enum CreatorType {
  ARTIST = "ARTIST",
  NOVELIST = "NOVELIST",
  WRITER = "WRITER",
  STUDIO = "STUDIO",
}

export enum SeriesType {
  COMIC = "COMIC",
  NOVEL = "NOVEL",
}

export enum Tier {
  FREE = "FREE",
  AD_SUPPORTED = "AD_SUPPORTED",
  PREMIUM = "PREMIUM",
}

export enum SubscriptionTier {
  NONE = "NONE",
  PLUS = "PLUS",
  PREMIUM = "PREMIUM",
}

export enum Status {
  ONGOING = "ONGOING",
  COMPLETED = "COMPLETED",
  HIATUS = "HIATUS",
}

export enum ApplicationStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  DENIED = "DENIED",
}

export enum TransactionType {
  RECHARGE = "RECHARGE",
  GIFT_SENT = "GIFT_SENT",
  GIFT_RECEIVED = "GIFT_RECEIVED",
  PREMIUM_ACCESS = "PREMIUM_ACCESS",
  REDEEM_CODE = "REDEEM_CODE",
}
