"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { MessageCircle, Menu, X } from "lucide-react";
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
  const router = useRouter();
  const { isAuthenticated, profileComplete, user, loading } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    } else {
      router.push(`/#${id}`);
    }
  };

  return (
    <header className="fixed w-full flex justify-center pt-4 sm:pt-6 md:pt-8 px-4 sm:px-6 top-0 z-50">
      <nav
        className="
          w-full max-w-7xl h-16
          flex items-center justify-between
          px-4 sm:px-6 md:px-8
          rounded-2xl
          border border-white/10
          bg-[#151721]
          shadow-[0_8px_32px_rgba(0,0,0,0.4)]
          relative
        "
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0">
          <Image
            src="/logos/roomsync_logo.svg"
            alt="RoomSync"
            width={30}
            height={30}
            priority
            className="w-7 h-7 sm:w-8 sm:h-8"
          />
          <span className="font-sans text-[17px] sm:text-[18px] font-semibold text-white tracking-tight whitespace-nowrap">
            RoomSync
          </span>
        </Link>

        {/* Center Navigation (Desktop md+) */}
        <div className="hidden md:flex flex-1 justify-center items-center gap-6 lg:gap-12 xl:gap-16">
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

        {/* Right Buttons & Profile Menu (Desktop) */}
        <div className="hidden md:flex items-center gap-3">
          {!loading && isAuthenticated && user ? (
            <>
              {!profileComplete && (
                <Link
                  href="/onboarding"
                  className="
                    h-9
                    px-4 lg:px-5
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

              {/* Chat icon */}
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

              <UserProfileMenu />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="
                  h-9
                  px-4 lg:px-5
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
                  px-4 lg:px-5
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

        {/* Mobile Right Controls: Avatar/Chat + Hamburger Toggle */}
        <div className="flex md:hidden items-center gap-2">
          {!loading && isAuthenticated && user && (
            <>
              <Link
                href="/dashboard/chat"
                className="relative flex items-center justify-center w-8 h-8 rounded-full hover:bg-white/10"
                title="Messages"
              >
                <MessageCircle size={18} className="text-gray-300" />
                {unreadCount > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold px-0.5"
                    style={{ background: "#D97870", color: "#fff" }}
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
              <UserProfileMenu />
            </>
          )}

          {/* Hamburger Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle mobile menu"
            className="relative z-[99999] p-2.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 active:bg-white/20 transition-colors cursor-pointer flex items-center justify-center"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div
            className="
              absolute top-full left-0 right-0 mt-3
              bg-[#161925]
              border border-white/15 rounded-2xl
              p-5 shadow-2xl z-50
              flex flex-col gap-4
              md:hidden
            "
          >
            <div className="flex flex-col gap-1 border-b border-white/10 pb-4">
              {navItems.map((item) => {
                const itemClass = "py-2.5 px-3 text-[15px] font-medium text-gray-300 hover:text-white hover:bg-white/5 active:bg-white/10 rounded-lg transition-colors text-left cursor-pointer block w-full";
                return (
                  <a
                    key={item.name}
                    href={item.isAnchor ? `/#${item.href}` : item.href}
                    onClick={() => {
                      setMobileMenuOpen(false);
                      if (item.isAnchor) {
                        const el = document.getElementById(item.href);
                        if (el) {
                          el.scrollIntoView({ behavior: "smooth" });
                        }
                      }
                    }}
                    className={itemClass}
                  >
                    {item.name}
                  </a>
                );
              })}
            </div>

            {/* Mobile Auth Buttons */}
            <div className="flex flex-col gap-2.5 pt-1">
              {!loading && isAuthenticated && user ? (
                <>
                  {!profileComplete && (
                    <Link
                      href="/onboarding"
                      onClick={() => setMobileMenuOpen(false)}
                      className="
                        w-full py-2.5 px-4
                        rounded-xl
                        font-bold
                        text-[14px]
                        text-[#161925]
                        text-center
                        bg-[#F8B4C8]
                        hover:opacity-95
                        transition
                      "
                    >
                      Complete Profile
                    </Link>
                  )}
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="
                      w-full py-2.5 px-4
                      rounded-xl
                      border border-white/20
                      font-semibold
                      text-[14px]
                      text-white
                      text-center
                      hover:bg-white/10
                      transition
                    "
                  >
                    Your Matches Dashboard
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="
                      w-full py-2.5 px-4
                      rounded-xl
                      border border-white/20
                      font-semibold
                      text-[14px]
                      text-white
                      text-center
                      hover:bg-white/10
                      transition
                    "
                  >
                    Log In
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="
                      w-full py-2.5 px-4
                      rounded-xl
                      font-bold
                      text-[14px]
                      text-[#161925]
                      text-center
                      bg-[#F8B4C8]
                      hover:opacity-95
                      transition
                    "
                  >
                    Join RoomSync
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}