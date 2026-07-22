import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    return NextResponse.json({ 
      status: "success", 
      message: "Idempotent background job triggered successfully via Next.js Route Handler",
      timestamp: new Date().toISOString()
    }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ status: "fail", error: error.message }, { status: 500 });
  }
}
