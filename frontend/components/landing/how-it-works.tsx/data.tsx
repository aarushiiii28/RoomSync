import CreateProfile from "./illustrations/CreateProfile";
import AIProcessing from "./illustrations/AIProcessing";
import MatchFound from "./illustrations/MatchFound";

import { StepData } from "./types";

export const steps: StepData[] = [
  {
    id: 1,
    title: "Build Your Compatibility Profile",
    description:
      "Answer a few simple questions about your daily routine, personality, and living habits so we can recommend your most compatible roommates.",
    illustration: <CreateProfile />,
  },

  {
    id: 2,
    title: "Finding Your Perfect Fit",
    description:
      "We analyze your daily routines, habits, and personality to identify what truly makes two roommates compatible.",
    illustration: <AIProcessing />,
  },

  {
    id: 3,
    title: "Your Best Matches Await",
    description:
      "Explore roommate matches tailored to your routines, habits, and personality—so you can choose with confidence.",
    illustration: <MatchFound />,
  },
];