import HeroLeft from "./HeroLeft";
import HeroRight from "./HeroRight";

export default function Hero() {
  return (
    // flex-1 makes this fill all remaining height after navbar; items-center centers content vertically
    <div className="flex-1 flex items-center overflow-hidden pt-24">
      <section className="mx-auto w-[92%] max-w-7xl flex items-start justify-between gap-24 py-6">
        <HeroLeft />
        <HeroRight />
      </section>
    </div>
  );
}