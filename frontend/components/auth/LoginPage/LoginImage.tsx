import Image from "next/image";

export default function LoginImage() {
  return (
    <div className="relative w-full h-full min-h-[600px] overflow-hidden bg-[#0a0b10]">

      {/* Pixel art room — object-cover with object-left to show more of the room */}
      <Image
        src="/auth/login-room.png.png"
        alt="RoomSync cozy room"
        fill
        priority
        quality={100}
        sizes="50vw"
        className="object-cover object-center select-none pointer-events-none"
        style={{
          imageRendering: "pixelated",
          filter: "brightness(0.85) contrast(1.1) saturate(0.9)",
        }}
      />

      {/* Subtle top shadow */}
      <div
        className="absolute top-0 left-0 right-0 h-32 pointer-events-none"
        style={{
          background: "linear-gradient(to bottom, rgba(5,5,12,0.6), transparent)",
        }}
      />

      {/* Right edge shadow for depth where it meets the form panel */}
      <div
        className="absolute inset-y-0 right-0 w-16 pointer-events-none"
        style={{
          background: "linear-gradient(to right, transparent, rgba(5,5,12,0.4))",
        }}
      />

    </div>
  );
}