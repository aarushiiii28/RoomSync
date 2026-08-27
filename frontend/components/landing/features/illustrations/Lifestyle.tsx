import Image from "next/image";

export default function Lifestyle() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <Image
        src="/images/life_new.svg"
        alt="Lifestyle Compatibility"
        fill
        priority
        className="object-contain"
      />
    </div>
  );
}


