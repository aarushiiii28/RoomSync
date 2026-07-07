export default function HeroButtons() {
  return (
    <div className="mt-14 flex gap-4">

      <button
        className="
        rounded-xl
        bg-pink-400
        px-10
        py-4
        font-semibold
        text-white
        transition
        hover:scale-105
      "
      >
        Start Matching Now
      </button>

      <button
        className="
        rounded-xl
        border
        border-white/20
        px-10
        py-4
        text-white
        transition
        hover:bg-white/5
      "
      >
        ▶ Watch Demo
      </button>

    </div>
  );
}