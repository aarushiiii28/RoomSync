import HeroLeft from "./HeroLeft";
import HeroRight from "./HeroRight";

export default function Hero() {
  return (
    <div className="min-h-[100svh] flex items-center justify-center overflow-hidden pt-[120px] sm:pt-[140px] md:pt-[160px] pb-10">
      <section className="mx-auto w-[92%] max-w-7xl flex flex-col lg:flex-row items-center lg:items-start justify-center lg:justify-between gap-3 sm:gap-8 lg:gap-20 py-1 sm:py-4">
        <HeroLeft />
        <HeroRight />
      </section>
    </div>
  );
}