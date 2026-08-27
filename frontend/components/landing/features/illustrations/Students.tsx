import Image from "next/image";

export default function Students() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <Image
        src="/images/bio_hd.png"
        alt="Beyond the Bio"
        fill
        priority
        className="object-contain"
      />
    </div>
  );
}



