import Image from "next/image";

export default function Recommendation() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <Image
        src="/images/tailored_new.svg"
        alt="Tailored Recommendations"
        fill
        priority
        className="object-contain"
      />
    </div>
  );
}
