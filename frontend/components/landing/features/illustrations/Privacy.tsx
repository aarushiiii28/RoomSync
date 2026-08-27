import Image from "next/image";

export default function Privacy() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <Image
        src="/images/privacy_v4.svg"
        alt="Privacy First"
        fill
        priority
        className="object-contain"
      />
    </div>
  );
}





