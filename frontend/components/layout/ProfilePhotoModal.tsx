"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Camera,
  Upload,
  Trash2,
  X,
  RotateCcw,
  Check,
  Sparkles,
  AlertCircle,
  FlipHorizontal,
  Loader2,
} from "lucide-react";

interface ProfilePhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPhotoUrl: string | null;
  initials: string;
  onSavePhoto: (photoUrl: string | null) => Promise<void>;
}

export default function ProfilePhotoModal({
  isOpen,
  onClose,
  currentPhotoUrl,
  initials,
  onSavePhoto,
}: ProfilePhotoModalProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(currentPhotoUrl);
  const [mode, setMode] = useState<"options" | "camera">("options");
  const [isSaving, setIsSaving] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);
  const [activeDeviceId, setActiveDeviceId] = useState<string | undefined>(undefined);
  const [isCapturing, setIsCapturing] = useState(false);
  const [flashEffect, setFlashEffect] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Sync with currentPhotoUrl when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedPhoto(currentPhotoUrl);
      setMode("options");
      setCameraError(null);
    }
  }, [isOpen, currentPhotoUrl]);

  // Clean up camera stream
  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Stop camera when closing modal or switching away from camera mode
  useEffect(() => {
    if (!isOpen || mode !== "camera") {
      stopCameraStream();
    }
    return () => {
      stopCameraStream();
    };
  }, [isOpen, mode, stopCameraStream]);

  // Start camera stream
  const startCamera = useCallback(async (deviceId?: string) => {
    setCameraError(null);
    stopCameraStream();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera is not supported on this browser/device.");
      }

      const constraints: MediaStreamConstraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId } }
          : { facingMode: "user", width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Enumerate available video input devices for switching
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === "videoinput");
        setCameraDevices(videoInputs);
      } catch {
        // ignore device enumeration error
      }
    } catch (err: unknown) {
      console.error("Camera access error:", err);
      const errorMsg =
        err instanceof Error
          ? err.message
          : "Unable to access camera. Please check permissions.";
      setCameraError(
        errorMsg.includes("Permission") || errorMsg.includes("NotAllowedError")
          ? "Camera permission was denied. Please allow camera access in your browser settings or choose a photo from your device."
          : "Could not start camera. Please verify your camera is connected or upload a photo from your device."
      );
    }
  }, [stopCameraStream]);

  // Switch camera when requested
  const handleSwitchCamera = () => {
    if (cameraDevices.length <= 1) return;
    const currentIndex = cameraDevices.findIndex((d) => d.deviceId === activeDeviceId);
    const nextIndex = (currentIndex + 1) % cameraDevices.length;
    const nextDevice = cameraDevices[nextIndex];
    setActiveDeviceId(nextDevice.deviceId);
    void startCamera(nextDevice.deviceId);
  };

  // Switch to camera mode
  const handleOpenLiveCamera = () => {
    setMode("camera");
    void startCamera(activeDeviceId);
  };

  // Capture snapshot from video stream
  const handleCaptureSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    setIsCapturing(true);
    setFlashEffect(true);
    setTimeout(() => setFlashEffect(false), 200);

    const canvas = document.createElement("canvas");
    const size = Math.min(video.videoWidth, video.videoHeight);
    canvas.width = 400;
    canvas.height = 400;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      // Calculate center crop
      const sx = (video.videoWidth - size) / 2;
      const sy = (video.videoHeight - size) / 2;

      // Mirror capture to match user expectation (selfie)
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);

      ctx.drawImage(video, sx, sy, size, size, 0, 0, canvas.width, canvas.height);

      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      setSelectedPhoto(dataUrl);
      stopCameraStream();
      setMode("options");
    }
    setIsCapturing(false);
  };

  // Handle local file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file (JPEG, PNG, WEBP, etc.)");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDim = 400;
        let width = img.width;
        let height = img.height;

        // Crop square from center
        const minDim = Math.min(width, height);
        const sx = (width - minDim) / 2;
        const sy = (height - minDim) / 2;

        canvas.width = maxDim;
        canvas.height = maxDim;

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, maxDim, maxDim);
          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.85);
          setSelectedPhoto(compressedDataUrl);
        }
      };
      if (typeof event.target?.result === "string") {
        img.src = event.target.result;
      }
    };
    reader.readAsDataURL(file);

    // Reset input so re-selecting same file triggers change
    e.target.value = "";
  };

  // Remove photo (revert to initials)
  const handleRemovePhoto = () => {
    setSelectedPhoto(null);
  };

  // Save changes
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSavePhoto(selectedPhoto);
      onClose();
    } catch (err) {
      console.error("Error saving photo:", err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const hasChanges = selectedPhoto !== currentPhotoUrl;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSaving) {
          onClose();
        }
      }}
    >
      <div
        className="
          relative w-full max-w-md
          rounded-3xl
          bg-[#121620]/95
          border border-white/15
          p-6
          shadow-[0_24px_64px_rgba(0,0,0,0.85)]
          backdrop-blur-2xl
          text-white
          animate-in zoom-in-95 duration-200
        "
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#F8B4C8]/15 border border-[#F8B4C8]/30 flex items-center justify-center text-[#F8B4C8]">
              <Sparkles size={16} />
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-white tracking-tight">
                {mode === "camera" ? "Take Profile Photo" : "Profile Picture"}
              </h2>
              <p className="text-[12px] text-zinc-400">
                {mode === "camera"
                  ? "Center your face in the frame"
                  : "Upload from device or capture with camera"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              stopCameraStream();
              onClose();
            }}
            disabled={isSaving}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Modal Body */}
        {mode === "camera" ? (
          /* ── Camera Viewfinder Mode ── */
          <div className="py-5 space-y-4">
            {cameraError ? (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-[13px] flex items-start gap-3">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p>{cameraError}</p>
                  <button
                    type="button"
                    onClick={() => setMode("options")}
                    className="text-[12px] font-semibold text-white underline hover:no-underline"
                  >
                    Back to options
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="relative w-64 h-64 mx-auto rounded-full overflow-hidden border-4 border-[#F8B4C8] shadow-[0_0_30px_rgba(248,180,200,0.3)] bg-black">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover scale-x-[-1]"
                  />

                  {/* Flash snapshot animation */}
                  {flashEffect && (
                    <div className="absolute inset-0 bg-white opacity-80 animate-ping" />
                  )}

                  {/* Framing guideline overlay */}
                  <div className="absolute inset-0 rounded-full border border-white/20 pointer-events-none" />
                </div>

                {/* Camera Controls */}
                <div className="flex items-center justify-center gap-4 pt-2">
                  {cameraDevices.length > 1 && (
                    <button
                      type="button"
                      onClick={handleSwitchCamera}
                      title="Switch Camera"
                      className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                    >
                      <FlipHorizontal size={18} />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleCaptureSnapshot}
                    disabled={isCapturing}
                    className="
                      px-6 py-3
                      rounded-full
                      bg-[#F8B4C8]
                      text-[#161925]
                      font-bold
                      text-[14px]
                      shadow-[0_4px_20px_rgba(248,180,200,0.4)]
                      hover:scale-105
                      active:scale-95
                      transition-all
                      flex items-center gap-2
                      cursor-pointer
                    "
                  >
                    <Camera size={18} />
                    <span>Snap Photo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      stopCameraStream();
                      setMode("options");
                    }}
                    className="px-4 py-3 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white text-[13px] font-medium transition cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          /* ── Main Photo Options & Preview Mode ── */
          <div className="py-6 space-y-6">
            {/* Center Avatar Preview */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative group">
                <div
                  className="
                    w-28 h-28
                    rounded-full
                    overflow-hidden
                    border-4 border-[#F8B4C8]/80
                    shadow-[0_0_24px_rgba(248,180,200,0.35)]
                    bg-[#161925]
                    flex items-center justify-center
                    transition-transform duration-200
                  "
                >
                  {selectedPhoto ? (
                    <img
                      src={selectedPhoto}
                      alt="Avatar Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[#F8B4C8] font-bold text-3xl select-none">
                      {initials}
                    </span>
                  )}
                </div>

                {selectedPhoto && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    title="Remove Photo"
                    className="
                      absolute -bottom-1 -right-1
                      w-8 h-8
                      rounded-full
                      bg-red-500/90
                      hover:bg-red-600
                      text-white
                      border-2 border-[#121620]
                      flex items-center justify-center
                      shadow-md
                      hover:scale-110
                      transition-all
                      cursor-pointer
                    "
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>

              <p className="text-[12px] text-zinc-400 mt-2.5">
                {selectedPhoto
                  ? hasChanges
                    ? "New photo selected • Click Save to apply"
                    : "Current active profile photo"
                  : "Using initial avatar letters"}
              </p>
            </div>

            {/* Action Buttons Grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Option 1: Live Camera */}
              <button
                type="button"
                onClick={handleOpenLiveCamera}
                className="
                  p-4
                  rounded-2xl
                  border border-white/10
                  bg-white/5
                  hover:bg-white/10
                  hover:border-[#F8B4C8]/40
                  hover:shadow-[0_0_16px_rgba(248,180,200,0.15)]
                  flex flex-col items-center justify-center gap-2.5
                  text-center
                  group
                  transition-all duration-200
                  cursor-pointer
                "
              >
                <div className="w-10 h-10 rounded-full bg-[#F8B4C8]/15 group-hover:bg-[#F8B4C8]/25 text-[#F8B4C8] flex items-center justify-center transition-colors">
                  <Camera size={20} />
                </div>
                <div>
                  <span className="text-[13px] font-semibold text-white block">
                    Take Photo
                  </span>
                  <span className="text-[11px] text-zinc-400">Use live camera</span>
                </div>
              </button>

              {/* Option 2: Device File Browse */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="
                  p-4
                  rounded-2xl
                  border border-white/10
                  bg-white/5
                  hover:bg-white/10
                  hover:border-[#F8B4C8]/40
                  hover:shadow-[0_0_16px_rgba(248,180,200,0.15)]
                  flex flex-col items-center justify-center gap-2.5
                  text-center
                  group
                  transition-all duration-200
                  cursor-pointer
                "
              >
                <div className="w-10 h-10 rounded-full bg-[#F8B4C8]/15 group-hover:bg-[#F8B4C8]/25 text-[#F8B4C8] flex items-center justify-center transition-colors">
                  <Upload size={20} />
                </div>
                <div>
                  <span className="text-[13px] font-semibold text-white block">
                    Upload File
                  </span>
                  <span className="text-[11px] text-zinc-400">Browse device</span>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        {mode === "options" && (
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="
                px-4 py-2.5
                rounded-xl
                border border-white/10
                text-[13px] font-medium
                text-zinc-300
                hover:bg-white/5
                hover:text-white
                transition
                cursor-pointer
              "
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className={`
                px-5 py-2.5
                rounded-xl
                font-bold
                text-[13px]
                flex items-center gap-2
                transition-all duration-150
                cursor-pointer
                ${
                  hasChanges && !isSaving
                    ? "bg-[#F8B4C8] text-[#161925] hover:opacity-95 hover:shadow-[0_4px_16px_rgba(248,180,200,0.4)]"
                    : "bg-white/10 text-zinc-500 cursor-not-allowed"
                }
              `}
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check size={16} />
                  <span>Save Photo</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
