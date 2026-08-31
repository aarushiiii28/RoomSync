import HeroLeft from "./HeroLeft";
import HeroRight from "./HeroRight";

export default function Hero() {
  return (
    <div className="flex-1 flex items-center justify-center overflow-hidden pt-18 sm:pt-20 md:pt-24">
      <section className="mx-auto w-[92%] max-w-7xl flex flex-col lg:flex-row items-center lg:items-start justify-center lg:justify-between gap-3 sm:gap-8 lg:gap-20 py-1 sm:py-4">
        <HeroLeft />
        <HeroRight />
      </section>
    </div>
  );
}