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
        <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-500 bg-clip-text text-transparent whitespace-nowrap">
          AI that understands you.
        </span>
      </h1>

      <p className="mt-4 max-w-md text-[14px] leading-6 text-[#FDFCF0]">
        RoomSync analyzes your lifestyle, habits and compatibility
        preferences to recommend roommates you'll actually enjoy living with.
      </p>

      <HeroButtons />


    </div>
  );
}