"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface DashboardGuardProps {
  children: React.ReactNode;
}

export default function DashboardGuard({ children }: DashboardGuardProps) {
  const router = useRouter();
  const { isAuthenticated, profileComplete, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated) {
      router.replace("/login");
    } else if (!profileComplete) {
      // User is logged in but hasn't completed their profile yet
      router.replace("/onboarding?notice=incomplete");
    }
  }, [isAuthenticated, profileComplete, loading, router]);

  if (loading) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-3 bg-[#0a0b10]">
        <Loader2 className="w-8 h-8 text-[#F8B4C8] animate-spin" />
        <p className="text-sm text-zinc-400 font-medium">Verifying access...</p>
      </main>
    );
  }

  if (!isAuthenticated || !profileComplete) {
    return null;
  }

  return <>{children}</>;
}
