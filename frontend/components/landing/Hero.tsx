import HeroLeft from "./HeroLeft";
import HeroRight from "./HeroRight";

export default function Hero() {
  return (
    <div className="flex-1 flex items-center justify-center overflow-hidden pt-[120px] sm:pt-[140px] md:pt-[160px]">
      <section className="mx-auto w-[92%] max-w-7xl flex flex-col lg:flex-row items-center lg:items-start justify-center lg:justify-between gap-3 sm:gap-8 lg:gap-20 py-1 sm:py-4">
        <HeroLeft />
        <HeroRight />
      </section>
    </div>
  );
}