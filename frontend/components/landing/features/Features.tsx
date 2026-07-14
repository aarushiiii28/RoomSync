import FeaturesHeader from "./FeaturesHeader";
import FeaturesGrid from "./FeaturesGrid";

export default function Features() {
  return (
    <section
      id="features"
      className="relative py-32"
    >
      <div className="mx-auto max-w-7xl px-6">

        <FeaturesHeader />

        <div className="mt-24">
          <FeaturesGrid />
        </div>

      </div>
    </section>
  );
}