import { NextResponse } from "next/server";
import { runChapterLifecycleJob } from "@panelva/api/src/workers/chapterLifecycleWorker";

export async function POST(req: Request) {
  try {
    const processed = await runChapterLifecycleJob();
    return NextResponse.json({ status: "success", processed });
  } catch (error: any) {
    return NextResponse.json({ status: "error", error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const processed = await runChapterLifecycleJob();
    return NextResponse.json({ status: "success", processed });
  } catch (error: any) {
    return NextResponse.json({ status: "error", error: error.message }, { status: 500 });
  }
}
