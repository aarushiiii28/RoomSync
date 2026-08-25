"use client";

import React from "react";
import {
  X,
  Crop,
  Camera,
  Trash2,
  Sparkles,
} from "lucide-react";

interface PhotoViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  photoUrl: string | null;
  displayName: string;
  initials: string;
  onEditCrop: () => void;
  onChangePhoto: () => void;
  onRemovePhoto: () => void;
}

export default function PhotoViewerModal({
  isOpen,
  onClose,
  photoUrl,
  displayName,
  initials,
  onEditCrop,
  onChangePhoto,
  onRemovePhoto,
}: PhotoViewerModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-start justify-end pt-28 pr-6 sm:pr-12 md:pr-20 lg:pr-28 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="
          relative w-full max-w-[260px]
          rounded-2xl
          bg-[#131722]/98
          border border-white/15
          p-4
          shadow-[0_20px_50px_rgba(0,0,0,0.9)]
          text-white
          backdrop-blur-xl
          animate-in zoom-in-95 slide-in-from-top-2 duration-150
        "
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
          <div className="flex items-center gap-1.5 min-w-0 pr-2">
            <Sparkles size={13} className="text-[#F8B4C8] shrink-0" />
            <h3 className="text-[12px] font-bold text-white truncate">
              {displayName}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-6 h-6 rounded-md bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X size={13} />
          </button>
        </div>

        {/* Compact Avatar Photo Preview */}
        <div className="py-3 flex flex-col items-center justify-center">
          <div
            className="
              w-36 h-36
              rounded-full
              overflow-hidden
              border-3 border-[#F8B4C8]
              shadow-[0_0_24px_rgba(248,180,200,0.25)]
              bg-[#161925]
              flex items-center justify-center
            "
          >
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-[#F8B4C8] font-bold text-4xl select-none">
                {initials}
              </span>
            )}
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center justify-center gap-1.5 pt-2.5 border-t border-white/10">
          {photoUrl && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onEditCrop();
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
              onClose();
              onChangePhoto();
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

          {photoUrl && (
            <button
              type="button"
              onClick={() => {
                onRemovePhoto();
                onClose();
              }}
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
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
