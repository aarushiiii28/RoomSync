"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { logout } from "@/services/auth";
import {
  Compass,
  UserCheck,
  Sparkles,
  LogOut,
  Pencil,
} from "lucide-react";
import ProfilePhotoModal from "./ProfilePhotoModal";

export default function UserProfileMenu() {
  const router = useRouter();
  const { isAuthenticated, profileComplete, user, loading, updateProfilePhoto } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
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
    <>
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
            overflow-hidden
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
          {user?.profilePhotoUrl ? (
            <img
              src={user.profilePhotoUrl}
              alt={displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            initials
          )}
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
            {/* User Info Header with Avatar & Edit Pencil */}
            <div className="p-2 flex items-center gap-3">
              <div className="relative group/avatar flex-shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setIsPhotoModalOpen(true);
                  }}
                  title="Change profile picture"
                  className="
                    w-11 h-11
                    rounded-full
                    bg-[#F8B4C8]
                    text-[#161925]
                    flex items-center justify-center
                    font-bold text-sm
                    shadow-md
                    overflow-hidden
                    border border-white/15
                    hover:ring-2 hover:ring-[#F8B4C8]
                    transition-all duration-150
                    cursor-pointer
                  "
                >
                  {user?.profilePhotoUrl ? (
                    <img
                      src={user.profilePhotoUrl}
                      alt={displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </button>

                {/* Edit Pencil Icon Badge */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(false);
                    setIsPhotoModalOpen(true);
                  }}
                  title="Change profile picture"
                  aria-label="Change profile picture"
                  className="
                    absolute -bottom-1 -right-1
                    w-5 h-5
                    rounded-full
                    bg-[#161925]
                    border border-white/20
                    text-[#F8B4C8]
                    hover:text-white
                    hover:bg-[#F8B4C8]/40
                    hover:scale-110
                    flex items-center justify-center
                    shadow-md
                    transition-all duration-150
                    cursor-pointer
                  "
                >
                  <Pencil size={10} />
                </button>
              </div>

              <div className="overflow-hidden min-w-0 flex-1">
                <p className="text-[14px] font-semibold text-white truncate">
                  {displayName}
                </p>
                {user?.email && (
                  <p className="text-[11px] text-zinc-400 truncate">
                    {user.email}
                  </p>
                )}
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
                    <Compass size={16} className="text-[#F8B4C8]" />
                    <span>Discover</span>
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

      {/* Profile Photo Modal */}
      <ProfilePhotoModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        currentPhotoUrl={user?.profilePhotoUrl || null}
        initials={initials}
        onSavePhoto={updateProfilePhoto}
      />
    </>
  );
}

