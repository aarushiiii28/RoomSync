export default function FeaturesHeader() {
  return (
    <div className="text-center">
      <span
        className="
          uppercase
          tracking-[0.3em]
          text-xs
          font-semibold
          text-[#F8B4C8]
        "
      >
        WHY ROOMSYNC WORKS
      </span>

      <h2
        className="
          mt-3
          text-3xl
          md:text-4xl
          font-bold
          text-white
        "
      >
        Built Around Compatibility
      </h2>

      <p
        className="
          mt-4
          mx-auto
          max-w-2xl
          text-base
          leading-relaxed
          text-zinc-400
        "
      >
        Every recommendation is powered by behavioural compatibility,
        helping students find roommates they’ll actually enjoy living with.
      </p>
    </div>
  );
}