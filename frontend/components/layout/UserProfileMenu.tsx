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
    <div ref={menuRef} className="relative select-none">
      {/* Profile Avatar Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="User Profile Menu"
        aria-expanded={isOpen}
        className="
          w-9
          h-9
          rounded-full
          bg-[#161925]
          border border-white/25
          text-white
          flex items-center justify-center
          font-bold
          text-[12px]
          shadow-md
          hover:border-[#F8B4C8]/80
          hover:shadow-[0_0_16px_rgba(248,180,200,0.35)]
          hover:scale-105
          active:scale-95
          transition-all
          duration-150
          cursor-pointer
          focus:outline-none
          focus:ring-2
          focus:ring-[#F8B4C8]/50
        "
      >
        {initials}
      </button>

      {/* Popover Dropdown Menu (Opens downwards) */}
      {isOpen && (
        <div
          role="menu"
          className="
            absolute
            top-11
            right-0
            w-64
            rounded-2xl
            bg-[#161925]/95
            border border-white/10
            shadow-[0_16px_48px_rgba(0,0,0,0.7)]
            p-3
            backdrop-blur-xl
            animate-in fade-in slide-in-from-top-2
            duration-150
            z-50
          "
        >
          {/* User Info Header */}
          <div className="p-2 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#F8B4C8] flex items-center justify-center text-[#161925] font-bold text-sm shadow-md shrink-0">
              {initials}
            </div>

            <div className="overflow-hidden min-w-0 flex-1">
              <p className="text-[14px] font-semibold text-white truncate">
                {displayName}
              </p>
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
    </div>
  );
}
