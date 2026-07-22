import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { chapterId, userId } = await request.json();
    return NextResponse.json({
      status: "success",
      message: `Rewarded video unlock recorded for chapter ${chapterId}`,
      data: { chapterId, userId, unlockedAt: new Date().toISOString() }
    }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ status: "fail", error: error.message }, { status: 500 });
  }
}
