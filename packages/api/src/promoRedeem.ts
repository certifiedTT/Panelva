import { PrismaClient, TransactionType } from "@panelva/db";

/**
 * Atomically redeems a promo code to prevent double-redemption (race conditions)
 */
export async function redeemPromoCode(
  prisma: PrismaClient,
  userId: string,
  codeString: string
): Promise<{ premiumDays: number }> {
  return await prisma.$transaction(async (tx) => {
    // 1. Fetch code and lock the row for updates (SQLite does not support FOR UPDATE, but in a transaction we query and check state)
    // Note: SQLite serialized/exclusive transactions naturally handle locking. We query raw or standard query.
    // If standard PostgreSQL was used, FOR UPDATE would be queryRaw. For SQLite, standard select is safe in a transaction.
    const promo = await tx.promoCode.findUnique({
      where: { code: codeString }
    });

    if (!promo) {
      throw new Error("PROMO_CODE_NOT_FOUND");
    }

    if (promo.isUsed) {
      throw new Error("PROMO_CODE_ALREADY_USED");
    }

    if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
      throw new Error("PROMO_CODE_EXPIRED");
    }

    // 2. Mark code as used securely using atomic OCC updates
    const updatedPromo = await tx.promoCode.updateMany({
      where: { 
        id: promo.id,
        isUsed: false // Ensure it hasn't been flipped by a concurrent request
      },
      data: {
        isUsed: true,
        usedById: userId,
      },
    });

    if (updatedPromo.count === 0) {
      throw new Error("PROMO_CODE_ALREADY_USED");
    }

    // 2.1 Update User subscription state
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + promo.premiumDays);
    await tx.user.update({
      where: { id: userId },
      data: {
        subscription: promo.tierGranted,
        subscriptionExpiresAt: expiryDate,
        isPromotionalSubscription: true,
      },
    });

    // 3. Record redemption
    await tx.redemption.create({
      data: {
        userId: userId,
        codeId: promo.id,
      },
    });

    // 4. Record Transaction History
    await tx.transaction.create({
      data: {
        userId: userId,
        amountCoins: 0,
        type: TransactionType.REDEEM_CODE,
        description: `Redeemed promo code for ${promo.premiumDays} days of ${promo.tierGranted} access`,
      },
    });

    return {
      premiumDays: promo.premiumDays,
    };
  });
}
