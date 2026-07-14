import Lifestyle from "./illustrations/Lifestyle";
import ExplainableAI from "./illustrations/ExplainableAI";
import Privacy from "./illustrations/Privacy";
import Compatibility from "./illustrations/Compatibility";
import Recommendation from "./illustrations/Recommendation";
import Students from "./illustrations/Students";

import { Feature } from "./types";

export const features: Feature[] = [
  {
    id: 1,
    title: "Lifestyle Compatibility",
    description:
      "Roommates are matched using daily habits, routines and preferences instead of random listings.",
    illustration: <Lifestyle />,
  },

  {
    id: 2,
    title: "Smart Insights",
    description:
      "Every recommendation includes a clear explanation so you understand why someone is a good match.",
    illustration: <ExplainableAI />,
  },

  {
    id: 3,
    title: "Privacy First",
    description:
      "Personal information stays private while compatibility insights help you choose confidently.",
    illustration: <Privacy />,
  },

  {
    id: 4,
    title: "Verified Community",
    description:
      "Connect with verified people and trusted profiles, making it safer and easier to find the right roommate.",
    illustration: <Compatibility />,
  },

  {
    id: 5,
    title: "Tailored Recommendations",
    description:
      "Receive personalized roommate suggestions without endlessly browsing profiles.",
    illustration: <Recommendation />,
  },

  {
    id: 6,
    title: "Beyond the Bio",
    description:
      "Profiles reveal how people actually live—not just what they choose to write about themselves.",
    illustration: <Students />,
  },
];