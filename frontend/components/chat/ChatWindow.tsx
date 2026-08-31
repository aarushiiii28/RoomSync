"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { SmilePlus, Send, X, ArrowLeft } from "lucide-react";
import { Message, getMessages, markAsRead } from "@/services/chat";
import { StatusUpdate } from "@/hooks/useChatWebSocket";
import MessageBubble from "./MessageBubble";

// Dynamically import emoji picker to avoid SSR issues with emoji-mart
const EmojiPicker = dynamic(() => import("@emoji-mart/react"), { ssr: false });

interface Props {
  conversationId: string;
  otherUser: { id: string; username: string; display_name?: string | null; photo_url?: string | null };
  currentUserId: string;
  sendMessage: (conversationId: string, content: string, clientId?: string) => boolean;
  onMessage: (handler: (msg: Message) => void) => void;
  onStatusUpdate: (handler: (update: StatusUpdate) => void) => void;
  theme?: "dark" | "light";
  onBack?: () => void;
}

export default function ChatWindow({
  conversationId,
  otherUser,
  currentUserId,
  sendMessage,
  onMessage,
  onStatusUpdate,
  theme = "dark",
  onBack,
}: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);
  const prevConvIdRef = useRef<string>("");

  // Load message history when conversation changes
  useEffect(() => {
    if (!conversationId || conversationId === prevConvIdRef.current) return;
    prevConvIdRef.current = conversationId;

    setLoading(true);
    setMessages([]);

    getMessages(conversationId)
      .then((msgs) => {
        setMessages(msgs);
        markAsRead(conversationId).catch(() => {});
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [conversationId]);

  // Mark as read whenever we open / focus
  useEffect(() => {
    if (conversationId && !loading) {
      markAsRead(conversationId).catch(() => {});
    }
  }, [conversationId, loading]);

  // Register WebSocket message handler
  useEffect(() => {
    const unsubscribe = onMessage((msg) => {
      if (msg.conversation_id !== conversationId) return;
      setMessages((prev) => {
        // If there's a client_id on the incoming message, replace our optimistic message
        if (msg.client_id) {
          const idx = prev.findIndex(m => m.client_id === msg.client_id);
          if (idx !== -1) {
            const next = [...prev];
            next[idx] = msg;
            return next;
          }
        }
        // Otherwise deduplicate by id
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      // Auto-mark as read if the message is from the other user AND window is focused
      if (msg.sender_id !== currentUserId && document.visibilityState === "visible") {
        markAsRead(conversationId).catch(() => {});
      }
    });
    return unsubscribe;
  }, [conversationId, currentUserId, onMessage]);

  // Mark as read when window comes into focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        markAsRead(conversationId).catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [conversationId]);

  // Register status update handler
  useEffect(() => {
    const unsubscribe = onStatusUpdate((update) => {
      // Handle delivered/sent status change for a specific message
      if (update.message_id && update.status) {
        setMessages((prev) =>
          prev.map((m) => {
            const matchById = m.id === update.message_id;
            const matchByClientId = update.client_id && m.client_id === update.client_id;
            if (matchById || matchByClientId) {
              return { ...m, id: update.message_id!, status: update.status! };
            }
            return m;
          })
        );
      }
      
      // Handle queue_failed event (all optimistically queued messages failed)
      if (update.event === "queue_failed" && update.client_ids) {
        setMessages((prev) => 
          prev.map((m) => 
            m.client_id && update.client_ids?.includes(m.client_id)
              ? { ...m, status: "failed" }
              : m
          )
        );
      }
      
      // Handle read event — the other person opened and read the conversation
      if (update.event === "read" && update.conversation_id === conversationId) {
         setMessages((prev) =>
          prev.map((m) =>
            m.sender_id === currentUserId && (m.status === "sent" || m.status === "delivered")
              ? { ...m, status: "read" }
              : m
          )
        );
      }
    });
    return unsubscribe;
  }, [conversationId, currentUserId, onStatusUpdate]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Close emoji picker on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setShowEmoji(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;
    
    const clientId = typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID() 
      : 'temp_' + Math.random().toString(36).substring(2, 15);
      
    const optimisticMsg: Message = {
      id: clientId, // Temporary ID
      client_id: clientId,
      conversation_id: conversationId,
      sender_id: currentUserId,
      content: trimmed,
      status: "sending",
      created_at: new Date().toISOString(),
      delivered_at: null,
      read_at: null,
    };
    
    setMessages(prev => [...prev, optimisticMsg]);
    setInput("");
    inputRef.current?.focus();
    
    const success = sendMessage(conversationId, trimmed, clientId);
    if (!success) {
      setMessages(prev => prev.map(m => m.client_id === clientId ? { ...m, status: "failed" } : m));
    }
  }, [input, conversationId, currentUserId, sendMessage]);

  const handleRetry = useCallback((failedMsg: Message) => {
    // Mark back to sending
    setMessages(prev => prev.map(m => m.id === failedMsg.id ? { ...m, status: "sending" } : m));
    const success = sendMessage(conversationId, failedMsg.content, failedMsg.client_id);
    if (!success) {
      setTimeout(() => {
        setMessages(prev => prev.map(m => m.id === failedMsg.id ? { ...m, status: "failed" } : m));
      }, 500); // Small delay to let the user see it tried
    }
  }, [conversationId, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiSelect = (emoji: { native: string }) => {
    setInput((prev) => prev + emoji.native);
    setShowEmoji(false);
    inputRef.current?.focus();
  };

  const displayName = otherUser.display_name || otherUser.username;

  return (
    <div className="flex flex-col h-full" style={{ background: theme === "dark" ? "#2D3246" : "#F3F4F6" }}>
      {/* Header */}
      <div
        className="px-4 py-3.5 flex items-center justify-between shrink-0"
        style={{ borderBottom: theme === "dark" ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(0,0,0,0.07)" }}
      >
        <div className="flex items-center gap-2.5 sm:gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="md:hidden p-1.5 -ml-1 text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Back to conversations"
            >
              <ArrowLeft size={18} />
            </button>
          )}

          <Link
            href={`/dashboard/matches/${otherUser.id}`}
            className="flex items-center gap-2.5 sm:gap-3 hover:opacity-80 transition-opacity"
          >
            {otherUser.photo_url ? (
              <Image
                src={otherUser.photo_url}
                alt={displayName}
                width={36}
                height={36}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover shrink-0 border border-white/10"
              />
            ) : (
              <div
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-[11px] sm:text-[12px] font-bold shrink-0"
                style={{
                  background: "linear-gradient(135deg, #494F66 0%, #3B4054 100%)",
                  color: "#F8ECE8",
                }}
              >
                {displayName.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-[13.5px] sm:text-[14px] font-semibold truncate max-w-[140px] sm:max-w-[200px]" style={{ color: theme === "dark" ? "#F8ECE8" : "#1F2937" }}>
                {displayName}
              </p>
            </div>
          </Link>
        </div>
        
        <Link
          href="/dashboard"
          className="text-[12px] sm:text-[13px] font-medium hover:underline flex items-center gap-1 shrink-0"
          style={{ color: theme === "dark" ? "#9CA3AF" : "#6B7280" }}
        >
          &larr; <span className="hidden sm:inline">Back To</span> Matches
        </Link>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-2" style={{ scrollbarWidth: "thin" }}>
        {loading ? (
          <div className="flex items-center justify-center h-24">
            <span className="text-[13px]" style={{ color: theme === "dark" ? "#8b92a5" : "#6B7280" }}>
              Loading messages…
            </span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 pb-16 opacity-80">
            <p className="text-[14px] font-medium" style={{ color: theme === "dark" ? "#8b92a5" : "#6B7280" }}>
              No messages yet
            </p>
            <p className="text-[13px]" style={{ color: theme === "dark" ? "#6b7280" : "#9CA3AF" }}>
              Say hello! 👋
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isMine={msg.sender_id === currentUserId}
              onRetry={handleRetry}
              theme={theme}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div
        className="px-4 py-3 shrink-0 relative"
        style={{ borderTop: theme === "dark" ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(0,0,0,0.07)" }}
      >
        {/* Emoji picker */}
        {showEmoji && (
          <div
            ref={emojiRef}
            className="absolute bottom-16 right-4 z-50 shadow-2xl"
          >
            <EmojiPicker
              onEmojiSelect={handleEmojiSelect}
              theme={theme}
              previewPosition="none"
              skinTonePosition="none"
            />
          </div>
        )}

        <div
          className="flex items-end gap-2 rounded-xl px-3 py-2"
          style={{ 
            background: theme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.6)", 
            border: theme === "dark" ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.1)" 
          }}
        >
          {/* Emoji toggle */}
          <button
            onClick={() => setShowEmoji((v) => !v)}
            className="p-1.5 rounded-lg transition-colors hover:opacity-80 shrink-0 self-end mb-0.5"
            style={{ color: showEmoji ? "#D97870" : (theme === "dark" ? "#8b92a5" : "#6B7280") }}
            title="Emoji"
          >
            {showEmoji ? <X size={18} /> : <SmilePlus size={18} />}
          </button>

          {/* Text input — auto-grow, max 4 rows */}
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message…"
            rows={1}
            maxLength={2000}
            className="flex-1 resize-none bg-transparent outline-none text-[14px] leading-relaxed py-1"
            style={{
              color: theme === "dark" ? "#F8ECE8" : "#1F2937",
              maxHeight: "100px",
              overflowY: "auto",
            }}
            onInput={(e) => {
              const t = e.currentTarget;
              t.style.height = "auto";
              t.style.height = Math.min(t.scrollHeight, 100) + "px";
            }}
          />

          {/* Send button */}
          <button
            onClick={handleSend}
            onMouseDown={(e) => e.preventDefault()}
            disabled={!input.trim()}
            className="p-1.5 rounded-lg transition-all shrink-0 self-end mb-0.5"
            style={{
              color: input.trim() ? "#D97870" : (theme === "dark" ? "#4b5563" : "#9CA3AF"),
              transform: input.trim() ? "scale(1.05)" : "scale(1)",
              transition: "all 0.15s ease",
            }}
            title="Send (Enter)"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
