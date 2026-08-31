"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import UserProfileMenu from "@/components/layout/UserProfileMenu";
import { listConversations } from "@/services/chat";

const navItems = [
  { name: "Home", href: "/", isAnchor: false },
  { name: "How It Works", href: "how-it-works", isAnchor: true },
  { name: "Features", href: "features", isAnchor: true },
  { name: "About", href: "about", isAnchor: true },
];

export default function Navbar() {
  const { isAuthenticated, profileComplete, user, loading } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  // Poll for unread messages every 30s when logged in
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const fetchUnread = () => {
      listConversations()
        .then((convs) => {
          const total = convs.reduce((sum, c) => sum + c.unread_count, 0);
          setUnreadCount(total);
        })
        .catch(() => {});
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30_000);
    return () => clearInterval(interval);
  }, [isAuthenticated, user]);

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
                  bg-[#F8B4C8]
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

        {/* Right Buttons & Profile Menu */}
        <div className="flex flex-1 justify-end items-center gap-3">
          {!loading && isAuthenticated && user ? (
            <>
              {!profileComplete && (
                /* Authenticated + Incomplete Profile */
                <Link
                  href="/onboarding"
                  className="
                    h-9
                    px-5
                    rounded-[4px]
                    font-bold
                    text-[13px]
                    text-[#161925]
                    whitespace-nowrap
                    bg-[#F8B4C8]
                    transition
                    duration-200
                    hover:opacity-95
                    hover:shadow-[0_6px_20px_rgba(248,180,200,0.4)]
                    flex
                    items-center
                  "
                >
                  Complete Profile
                </Link>
              )}

              {/* Chat icon — left of profile avatar */}
              <Link
                href="/dashboard/chat"
                className="relative flex items-center justify-center w-9 h-9 rounded-full transition-all hover:bg-white/10"
                title="Messages"
              >
                <MessageCircle size={20} className="text-gray-300 hover:text-white transition-colors" />
                {unreadCount > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full flex items-center justify-center text-[10px] font-bold px-0.5"
                    style={{ background: "#D97870", color: "#fff" }}
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>

              {/* Avatar menu at the rightmost corner */}
              <UserProfileMenu />
            </>
          ) : (
            /* Unauthenticated */
            <>
              <Link
                href="/login"
                className="
                  h-9
                  px-5
                  rounded-[4px]
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
                Log In
              </Link>

              <Link
                href="/register"
                className="
                  h-9
                  px-5
                  rounded-[4px]
                  font-bold
                  text-[13px]
                  text-[#161925]
                  whitespace-nowrap
                  bg-[#F8B4C8]
                  transition
                  duration-200
                  hover:opacity-95
                  hover:shadow-[0_6px_20px_rgba(248,180,200,0.4)]
                  flex
                  items-center
                "
              >
                Join RoomSync
              </Link>
            </>
          )}
        </div>

      </nav>
    </header>
  );
}