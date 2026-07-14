import Image from "next/image";

export default function Privacy() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <img
        src="/images/privacy.svg"
        alt="Privacy First"
        className="w-full h-full object-contain"
      />
    </div>
  );
}
