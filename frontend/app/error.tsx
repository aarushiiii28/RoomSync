"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import Navbar from "@/components/layout/Navbar";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // We can log the error to an error reporting service here
    console.error("Caught by Error Boundary:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col bg-[#0F1117]">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center z-10 relative">
        {/* Background glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-[120px] pointer-events-none opacity-20"
          style={{ background: "#D97870" }}
        />

        <div className="bg-white/5 border border-white/10 backdrop-blur-xl p-8 sm:p-12 rounded-3xl shadow-2xl max-w-md w-full relative z-10 border-t-white/20">
          <div className="w-16 h-16 bg-[#D97870]/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle size={32} className="text-[#D97870]" />
          </div>
          
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3 tracking-tight font-sans">
            Oops! Something went wrong
          </h1>
          
          <p className="text-gray-400 mb-8 text-[15px] leading-relaxed">
            We encountered an unexpected issue while loading this page. 
            Don&apos;t worry, your data is safe.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => reset()}
              className="flex-1 flex items-center justify-center gap-2 h-12 bg-white/10 hover:bg-white/15 text-white rounded-xl font-semibold transition-all duration-200 border border-white/10"
            >
              <RotateCcw size={18} />
              Try again
            </button>
            <Link
              href="/dashboard"
              className="flex-1 flex items-center justify-center gap-2 h-12 bg-[#D97870] hover:bg-[#C9605A] text-white rounded-xl font-semibold transition-all duration-200 shadow-[0_0_20px_rgba(217,120,112,0.3)]"
            >
              <Home size={18} />
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
