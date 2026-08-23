import HeroButtons from "./HeroButtons";

export default function HeroLeft() {
  return (
    <div className="max-w-[560px] flex-1">
      <h1
        className="
        font-[family:var(--font-space)]
        text-[48px]
        font-bold
        leading-[1.15]
        text-white
      "
      >
        Find your perfect
        <br />
        roommate with
        <br />
        <span
          className="bg-clip-text text-transparent whitespace-nowrap bg-[linear-gradient(90deg,#F28695_0%,#F2BFB4_35%,#F1CCA6_70%,#F2E6B8_100%)]"
        >
          AI that understands you.
        </span>
      </h1>

      <p className="mt-4 max-w-md text-[14px] leading-6 text-[#FDFCF0]">
        RoomSync analyzes your lifestyle, habits and compatibility
        preferences to recommend roommates you&apos;ll actually enjoy living with.
      </p>

      <HeroButtons />
    </div>
  );
}