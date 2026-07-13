import { describe, it, expect } from "vitest";
import { calculatePayoutSplit } from "./payoutSplit";
import { Prisma } from "@panelva/db";

describe("calculatePayoutSplit", () => {
  it("splits WCoin values correctly minus the 25% platform cut", () => {
    const recipients = [
      { userId: "user-1", shareRatio: new Prisma.Decimal(50.00) },
      { userId: "user-2", shareRatio: new Prisma.Decimal(50.00) },
    ];
    const result = calculatePayoutSplit(100, recipients);
    expect(result).toHaveLength(2);
    expect(result[0].amountUsd).toBe(75);
    expect(result[1].amountUsd).toBe(75);
  });

  it("returns empty array when there are no recipients", () => {
    const result = calculatePayoutSplit(100, []);
    expect(result).toHaveLength(0);
  });

  it("distributes cents without any rounding mismatch or loss/gain of cents", () => {
    const recipients = [
      { userId: "user-1", shareRatio: new Prisma.Decimal(50.00) },
      { userId: "user-2", shareRatio: new Prisma.Decimal(50.00) },
    ];
    const result = calculatePayoutSplit(10, recipients);
    expect(result).toHaveLength(2);
    // 10 WCoins * 0.75 * 2 = 15 cents.
    // 50% split should give 8 cents and 7 cents respectively, summing to exactly 15 cents.
    const totalDistributed = result[0].amountUsd + result[1].amountUsd;
    expect(totalDistributed).toBe(15);
    expect(result[0].amountUsd).toBe(8);
    expect(result[1].amountUsd).toBe(7);
  });
});
