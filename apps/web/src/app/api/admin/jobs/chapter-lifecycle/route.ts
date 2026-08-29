import { NextResponse } from "next/server";
import { prisma } from "@panelva/db";

export async function POST(request: Request) {
  try {
    const now = new Date();

    // Find all chapters whose early-access/wait-tier drop time has elapsed
    const expiredChapters = await prisma.chapter.findMany({
      where: {
        tier: { in: ["PREMIUM", "AD_SUPPORTED"] },
        waitTierDropAt: {
          lte: now
        }
      }
    });

    let updatedCount = 0;

    if (expiredChapters.length > 0) {
      // Transition expired chapters to FREE tier
      const result = await prisma.chapter.updateMany({
        where: {
          id: { in: expiredChapters.map(c => c.id) }
        },
        data: {
          tier: "FREE",
          waitTierDropAt: null
        }
      });
      updatedCount = result.count;
    }

    return NextResponse.json({ 
      status: "success", 
      message: `Automatic chapter release lifecycle run completed. Released ${updatedCount} chapters to FREE tier.`,
      releasedCount: updatedCount,
      timestamp: new Date().toISOString()
    }, { status: 200 });
  } catch (error: any) {
    console.error("Chapter lifecycle job failed:", error);
    return NextResponse.json({ status: "fail", error: error.message }, { status: 500 });
  }
}
