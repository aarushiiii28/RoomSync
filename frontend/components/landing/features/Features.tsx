import FeaturesHeader from "./FeaturesHeader";
import FeaturesGrid from "./FeaturesGrid";

export default function Features() {
  return (
    <section
      id="features"
      className="relative py-20 md:py-28"
    >
      <div className="mx-auto max-w-6xl px-6">
        <FeaturesHeader />

        <div className="mt-14 md:mt-16">
          <FeaturesGrid />
        </div>
      </div>
    </section>
  );
}