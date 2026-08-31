import HeroButtons from "./HeroButtons";

export default function HeroLeft() {
  return (
    <div className="w-full max-w-[560px] flex-1 text-center lg:text-left flex flex-col items-center lg:items-start">
      <h1
        className="
        font-[family:var(--font-space)]
        text-[25px] sm:text-4xl md:text-5xl lg:text-[48px]
        font-bold
        leading-[1.2] sm:leading-[1.15]
        text-white
      "
      >
        Find your perfect
        <br className="hidden sm:inline" />{" "}
        roommate with
        <br className="hidden sm:inline" />{" "}
        <span
          className="bg-clip-text text-transparent bg-[linear-gradient(90deg,#F28695_0%,#F2BFB4_35%,#F1CCA6_70%,#F2E6B8_100%)]"
        >
          AI that understands you.
        </span>
      </h1>

      <p className="mt-2 sm:mt-4 max-w-sm sm:max-w-md text-[12px] sm:text-[14px] leading-[1.4] sm:leading-6 text-[#FDFCF0]">
        RoomSync analyzes your lifestyle, habits and compatibility
        preferences to recommend roommates you&apos;ll actually enjoy living with.
      </p>

      <HeroButtons />
    </div>
  );
}