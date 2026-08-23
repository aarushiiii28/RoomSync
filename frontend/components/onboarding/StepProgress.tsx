import React from "react";
import { Check } from "lucide-react";

export interface StepInfo {
  number: number;
  title: string;
  shortTitle: string;
}

interface StepProgressProps {
  currentStep: number;
  totalSteps?: number;
  steps: StepInfo[];
  onStepClick?: (stepNumber: number) => void;
}

export default function StepProgress({
  currentStep,
  steps,
  onStepClick,
}: StepProgressProps) {
  return (
    <div className="relative py-2">
      {/* Connecting Vertical Track Line */}
      <div className="absolute left-[11px] top-4 bottom-4 w-[1.5px] bg-white/25 pointer-events-none" />

      <div className="space-y-8 relative">
        {steps.map((s) => {
          const isCompleted = s.number < currentStep;
          const isCurrent = s.number === currentStep;
          const isClickable = isCompleted && onStepClick;

          return (
            <div
              key={s.number}
              onClick={() => isClickable && onStepClick(s.number)}
              className={`
                flex items-center gap-4 group select-none transition-all duration-200
                ${isClickable ? "cursor-pointer" : isCurrent ? "cursor-default" : "cursor-default opacity-85"}
              `}
            >
              {/* Node Indicator */}
              <div className="relative z-10 w-6 h-6 flex items-center justify-center shrink-0">
                {isCurrent ? (
                  // Active Step: Thick white ring around dark slate center (matching reference image)
                  <div className="w-5 h-5 rounded-full border-[3px] border-white bg-[#494F66] shadow-sm" />
                ) : isCompleted ? (
                  // Completed Step: Filled dot with subtle check or solid circle
                  <div className="w-3 h-3 rounded-full bg-[#8E95AF] group-hover:bg-white transition-colors flex items-center justify-center">
                    <Check size={8} className="text-[#494F66] hidden group-hover:block" strokeWidth={3} />
                  </div>
                ) : (
                  // Upcoming Step: Solid muted slate-lavender circle
                  <div className="w-3 h-3 rounded-full bg-[#8E95AF]" />
                )}
              </div>

              {/* Step Label */}
              <span
                className={`
                  text-[15px] leading-tight transition-colors duration-200 tracking-wide
                  ${
                    isCurrent
                      ? "text-white font-semibold"
                      : isCompleted
                      ? "text-[#9CA2BA] font-medium group-hover:text-white"
                      : "text-[#9CA2BA] font-medium"
                  }
                `}
              >
                {s.title}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
