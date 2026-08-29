"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CreatorRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/studio");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#07080a] flex items-center justify-center text-gray-400 font-sans">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold tracking-wider uppercase text-purple-400">Redirecting to Creator Studio...</p>
      </div>
    </div>
  );
}
