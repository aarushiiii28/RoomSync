"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
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
  Camera,
  Upload,
  Trash2,
  Loader2,
} from "lucide-react";

export default function UserProfileMenu() {
  const router = useRouter();
  const { isAuthenticated, profileComplete, user, loading, updateProfilePhoto } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [photoMenuOpen, setPhotoMenuOpen] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop camera stream helper
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setCameraError(null);
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setPhotoMenuOpen(false);
        stopCamera();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (cameraActive) {
          stopCamera();
        } else if (photoMenuOpen) {
          setPhotoMenuOpen(false);
        } else {
          setIsOpen(false);
        }
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
  }, [isOpen, photoMenuOpen, cameraActive, stopCamera]);

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

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
    setPhotoMenuOpen(false);
    stopCamera();
    try {
      await logout();
    } catch {
      // ignore
    }
    router.push("/login");
  };

  const startCamera = async () => {
    setCameraError(null);
    setCameraActive(true);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera is not supported on this device/browser.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 480 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err: unknown) {
      console.error("Camera access error:", err);
      setCameraError("Camera access denied or unavailable.");
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    setIsSavingPhoto(true);
    try {
      const canvas = document.createElement("canvas");
      const size = Math.min(video.videoWidth, video.videoHeight);
      canvas.width = 360;
      canvas.height = 360;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const sx = (video.videoWidth - size) / 2;
        const sy = (video.videoHeight - size) / 2;
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, sx, sy, size, size, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        await updateProfilePhoto(dataUrl);
      }
    } finally {
      stopCamera();
      setPhotoMenuOpen(false);
      setIsSavingPhoto(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file.");
      return;
    }

    setIsSavingPhoto(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        const maxDim = 360;
        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;
        canvas.width = maxDim;
        canvas.height = maxDim;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, maxDim, maxDim);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
          await updateProfilePhoto(dataUrl);
        }
        setIsSavingPhoto(false);
        setPhotoMenuOpen(false);
      };
      if (typeof event.target?.result === "string") {
        img.src = event.target.result;
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleRemovePhoto = async () => {
    setIsSavingPhoto(true);
    try {
      await updateProfilePhoto(null);
      setPhotoMenuOpen(false);
    } finally {
      setIsSavingPhoto(false);
    }
  };

  return (
    <div ref={menuRef} className="relative select-none">
      {/* Hidden File Input for Device Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Profile Avatar Button in Navbar */}
      <button
        type="button"
        onClick={() => {
          setIsOpen((prev) => !prev);
          setPhotoMenuOpen(false);
          stopCamera();
        }}
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

      {/* Popover Dropdown Menu (Opens downwards on right side) */}
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
          <div className="p-2 flex items-center gap-3 relative">
            <div className="relative group/avatar flex-shrink-0">
              <button
                type="button"
                onClick={() => setPhotoMenuOpen((prev) => !prev)}
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
                  setPhotoMenuOpen((prev) => !prev);
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

            {/* Small Compact Photo Options Box (attached near the avatar on right side) */}
            {photoMenuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="
                  absolute
                  top-14
                  left-0
                  w-52
                  rounded-xl
                  bg-[#1e2332]
                  border border-white/15
                  shadow-[0_12px_32px_rgba(0,0,0,0.85)]
                  p-1.5
                  z-50
                  animate-in fade-in zoom-in-95
                  duration-150
                "
              >
                {cameraActive ? (
                  /* Compact Camera View */
                  <div className="p-2 space-y-2 text-center">
                    {cameraError ? (
                      <div className="text-[11px] text-red-400 p-1">
                        {cameraError}
                        <button
                          type="button"
                          onClick={() => setCameraActive(false)}
                          className="block mx-auto mt-1.5 text-[10px] text-zinc-300 underline cursor-pointer"
                        >
                          Back to options
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="w-28 h-28 mx-auto rounded-full overflow-hidden border-2 border-[#F8B4C8] bg-black shadow-inner">
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover scale-x-[-1]"
                          />
                        </div>
                        <div className="flex items-center justify-center gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={capturePhoto}
                            disabled={isSavingPhoto}
                            className="px-3 py-1 rounded-lg bg-[#F8B4C8] text-[#161925] font-bold text-[11px] hover:opacity-90 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                          >
                            {isSavingPhoto ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <Camera size={12} />
                            )}
                            Snap
                          </button>
                          <button
                            type="button"
                            onClick={stopCamera}
                            className="px-2 py-1 rounded-lg bg-white/10 text-zinc-300 hover:text-white text-[11px] cursor-pointer transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  /* Small clean action list */
                  <div className="space-y-0.5">
                    <button
                      type="button"
                      onClick={startCamera}
                      className="
                        w-full flex items-center gap-2
                        px-2.5 py-2
                        rounded-lg
                        text-[12px] font-medium
                        text-zinc-200
                        hover:bg-white/10 hover:text-white
                        transition-colors
                        cursor-pointer
                      "
                    >
                      <Camera size={14} className="text-[#F8B4C8]" />
                      <span>Take Photo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="
                        w-full flex items-center gap-2
                        px-2.5 py-2
                        rounded-lg
                        text-[12px] font-medium
                        text-zinc-200
                        hover:bg-white/10 hover:text-white
                        transition-colors
                        cursor-pointer
                      "
                    >
                      <Upload size={14} className="text-[#F8B4C8]" />
                      <span>Upload from Device</span>
                    </button>

                    {user?.profilePhotoUrl && (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        disabled={isSavingPhoto}
                        className="
                          w-full flex items-center gap-2
                          px-2.5 py-2
                          rounded-lg
                          text-[12px] font-medium
                          text-red-400
                          hover:bg-red-500/10 hover:text-red-300
                          transition-colors
                          cursor-pointer
                        "
                      >
                        <Trash2 size={14} />
                        <span>Remove Photo</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
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
  );
}
