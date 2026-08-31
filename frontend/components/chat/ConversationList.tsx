"use client";

import React from "react";
import Image from "next/image";
import { Conversation } from "@/services/chat";

interface Props {
  conversations: Conversation[];
  activeId?: string;
  onSelect: (conv: Conversation) => void;
  loading?: boolean;
  theme?: "dark" | "light";
}

function formatPreviewTime(isoString: string): string {
  const d = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function Avatar({ name, photoUrl }: { name: string; photoUrl?: string | null }) {
  if (photoUrl) {
    return (
      <Image
        src={photoUrl}
        alt={name}
        width={44}
        height={44}
        className="rounded-full object-cover shrink-0 border-[1.5px] border-white/10"
      />
    );
  }
  const initials = name.slice(0, 2).toUpperCase();
  return (
    <div
      className="w-11 h-11 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0"
      style={{
        background: "linear-gradient(135deg, #494F66 0%, #3B4054 100%)",
        color: "#F8ECE8",
        border: "1.5px solid rgba(255,255,255,0.1)",
      }}
    >
      {initials}
    </div>
  );
}

export default function ConversationList({ conversations, activeId, onSelect, loading, theme = "dark" }: Props) {
  if (loading) {
    return (
      <div className="flex flex-col gap-2 p-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-16 rounded-xl animate-pulse"
            style={{ background: "rgba(255,255,255,0.05)" }}
          />
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-2">
        <p className="text-[13px]" style={{ color: "#8b92a5" }}>
          No conversations yet
        </p>
        <p className="text-[12px] text-center px-6" style={{ color: "#6b7280" }}>
          Start a chat from your matches
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {conversations.map((conv) => {
        const isActive = conv.id === activeId;
        const name = conv.other_user.display_name || conv.other_user.username;
        const previewText = conv.last_message
          ? conv.last_message.content.length > 42
            ? conv.last_message.content.slice(0, 42) + "…"
            : conv.last_message.content
          : "No messages yet";
        const previewTime = conv.last_message
          ? formatPreviewTime(conv.last_message.created_at)
          : formatPreviewTime(conv.created_at);

        return (
          <button
            key={conv.id}
            onClick={() => onSelect(conv)}
            className="flex items-center gap-3 px-4 py-3.5 text-left transition-all hover:opacity-90 cursor-pointer"
            style={{
              background: isActive 
                ? (theme === "dark" ? "rgba(217,120,112,0.12)" : "rgba(217,120,112,0.08)") 
                : "transparent",
              borderLeft: isActive ? "2px solid #D97870" : "2px solid transparent",
            }}
          >
            <Avatar name={name} photoUrl={conv.other_user.photo_url} />

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span
                  className="text-[14px] font-semibold truncate"
                  style={{ color: theme === "dark" ? "#F8ECE8" : "#1F2937" }}
                >
                  {name}
                </span>
                <span className="text-[11px] shrink-0" style={{ color: theme === "dark" ? "#8b92a5" : "#6B7280" }}>
                  {previewTime}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 mt-0.5">
                <span
                  className="text-[12.5px] truncate"
                  style={{
                    color: conv.unread_count > 0 
                      ? (theme === "dark" ? "#F8ECE8" : "#1F2937") 
                      : (theme === "dark" ? "#8b92a5" : "#6B7280"),
                    fontWeight: conv.unread_count > 0 ? 600 : 400,
                  }}
                >
                  {previewText}
                </span>
                {conv.unread_count > 0 && (
                  <span
                    className="shrink-0 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[11px] font-bold px-1"
                    style={{ background: "#D97870", color: "#fff" }}
                  >
                    {conv.unread_count > 99 ? "99+" : conv.unread_count}
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
