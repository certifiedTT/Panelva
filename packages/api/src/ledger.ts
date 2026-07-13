import { prisma } from "@panelva/db";

/**
 * Calculates a user's current coin balance by summing up all historical ledger entries.
 * Derived strictly from the immutable double-entry ledger.
 */
export async function getUserBalance(userId: string, txClient?: any): Promise<number> {
  const client = txClient || prisma;

  // 1. Sum coins received
  const receivedResult = await client.coinLedger.aggregate({
    where: { destinationUserId: userId },
    _sum: { amount: true },
  });

  // 2. Sum coins sent
  const sentResult = await client.coinLedger.aggregate({
    where: { sourceUserId: userId },
    _sum: { amount: true },
  });

  const received = receivedResult._sum.amount || 0;
  const sent = sentResult._sum.amount || 0;

  return received - sent;
}

/**
 * Creates a ledger entry representing coin flow and atomically updates user balance caches.
 */
export async function createLedgerEntry(
  tx: any,
  sourceUserId: string | null,
  destinationUserId: string | null,
  amount: number,
  type: string,
  description?: string,
  transactionId?: string
): Promise<any> {
  if (amount <= 0) {
    throw new Error("Ledger error: Transaction amount must be positive");
  }

  const txnId = transactionId || undefined;

  // 1. Append the record to CoinLedger
  const entry = await tx.coinLedger.create({
    data: {
      transactionId: txnId,
      sourceUserId,
      destinationUserId,
      amount,
      type,
      description,
    },
  });

  // 2. Update source user cached wCoinBalance if applicable
  if (sourceUserId) {
    const sourceBalance = await getUserBalance(sourceUserId, tx);
    await tx.user.update({
      where: { id: sourceUserId },
      data: { wCoinBalance: sourceBalance },
    });
  }

  // 3. Update destination user cached wCoinBalance if applicable
  if (destinationUserId) {
    const destBalance = await getUserBalance(destinationUserId, tx);
    await tx.user.update({
      where: { id: destinationUserId },
      data: { wCoinBalance: destBalance },
    });
  }

  return entry;
}

/**
 * Atomically execute a gift transaction between two users.
 */
export async function sendGift(
  sourceUserId: string,
  destinationUserId: string,
  amount: number,
  description?: string
): Promise<any> {
  return await prisma.$transaction(async (tx) => {
    // 1. Verify source user exists
    const sourceUser = await tx.user.findUnique({ where: { id: sourceUserId } });
    if (!sourceUser) {
      throw new Error("Source user profile not active");
    }

    // 2. Verify destination user exists
    const destUser = await tx.user.findUnique({ where: { id: destinationUserId } });
    if (!destUser) {
      throw new Error("Destination user profile not active");
    }

    // 3. Compute source user's balance from the ledger to prevent overdraft/race conditions
    const balance = await getUserBalance(sourceUserId, tx);
    if (balance < amount) {
      throw new Error("INSUFFICIENT_FUNDS");
    }

    // 4. Create ledger entries atomically
    const entry = await createLedgerEntry(
      tx,
      sourceUserId,
      destinationUserId,
      amount,
      "GIFT_SENT",
      description || `Gifted ${amount} coins`
    );

    return entry;
  });
}

/**
 * Atomically recharges a user's account with coins.
 */
export async function rechargeCoins(
  userId: string,
  amountCoins: number,
  amountUsd: number
): Promise<any> {
  return await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error("User profile not active");
    }

    // Create recharge ledger entry
    const entry = await createLedgerEntry(
      tx,
      null, // Recharge comes from system/external
      userId,
      amountCoins,
      "RECHARGE",
      `Recharged account with ${amountCoins} coins for $${(amountUsd / 100).toFixed(2)} USD`
    );

    // Also record standard transaction logs for legacy queries
    await tx.transaction.create({
      data: {
        userId,
        amountCoins,
        amountUsd,
        type: "RECHARGE",
        description: `Recharged account with ${amountCoins} coins for $${(amountUsd / 100).toFixed(2)} USD`,
      },
    });

    return entry;
  });
}
