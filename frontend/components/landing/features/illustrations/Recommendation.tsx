import Image from "next/image";

export default function Recommendation() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <img
        src="/images/tailored.svg"
        alt="Tailored Recommendations"
        className="w-full h-full object-contain scale-[2] translate-y-12"
      />
    </div>
  );
}
