"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { logout } from "@/services/auth";
import {
  UserCheck,
  Sparkles,
  LogOut,
  Pencil,
  Eye,
  Crop,
  Camera,
  Upload,
  Trash2,
  Loader2,
  ArrowLeft,
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Check,
  Move,
} from "lucide-react";

// ── Embedded Canvas Cropper Component (100% Distortion-Free) ──
interface EmbeddedCropperProps {
  imageSrc: string;
  onSave: (croppedDataUrl: string) => Promise<void>;
  onCancel: () => void;
}

function EmbeddedCropper({ imageSrc, onSave, onCancel }: EmbeddedCropperProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isSaving, setIsSaving] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const size = 200; // 200px square crop canvas

  // Draw image on canvas with exact math
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, size, size);
    ctx.save();

    // Fill dark background
    ctx.fillStyle = "#0a0c12";
    ctx.fillRect(0, 0, size, size);

    // Calculate base scale to fully cover the viewport
    const baseScale = Math.max(size / img.naturalWidth, size / img.naturalHeight);
    const renderW = img.naturalWidth * baseScale * zoom;
    const renderH = img.naturalHeight * baseScale * zoom;

    ctx.translate(size / 2, size / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(pos.x, pos.y);
    ctx.drawImage(img, -renderW / 2, -renderH / 2, renderW, renderH);
    ctx.restore();
  }, [zoom, rotation, pos, size]);

  // Load image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      setZoom(1);
      setRotation(0);
      setPos({ x: 0, y: 0 });
      draw();
    };
    img.src = imageSrc;
  }, [imageSrc, draw]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Pointer drag for panning
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    setDragStart({ x: e.clientX - pos.x, y: e.clientY - pos.y });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    setPos({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    setIsDragging(false);
  };

  // Scroll wheel zoom
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    setZoom((prev) => Math.min(3.5, Math.max(1, prev - e.deltaY * 0.002)));
  };

  const handleSave = async () => {
    const img = imgRef.current;
    if (!img) return;

    setIsSaving(true);
    try {
      const outputSize = 400;
      const exportCanvas = document.createElement("canvas");
      exportCanvas.width = outputSize;
      exportCanvas.height = outputSize;
      const ctx = exportCanvas.getContext("2d");

      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        const baseScale = Math.max(size / img.naturalWidth, size / img.naturalHeight);
        const ratio = outputSize / size;
        const renderW = img.naturalWidth * baseScale * zoom * ratio;
        const renderH = img.naturalHeight * baseScale * zoom * ratio;

        ctx.translate(outputSize / 2, outputSize / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.translate(pos.x * ratio, pos.y * ratio);
        ctx.drawImage(img, -renderW / 2, -renderH / 2, renderW, renderH);

        const dataUrl = exportCanvas.toDataURL("image/jpeg", 0.9);
        await onSave(dataUrl);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-2.5">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1 text-[12px] font-medium text-zinc-300 hover:text-white transition cursor-pointer"
        >
          <ArrowLeft size={13} />
          <span>Back</span>
        </button>
        <span className="text-[12px] font-bold text-white">Crop Photo</span>
        <button
          type="button"
          onClick={onCancel}
          className="w-6 h-6 rounded-md bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition cursor-pointer"
        >
          <X size={13} />
        </button>
      </div>

      {/* Viewport Canvas + Circular guide */}
      <div className="flex justify-center" onWheel={handleWheel}>
        <div
          className="relative rounded-2xl overflow-hidden bg-black select-none touch-none cursor-grab active:cursor-grabbing border border-white/10 shadow-inner"
          style={{ width: `${size}px`, height: `${size}px` }}
        >
          <canvas
            ref={canvasRef}
            width={size}
            height={size}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            className="w-full h-full block"
          />

          {/* Circular mask overlay */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div
              style={{ width: `${size - 16}px`, height: `${size - 16}px` }}
              className="rounded-full border-2 border-[#F8B4C8] shadow-[0_0_0_9999px_rgba(10,12,18,0.7)]"
            />
          </div>

          <div className="absolute bottom-1.5 left-0 right-0 flex justify-center pointer-events-none">
            <span className="px-1.5 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-[9px] text-zinc-300 flex items-center gap-0.5">
              <Move size={9} /> Drag to position
            </span>
          </div>
        </div>
      </div>

      {/* Zoom and Rotate controls */}
      <div className="flex items-center gap-2 px-1">
        <button
          type="button"
          onClick={() => setZoom((prev) => Math.max(1, prev - 0.2))}
          className="text-zinc-400 hover:text-white transition cursor-pointer p-0.5"
          title="Zoom Out"
        >
          <ZoomOut size={13} />
        </button>
        <input
          type="range"
          min="1"
          max="3"
          step="0.05"
          value={zoom}
          onChange={(e) => setZoom(parseFloat(e.target.value))}
          className="flex-1 accent-[#F8B4C8] h-1.5 bg-white/20 rounded-lg cursor-pointer"
        />
        <button
          type="button"
          onClick={() => setZoom((prev) => Math.min(3, prev + 0.2))}
          className="text-zinc-400 hover:text-white transition cursor-pointer p-0.5"
          title="Zoom In"
        >
          <ZoomIn size={13} />
        </button>

        <button
          type="button"
          onClick={() => setRotation((prev) => (prev + 90) % 360)}
          className="p-1 rounded-md bg-white/5 hover:bg-white/15 text-zinc-300 hover:text-white transition cursor-pointer"
          title="Rotate 90°"
        >
          <RotateCw size={12} />
        </button>
      </div>

      {/* Footer Buttons */}
      <div className="flex items-center justify-between pt-2 border-t border-white/10">
        <button
          type="button"
          onClick={() => {
            setZoom(1);
            setRotation(0);
            setPos({ x: 0, y: 0 });
          }}
          className="text-[11px] text-zinc-400 hover:text-white underline cursor-pointer"
        >
          Reset
        </button>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="px-2.5 py-1 rounded-lg border border-white/10 text-zinc-300 hover:bg-white/5 hover:text-white text-[11px] font-medium transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-3 py-1 rounded-lg bg-[#F8B4C8] text-[#161925] font-bold text-[11px] hover:opacity-95 flex items-center gap-1 transition cursor-pointer shadow-xs active:scale-95"
          >
            {isSaving ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Check size={12} />
            )}
            <span>Save Crop</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main UserProfileMenu Component ──
export default function UserProfileMenu() {
  const router = useRouter();
  const { isAuthenticated, profileComplete, user, loading, updateProfilePhoto } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [menuView, setMenuView] = useState<"default" | "view_photo" | "crop">("default");
  const [photoMenuOpen, setPhotoMenuOpen] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);

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
        setMenuView("default");
        stopCamera();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (cameraActive) {
          stopCamera();
        } else if (photoMenuOpen) {
          setPhotoMenuOpen(false);
        } else if (menuView !== "default") {
          setMenuView("default");
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
  }, [isOpen, photoMenuOpen, cameraActive, menuView, stopCamera]);

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
    setMenuView("default");
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
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 640 } },
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

  // Capture snapshot and pass directly to cropper
  const handleSnapForCrop = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const rawDataUrl = canvas.toDataURL("image/jpeg", 0.95);

      stopCamera();
      setPhotoMenuOpen(false);
      setCropImageSrc(rawDataUrl);
      setMenuView("crop");
    }
  };

  // Handle file select and pass directly to cropper
  const handleFileSelectForCrop = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === "string") {
        setPhotoMenuOpen(false);
        setCropImageSrc(event.target.result);
        setMenuView("crop");
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Save cropped photo
  const handleSaveCroppedPhoto = async (croppedDataUrl: string) => {
    setIsSavingPhoto(true);
    try {
      await updateProfilePhoto(croppedDataUrl);
    } finally {
      setIsSavingPhoto(false);
      setMenuView("default");
      setCropImageSrc(null);
    }
  };

  // Remove photo
  const handleRemovePhoto = async () => {
    setIsSavingPhoto(true);
    try {
      await updateProfilePhoto(null);
      setPhotoMenuOpen(false);
      setMenuView("default");
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
        onChange={handleFileSelectForCrop}
      />

      {/* Profile Avatar Button in Navbar */}
      <button
        type="button"
        onClick={() => {
          setIsOpen((prev) => !prev);
          setPhotoMenuOpen(false);
          setMenuView("default");
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
            bg-[#161925]/98
            border border-white/15
            shadow-[0_16px_48px_rgba(0,0,0,0.8)]
            p-3
            animate-in fade-in slide-in-from-top-2
            duration-150
            z-50
          "
        >
          {menuView === "crop" && cropImageSrc ? (
            /* ── Embedded Photo Cropper View (Right Side) ── */
            <EmbeddedCropper
              imageSrc={cropImageSrc}
              onSave={handleSaveCroppedPhoto}
              onCancel={() => {
                setMenuView("default");
                setCropImageSrc(null);
              }}
            />
          ) : menuView === "view_photo" ? (
            /* ── Embedded Photo Viewer View (Right Side) ── */
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <button
                  type="button"
                  onClick={() => setMenuView("default")}
                  className="flex items-center gap-1 text-[12px] font-medium text-zinc-300 hover:text-white transition cursor-pointer"
                >
                  <ArrowLeft size={13} />
                  <span>Back</span>
                </button>

                <span className="text-[12px] font-bold text-white">Profile Photo</span>

                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setMenuView("default");
                  }}
                  className="w-6 h-6 rounded-md bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition cursor-pointer"
                >
                  <X size={13} />
                </button>
              </div>

              {/* Photo Display */}
              <div className="py-2 flex flex-col items-center justify-center">
                <div className="w-32 h-32 rounded-full overflow-hidden border-3 border-[#F8B4C8] shadow-[0_0_20px_rgba(248,180,200,0.3)] bg-[#161925] flex items-center justify-center">
                  {user?.profilePhotoUrl ? (
                    <img
                      src={user.profilePhotoUrl}
                      alt={displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[#F8B4C8] font-bold text-3xl select-none">
                      {initials}
                    </span>
                  )}
                </div>
              </div>

              {/* Toolbar */}
              <div className="flex items-center justify-center gap-1.5 pt-2 border-t border-white/10">
                {user?.profilePhotoUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setCropImageSrc(user.profilePhotoUrl || null);
                      setMenuView("crop");
                    }}
                    className="
                      flex-1 flex items-center justify-center gap-1
                      px-2.5 py-1.5
                      rounded-lg
                      bg-white/5 hover:bg-white/10
                      border border-white/10 hover:border-white/20
                      text-[11px] font-medium
                      text-zinc-200 hover:text-white
                      transition cursor-pointer
                    "
                  >
                    <Crop size={12} className="text-[#F8B4C8]" />
                    <span>Crop</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setMenuView("default");
                    setPhotoMenuOpen(true);
                  }}
                  className="
                    flex-1 flex items-center justify-center gap-1
                    px-2.5 py-1.5
                    rounded-lg
                    bg-[#F8B4C8] hover:opacity-95
                    text-[#161925] font-bold
                    text-[11px]
                    shadow-xs
                    transition cursor-pointer
                  "
                >
                  <Camera size={12} />
                  <span>Change</span>
                </button>

                {user?.profilePhotoUrl && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    disabled={isSavingPhoto}
                    title="Remove Photo"
                    className="
                      p-1.5
                      rounded-lg
                      bg-red-500/10 hover:bg-red-500/20
                      border border-red-500/20 hover:border-red-500/30
                      text-red-400 hover:text-red-300
                      transition cursor-pointer
                    "
                  >
                    {isSavingPhoto ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Trash2 size={12} />
                    )}
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* ── Default User Menu ── */
            <>
              {/* User Info Header with Avatar & Edit Pencil */}
              <div className="p-2 flex items-center gap-3 relative">
                <div className="relative group/avatar flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      if (user?.profilePhotoUrl) {
                        setMenuView("view_photo");
                      } else {
                        setPhotoMenuOpen((prev) => !prev);
                      }
                    }}
                    title={user?.profilePhotoUrl ? "View profile photo" : "Add profile picture"}
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
                    title="Photo options"
                    aria-label="Photo options"
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

                {/* Small Compact Photo Options Box (anchored to the left of the menu) */}
                {photoMenuOpen && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="
                      absolute
                      top-0
                      right-full
                      mr-2
                      w-48
                      rounded-xl
                      bg-[#1e2332]
                      border border-white/15
                      shadow-[0_12px_32px_rgba(0,0,0,0.85)]
                      p-1.5
                      z-50
                      animate-in fade-in slide-in-from-right-2
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
                            <div className="w-24 h-24 mx-auto rounded-full overflow-hidden border-2 border-[#F8B4C8] bg-black shadow-inner">
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
                                onClick={handleSnapForCrop}
                                className="px-2.5 py-1 rounded-lg bg-[#F8B4C8] text-[#161925] font-bold text-[11px] hover:opacity-90 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                              >
                                <Camera size={12} />
                                <span>Snap</span>
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
                        {user?.profilePhotoUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              setPhotoMenuOpen(false);
                              setMenuView("view_photo");
                            }}
                            className="
                              w-full flex items-center gap-2
                              px-2.5 py-1.5
                              rounded-lg
                              text-[12px] font-medium
                              text-zinc-200
                              hover:bg-white/10 hover:text-white
                              transition-colors
                              cursor-pointer
                            "
                          >
                            <Eye size={14} className="text-[#F8B4C8]" />
                            <span>View Photo</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={startCamera}
                          className="
                            w-full flex items-center gap-2
                            px-2.5 py-1.5
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
                            px-2.5 py-1.5
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
                              px-2.5 py-1.5
                              rounded-lg
                              text-[12px] font-medium
                              text-red-400
                              hover:bg-red-500/10 hover:text-red-300
                              transition-colors
                              cursor-pointer
                            "
                          >
                            {isSavingPhoto ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Trash2 size={14} />
                            )}
                            <span>Remove Photo</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="h-[1px] bg-white/10 my-2" />

              {/* Menu Actions (Discover removed) */}
              <div className="space-y-1">
                {profileComplete ? (
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
            </>
          )}
        </div>
      )}
    </div>
  );
}
