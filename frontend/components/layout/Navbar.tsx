"use client";

import Image from "next/image";
import Link from "next/link";

const navItems = [
  { name: "Home", href: "/", isAnchor: false },
  { name: "How It Works", href: "how-it-works", isAnchor: true },
  { name: "Features", href: "features", isAnchor: true },
  { name: "About", href: "about", isAnchor: true },
];

export default function Navbar() {
  const handleScroll = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header className="w-full flex justify-center pt-12 -mb-6 px-6 relative z-10">
      <nav
        className="
          w-full max-w-7xl h-16
          flex items-center justify-between
          px-8
          rounded-2xl
          border border-white/10
          bg-white/5
          backdrop-blur-xl
          shadow-[0_8px_32px_rgba(0,0,0,0.4)]
        "
      >
        {/* Logo – kept as-is */}
        <Link href="/" className="flex items-center gap-3 flex-shrink-0 flex-1">
          <Image
            src="/logos/roomsync_logo.svg"
            alt="RoomSync"
            width={32}
            height={32}
            priority
          />
          <span className="font-sans text-[18px] font-semibold text-white tracking-tight whitespace-nowrap">
            RoomSync
          </span>
        </Link>

        {/* Center Navigation */}
        <div className="flex flex-1 justify-center items-center gap-16">
          {navItems.map((item) => {
            const sharedClass = `
              group
              relative
              whitespace-nowrap
              text-[14px]
              font-medium
              text-gray-400
              hover:text-white
              transition
              duration-200
              pb-0.5
              cursor-pointer
            `;

            const underline = (
              <span
                className="
                  absolute bottom-0 left-0
                  h-[2px] w-0
                  rounded-full
                  bg-pink-400
                  transition-all duration-300
                  group-hover:w-full
                "
              />
            );

            return item.isAnchor ? (
              <button
                key={item.name}
                onClick={() => handleScroll(item.href)}
                className={sharedClass}
              >
                {item.name}
                {underline}
              </button>
            ) : (
              <Link
                key={item.name}
                href={item.href}
                className={sharedClass}
              >
                {item.name}
                {underline}
              </Link>
            );
          })}
        </div>

        {/* Right Buttons */}
        <div className="flex flex-1 justify-end items-center gap-3">
          <Link
            href="/login"
            className="
              h-9
              px-5
              rounded-xl
              border
              border-white/15
              text-white
              text-[13px]
              font-medium
              whitespace-nowrap
              transition
              duration-200
              hover:bg-white/10
              flex
              items-center
            "
          >
            Login / Register
          </Link>

          <Link
            href="/register"
            className="
              h-9
              px-5
              rounded-xl
              font-semibold
              text-[13px]
              text-white
              whitespace-nowrap
              bg-pink-400
              transition
              duration-200
              hover:opacity-90
              hover:shadow-[0_6px_20px_rgba(244,114,182,0.4)]
              flex
              items-center
            "
          >
            Join RoomSync
          </Link>
        </div>

      </nav>
    </header>
  );
}