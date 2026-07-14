import { features } from "./data";
import FeatureCard from "./FeatureCard";

export default function FeaturesGrid() {
  return (
    <div
      className="
        grid
        lg:grid-cols-2
        gap-8
      "
    >
      {features.map((feature) => (
        <FeatureCard
          key={feature.id}
          feature={feature}
        />
      ))}
    </div>
  );
}