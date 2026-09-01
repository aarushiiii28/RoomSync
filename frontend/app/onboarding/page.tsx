import React, { Suspense } from "react";
import OnboardingGuard from "@/components/onboarding/OnboardingGuard";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";
import { Loader2 } from "lucide-react";

export default function OnboardingPage() {
  return (
    <OnboardingGuard>
      <main className="min-h-screen w-full flex flex-col bg-[#007599]">
        <Suspense
          fallback={
            <div className="min-h-[400px] flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
              <p className="text-sm text-zinc-300">Loading your profile...</p>
            </div>
          }
        >
          <OnboardingWizard />
        </Suspense>
      </main>
    </OnboardingGuard>
  );
}
