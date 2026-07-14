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
    title: "Explainable AI",
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
    title: "Real Compatibility",
    description:
      "Matches are based on behaviour, not just location, budget or shared interests.",
    illustration: <Compatibility />,
  },

  {
    id: 5,
    title: "Smart Recommendations",
    description:
      "Receive personalized roommate suggestions without endlessly browsing profiles.",
    illustration: <Recommendation />,
  },

  {
    id: 6,
    title: "Built for Students",
    description:
      "Designed specifically for hostels, PGs, apartments and shared student accommodation.",
    illustration: <Students />,
  },
];