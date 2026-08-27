import Image from "next/image";

export default function Compatibility() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <Image
        src="/images/verified_v4.svg"
        alt="Verified Community"
        fill
        priority
        className="object-contain"
      />
    </div>
  );
}



