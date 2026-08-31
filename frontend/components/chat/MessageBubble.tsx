"use client";

import React from "react";
import { Message } from "@/services/chat";

interface Props {
  message: Message;
  isMine: boolean;
  onRetry?: (message: Message) => void;
  theme?: "dark" | "light";
}

function StatusTicks({ status, onRetry }: { status: Message["status"], onRetry?: () => void }) {
  if (status === "sending") {
    // Little clock icon
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block ml-1 shrink-0">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
      </svg>
    );
  }
  if (status === "failed") {
    // Red exclamation / error icon with clickable retry
    return (
      <button onClick={onRetry} className="inline-flex items-center ml-1 focus:outline-none" title="Tap to retry">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 cursor-pointer">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </button>
    );
  }
  if (status === "sent") {
    // Single grey tick
    return (
      <svg width="12" height="9" viewBox="0 0 12 9" fill="none" className="inline-block ml-1 shrink-0">
        <path d="M1 4.5L4.5 8L11 1" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (status === "delivered") {
    // Double grey ticks
    return (
      <svg width="16" height="9" viewBox="0 0 16 9" fill="none" className="inline-block ml-1 shrink-0">
        <path d="M1 4.5L4.5 8L11 1" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 4.5L8.5 8L15 1" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  // read — double green ticks
  return (
    <svg width="16" height="9" viewBox="0 0 16 9" fill="none" className="inline-block ml-1 shrink-0">
      <path d="M1 4.5L4.5 8L11 1" stroke="#34D399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 4.5L8.5 8L15 1" stroke="#34D399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function formatTime(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function MessageBubble({ message, isMine, onRetry, theme = "dark" }: Props) {
  const isFailed = message.status === "failed";
  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"} mb-1.5`}>
      <div className="flex flex-col items-end">
        <div
          className={`relative w-fit min-w-[5.5rem] max-w-[72%] px-3.5 pt-2 pb-6 rounded-2xl text-[14px] leading-relaxed break-words ${isFailed ? "opacity-75" : ""}`}
          style={{
            background: isMine
              ? "linear-gradient(135deg, #D97870 0%, #C9605A 100%)"
              : (theme === "dark" ? "rgba(255,255,255,0.07)" : "#ffffff"),
            color: isMine ? "#fff" : (theme === "dark" ? "#F8ECE8" : "#374151"),
            border: !isMine && theme === "light" ? "1px solid rgba(0,0,0,0.08)" : "none",
            borderRadius: isMine
              ? "18px 18px 4px 18px"
              : "18px 18px 18px 4px",
            boxShadow: isMine
              ? "0 2px 8px rgba(217,120,112,0.3)"
              : "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          {/* Message content */}
          <div className={`whitespace-pre-wrap break-words ${isMine ? "text-right" : "text-left"}`}>
            {message.content}
          </div>

          {/* Timestamp + status ticks */}
          <div
            className="absolute bottom-1.5 right-3.5 text-[10px] select-none whitespace-nowrap flex items-center"
            style={{ color: isMine ? "rgba(255,255,255,0.8)" : (theme === "dark" ? "rgba(248,236,232,0.6)" : "rgba(55,65,81,0.6)") }}
          >
            {formatTime(message.created_at)}
            {isMine && <StatusTicks status={message.status} onRetry={() => onRetry?.(message)} />}
          </div>
        </div>
        {isFailed && isMine && (
          <button 
            onClick={() => onRetry?.(message)}
            className="text-[10px] text-red-400 mt-1 mr-1 font-medium hover:underline focus:outline-none"
          >
            Failed to send. Tap to retry.
          </button>
        )}
      </div>
    </div>
  );
}
