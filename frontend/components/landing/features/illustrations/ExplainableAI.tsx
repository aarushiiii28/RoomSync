import Image from "next/image";

export default function ExplainableAI() {
  return (
    <div className="relative w-full h-full flex items-center justify-center p-1">
      <Image
        src="/images/smart%20insights.svg"
        alt="Smart Insights"
        fill
        className="object-contain"
      />
    </div>
  );
}

