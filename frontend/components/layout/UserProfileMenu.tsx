"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { logout } from "@/services/auth";
import {
  LayoutDashboard,
  UserCheck,
  Sparkles,
  LogOut,
} from "lucide-react";

export default function UserProfileMenu() {
  const router = useRouter();
  const { isAuthenticated, profileComplete, user, loading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  if (loading || !isAuthenticated) {
    return null;
  }

  // Calculate clean display initials
  let initials = "U";
  if (user?.firstName && user?.lastName) {
    initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  } else if (user?.firstName) {
    initials = user.firstName.charAt(0).toUpperCase();
  } else if (user?.username) {
    initials = user.username.charAt(0).toUpperCase();
  }

  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName || ""}`.trim()
    : user?.username
    ? `@${user.username}`
    : "Your Account";

  const handleLogout = async () => {
    setIsOpen(false);
    try {
      await logout();
    } catch {
      // ignore
    }
    router.push("/login");
  };

  return (
    <div ref={menuRef} className="fixed bottom-6 left-6 z-50 select-none">
      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div
          role="menu"
          className="
            absolute
            bottom-13
            left-0
            w-64
            rounded-2xl
            bg-[#161925]/95
            border border-white/10
            shadow-[0_12px_40px_rgba(0,0,0,0.6)]
            p-3
            backdrop-blur-xl
            animate-in fade-in slide-in-from-bottom-2
            duration-150
          "
        >
          {/* User Info Header */}
          <div className="p-2 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#F8B4C8] flex items-center justify-center text-[#161925] font-bold text-sm shadow-md shrink-0">
              {initials}
            </div>

            <div className="overflow-hidden">
              <p className="text-[14px] font-semibold text-white truncate">
                {displayName}
              </p>
              <div className="mt-0.5">
                {profileComplete ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Profile Complete
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    Incomplete Profile
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="h-[1px] bg-white/10 my-2" />

          {/* Menu Actions */}
          <div className="space-y-1">
            {profileComplete ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="
                    flex items-center gap-2.5
                    px-3 py-2.5
                    rounded-xl
                    text-[13px]
                    font-medium
                    text-zinc-200
                    hover:bg-white/10
                    hover:text-white
                    transition-colors
                  "
                >
                  <LayoutDashboard size={16} className="text-[#F8B4C8]" />
                  <span>Dashboard</span>
                </Link>

                <Link
                  href="/onboarding"
                  onClick={() => setIsOpen(false)}
                  className="
                    flex items-center gap-2.5
                    px-3 py-2.5
                    rounded-xl
                    text-[13px]
                    font-medium
                    text-zinc-200
                    hover:bg-white/10
                    hover:text-white
                    transition-colors
                  "
                >
                  <UserCheck size={16} className="text-[#F8B4C8]" />
                  <span>Edit Profile</span>
                </Link>
              </>
            ) : (
              <Link
                href="/onboarding"
                onClick={() => setIsOpen(false)}
                className="
                  flex items-center gap-2.5
                  px-3 py-2.5
                  rounded-xl
                  text-[13px]
                  font-medium
                  text-white
                  bg-[#F8B4C8]/15
                  border border-[#F8B4C8]/30
                  hover:bg-[#F8B4C8]/25
                  transition-colors
                "
              >
                <Sparkles size={16} className="text-[#F8B4C8]" />
                <span>Complete Profile</span>
              </Link>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className="
                w-full
                flex items-center gap-2.5
                px-3 py-2.5
                rounded-xl
                text-[13px]
                font-medium
                text-red-400
                hover:bg-red-500/10
                hover:text-red-300
                transition-colors
                cursor-pointer
              "
            >
              <LogOut size={16} />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Floating Bottom-Left Profile Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="User Profile Menu"
        aria-expanded={isOpen}
        className="
          w-10
          h-10
          rounded-full
          bg-[#161925]
          border border-white/20
          text-white
          flex items-center justify-center
          font-bold
          text-[13px]
          shadow-[0_4px_20px_rgba(0,0,0,0.5)]
          hover:border-[#F8B4C8]/80
          hover:shadow-[0_0_20px_rgba(248,180,200,0.4)]
          hover:scale-105
          active:scale-95
          transition-all
          duration-200
          cursor-pointer
          focus:outline-none
          focus:ring-2
          focus:ring-[#F8B4C8]/50
        "
      >
        {initials}
      </button>
    </div>
  );
}
