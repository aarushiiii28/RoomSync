import Image from "next/image";

export default function Compatibility() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <img
        src="/images/verified.svg"
        alt="Verified Community"
        className="w-full h-full object-contain"
      />
    </div>
  );
}
