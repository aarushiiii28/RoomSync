import { UserCheck, ShieldCheck, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Benefit {
  title: string;
  description: string;
  Icon: LucideIcon;
  color: string;
  glow: string;
}

const benefits: Benefit[] = [
  {
    title: "Personalized Matching",
    description: "Matches based on your lifestyle and preferences",
    Icon: UserCheck,
    color: "#a78bfa",
    glow: "rgba(167,139,250,0.55)",
  },
  {
    title: "Privacy First",
    description: "Your data stays private and secure",
    Icon: ShieldCheck,
    color: "#34d399",
    glow: "rgba(52,211,153,0.5)",
  },
  {
    title: "Instant Results",
    description: "Get your compatibility score in seconds",
    Icon: Zap,
    color: "#facc15",
    glow: "rgba(250,204,21,0.5)",
  },
];

export default function HeroBenefits() {
  return (
    <div className="mt-8 flex flex-row items-start gap-4">
      {benefits.map(({ title, description, Icon, color }, index) => (
        <div key={title} className="flex flex-1 min-w-0 gap-3.5">
          <div className="flex flex-col gap-1.5 flex-1">
            <div className="flex items-center gap-1.5">
              {/* Icon */}
              <Icon size={14} strokeWidth={2} color={color} className="flex-shrink-0" />

              {/* Heading */}
              <h3 className="text-[11.5px] font-bold text-white leading-tight whitespace-nowrap">
                {title}
              </h3>
            </div>

            {/* Text Description */}
            <p className="text-[11px] text-gray-400 leading-snug pl-[20px]">
              {description}
            </p>
          </div>

          {/* Vertical divider between items */}
          {index < benefits.length - 1 && (
            <div className="self-stretch w-[1px] bg-white/10 flex-shrink-0" />
          )}
        </div>
      ))}
    </div>
  );
}