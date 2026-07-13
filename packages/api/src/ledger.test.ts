import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "@panelva/db";
import { getUserBalance, rechargeCoins, sendGift } from "./ledger";

describe("Coin Ledger Double-Entry System", () => {
  let userAId: string;
  let userBId: string;

  beforeAll(async () => {
    // Create test users in the database
    const userA = await prisma.user.create({
      data: {
        email: `test-ledger-a-${Date.now()}@example.com`,
        username: `user_ledger_a_${Date.now()}`,
      },
    });

    const userB = await prisma.user.create({
      data: {
        email: `test-ledger-b-${Date.now()}@example.com`,
        username: `user_ledger_b_${Date.now()}`,
      },
    });

    userAId = userA.id;
    userBId = userB.id;
  });

  it("calculates initial balance as 0", async () => {
    const balance = await getUserBalance(userAId);
    expect(balance).toBe(0);
  });

  it("adds balance correctly via recharge", async () => {
    await rechargeCoins(userAId, 1000, 1000);
    const balance = await getUserBalance(userAId);
    expect(balance).toBe(1000);

    const userProfile = await prisma.user.findUnique({ where: { id: userAId } });
    expect(userProfile?.wCoinBalance).toBe(1000);
  });

  it("processes a gift transaction atomically and updates balances", async () => {
    await sendGift(userAId, userBId, 300, "Support gift");

    const balanceA = await getUserBalance(userAId);
    const balanceB = await getUserBalance(userBId);

    expect(balanceA).toBe(700);
    expect(balanceB).toBe(300);

    const profileA = await prisma.user.findUnique({ where: { id: userAId } });
    const profileB = await prisma.user.findUnique({ where: { id: userBId } });

    expect(profileA?.wCoinBalance).toBe(700);
    expect(profileB?.wCoinBalance).toBe(300);
  });

  it("prevents double-spending / overdrafting", async () => {
    await expect(sendGift(userAId, userBId, 800, "Too expensive")).rejects.toThrow(
      "INSUFFICIENT_FUNDS"
    );

    const balanceA = await getUserBalance(userAId);
    expect(balanceA).toBe(700);
  });
});
