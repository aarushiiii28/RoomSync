"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Check,
  X,
  Sparkles,
  Loader2,
  Move,
} from "lucide-react";

interface PhotoCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string | null;
  onSaveCropped: (croppedDataUrl: string) => Promise<void>;
}

export default function PhotoCropModal({
  isOpen,
  onClose,
  imageSrc,
  onSaveCropped,
}: PhotoCropModalProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const imgRef = useRef<HTMLImageElement | null>(null);
  const viewportSize = 210; // compact square crop viewport

  // Reset parameters when image changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setRotation(0);
      setPos({ x: 0, y: 0 });
      setImgLoaded(false);
    }
  }, [isOpen, imageSrc]);

  // Pointer drag handlers for panning
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    setDragStart({ x: e.clientX - pos.x, y: e.clientY - pos.y });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setPos({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
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

  // Rotate 90 degrees
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Reset crop settings
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setPos({ x: 0, y: 0 });
  };

  // Export cropped canvas
  const handleApplyCrop = async () => {
    if (!imgRef.current) return;
    const img = imgRef.current;
    setIsSaving(true);

    try {
      const outputSize = 400; // 400x400 high-res output
      const canvas = document.createElement("canvas");
      canvas.width = outputSize;
      canvas.height = outputSize;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        // Determine base scaling to cover the viewport
        const baseScale = Math.max(
          viewportSize / img.naturalWidth,
          viewportSize / img.naturalHeight
        );

        const ratio = outputSize / viewportSize;

        // Position at center of output canvas
        ctx.translate(outputSize / 2, outputSize / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.translate(pos.x * ratio, pos.y * ratio);

        const renderW = img.naturalWidth * baseScale * zoom * ratio;
        const renderH = img.naturalHeight * baseScale * zoom * ratio;

        ctx.drawImage(img, -renderW / 2, -renderH / 2, renderW, renderH);

        const croppedDataUrl = canvas.toDataURL("image/jpeg", 0.9);
        await onSaveCropped(croppedDataUrl);
        onClose();
      }
    } catch (err) {
      console.error("Error cropping image:", err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !imageSrc) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSaving) {
          onClose();
        }
      }}
    >
      <div
        className="
          relative w-full max-w-[280px]
          rounded-2xl
          bg-[#161a26]
          border border-white/15
          p-4
          shadow-[0_20px_50px_rgba(0,0,0,0.9)]
          text-white
          animate-in zoom-in-95 duration-150
        "
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
          <div className="flex items-center gap-1.5">
            <Sparkles size={14} className="text-[#F8B4C8]" />
            <h3 className="text-[13px] font-bold text-white">Crop Photo</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="w-6 h-6 rounded-md bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X size={13} />
          </button>
        </div>

        {/* Crop Viewport */}
        <div className="py-4 flex flex-col items-center">
          <div
            style={{ width: `${viewportSize}px`, height: `${viewportSize}px` }}
            className="
              relative
              rounded-2xl
              overflow-hidden
              bg-black
              select-none
              touch-none
              cursor-grab
              active:cursor-grabbing
              border border-white/10
              shadow-inner
            "
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onWheel={handleWheel}
          >
            {/* Hidden image element to get natural dimensions */}
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Source"
              onLoad={() => setImgLoaded(true)}
              className="absolute inset-0 m-auto pointer-events-none transition-transform duration-75 origin-center"
              style={{
                maxWidth: "none",
                maxHeight: "none",
                transform: `translate(${pos.x}px, ${pos.y}px) rotate(${rotation}deg) scale(${zoom})`,
                opacity: imgLoaded ? 1 : 0,
              }}
            />

            {/* Circular Vignette Overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {/* Circular guide outline */}
              <div
                style={{ width: `${viewportSize - 20}px`, height: `${viewportSize - 20}px` }}
                className="
                  rounded-full
                  border-2 border-[#F8B4C8]
                  shadow-[0_0_0_9999px_rgba(10,12,18,0.7)]
                "
              />
            </div>

            {/* Instruction tooltip */}
            <div className="absolute bottom-2 left-0 right-0 flex justify-center pointer-events-none">
              <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-[10px] text-zinc-300 flex items-center gap-1">
                <Move size={10} /> Drag to position • Scroll to zoom
              </span>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="w-full max-w-[260px] space-y-3 mt-4">
            {/* Zoom Slider */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setZoom((prev) => Math.max(1, prev - 0.2))}
                className="text-zinc-400 hover:text-white transition cursor-pointer p-1"
                title="Zoom Out"
              >
                <ZoomOut size={15} />
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
                className="text-zinc-400 hover:text-white transition cursor-pointer p-1"
                title="Zoom In"
              >
                <ZoomIn size={15} />
              </button>

              <button
                type="button"
                onClick={handleRotate}
                className="ml-2 p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-zinc-300 hover:text-white transition cursor-pointer"
                title="Rotate 90°"
              >
                <RotateCw size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={handleReset}
            disabled={isSaving}
            className="text-[12px] text-zinc-400 hover:text-white underline cursor-pointer"
          >
            Reset
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-3 py-1.5 rounded-xl border border-white/10 text-zinc-300 hover:bg-white/5 hover:text-white text-[12px] font-medium transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleApplyCrop}
              disabled={isSaving}
              className="px-4 py-1.5 rounded-xl bg-[#F8B4C8] text-[#161925] font-bold text-[12px] hover:opacity-95 flex items-center gap-1.5 transition cursor-pointer shadow-md active:scale-95"
            >
              {isSaving ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Check size={13} />
              )}
              <span>Save Crop</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
