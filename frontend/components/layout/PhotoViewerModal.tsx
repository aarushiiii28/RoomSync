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
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="
          relative w-full max-w-sm
          rounded-3xl
          bg-[#131722]/95
          border border-white/15
          p-6
          shadow-[0_24px_64px_rgba(0,0,0,0.9)]
          text-white
          animate-in zoom-in-95 duration-150
        "
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#F8B4C8]/15 border border-[#F8B4C8]/30 flex items-center justify-center text-[#F8B4C8]">
              <Sparkles size={14} />
            </div>
            <div>
              <h3 className="text-[14px] font-bold text-white leading-tight">
                Profile Photo
              </h3>
              <p className="text-[11px] text-zinc-400">{displayName}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        {/* Large Avatar Photo Preview */}
        <div className="py-6 flex flex-col items-center justify-center">
          <div
            className="
              w-56 h-56
              rounded-full
              overflow-hidden
              border-4 border-[#F8B4C8]
              shadow-[0_0_32px_rgba(248,180,200,0.35)]
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
              <span className="text-[#F8B4C8] font-bold text-5xl select-none">
                {initials}
              </span>
            )}
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center justify-center gap-2 pt-3 border-t border-white/10">
          {photoUrl && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onEditCrop();
              }}
              className="
                flex-1 flex items-center justify-center gap-1.5
                px-3 py-2
                rounded-xl
                bg-white/5 hover:bg-white/10
                border border-white/10 hover:border-white/20
                text-[12px] font-medium
                text-zinc-200 hover:text-white
                transition cursor-pointer
              "
            >
              <Crop size={14} className="text-[#F8B4C8]" />
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
              flex-1 flex items-center justify-center gap-1.5
              px-3 py-2
              rounded-xl
              bg-[#F8B4C8] hover:opacity-95
              text-[#161925] font-bold
              text-[12px]
              shadow-sm
              transition cursor-pointer
            "
          >
            <Camera size={14} />
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
                p-2
                rounded-xl
                bg-red-500/10 hover:bg-red-500/20
                border border-red-500/20 hover:border-red-500/30
                text-red-400 hover:text-red-300
                transition cursor-pointer
              "
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
