"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardGuard from "@/components/dashboard/DashboardGuard";
import Navbar from "@/components/layout/Navbar";
import ConversationList from "@/components/chat/ConversationList";
import ChatWindow from "@/components/chat/ChatWindow";
import { Conversation, listConversations } from "@/services/chat";
import { useChatWebSocket } from "@/hooks/useChatWebSocket";
import { useAuth } from "@/context/AuthContext";
import { MessageCircle, Moon, Sun } from "lucide-react";

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  const { wsStatus, sendMessage, onMessage, onStatusUpdate } = useChatWebSocket();

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      const convs = await listConversations();
      setConversations(convs);
      // If a conversationId is in the URL, activate it
      const urlId = params?.conversationId as string | undefined;
      if (urlId) {
        const match = convs.find((c) => c.id === urlId);
        if (match) setActiveConversation(match);
      }
    } catch {
      // ignore
    } finally {
      setLoadingConvs(false);
    }
  }, [params?.conversationId]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Update unread counts when a new message arrives via WS
  useEffect(() => {
    const unsubscribe = onMessage((msg) => {
      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id !== msg.conversation_id) return conv;
          const isActive = activeConversation?.id === msg.conversation_id;
          return {
            ...conv,
            last_message: {
              content: msg.content,
              sender_id: msg.sender_id,
              created_at: msg.created_at,
              status: msg.status,
            },
            unread_count:
              !isActive && msg.sender_id !== user?.id
                ? conv.unread_count + 1
                : conv.unread_count,
          };
        })
      );
    });
    
    return unsubscribe;
  }, [onMessage, activeConversation?.id, user?.id]);

  const handleSelectConversation = (conv: Conversation) => {
    setActiveConversation(conv);
    // Clear unread badge immediately on select
    setConversations((prev) =>
      prev.map((c) => (c.id === conv.id ? { ...c, unread_count: 0 } : c))
    );
    router.replace(`/dashboard/chat/${conv.id}`);
  };

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread_count, 0);

  return (
    <DashboardGuard>
      <div className="min-h-screen" style={{ background: "#0F1117" }}>
        <Navbar />

        <div
          className="flex flex-col md:flex-row relative overflow-hidden"
          style={{ height: "calc(100vh - 64px)", marginTop: "64px" }}
        >
          {/* Sidebar: Full width on mobile when no conversation active, w-80 on desktop */}
          <aside
            className={`
              w-full md:w-80 shrink-0 flex flex-col transition-colors duration-300
              ${activeConversation ? "hidden md:flex" : "flex"}
            `}
            style={{
              borderRight: theme === "dark" ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(0,0,0,0.07)",
              background: theme === "dark" ? "rgba(25,28,40,0.95)" : "rgba(255,255,255,0.95)",
              height: "100%",
            }}
          >
            {/* Sidebar header */}
            <div
              className="flex items-center justify-between px-5 py-4 shrink-0 transition-colors duration-300"
              style={{ borderBottom: theme === "dark" ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(0,0,0,0.07)" }}
            >
              <div className="flex items-center gap-2">
                <MessageCircle size={18} style={{ color: "#D97870" }} />
                <span className="text-[15px] font-semibold" style={{ color: theme === "dark" ? "#F8ECE8" : "#1F2937" }}>
                  Messages
                </span>
                {totalUnread > 0 && (
                  <span
                    className="text-[11px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: "#D97870", color: "#fff" }}
                  >
                    {totalUnread}
                  </span>
                )}
              </div>
              <button
                onClick={() => setTheme(prev => prev === "dark" ? "light" : "dark")}
                className="p-1.5 rounded-lg transition-colors hover:opacity-80 cursor-pointer"
                style={{
                  background: theme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                  color: theme === "dark" ? "#F8ECE8" : "#1F2937"
                }}
                title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
              >
                {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
              </button>
            </div>

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto">
              <ConversationList
                conversations={conversations}
                activeId={activeConversation?.id}
                onSelect={handleSelectConversation}
                loading={loadingConvs}
                theme={theme}
              />
            </div>
          </aside>

          {/* Chat area: Full width on mobile when conversation is active, flex-1 on desktop */}
          <main
            className={`
              flex-1 min-w-0 flex-col
              ${activeConversation ? "flex" : "hidden md:flex"}
            `}
            style={{ height: "100%" }}
          >
            {activeConversation && user ? (
              <ChatWindow
                key={activeConversation.id}
                conversationId={activeConversation.id}
                otherUser={activeConversation.other_user}
                currentUserId={user.id as string}
                sendMessage={sendMessage}
                onMessage={onMessage}
                onStatusUpdate={onStatusUpdate}
                theme={theme}
                onBack={() => setActiveConversation(null)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-4 p-6 text-center">
                <MessageCircle size={48} style={{ color: "rgba(139,146,165,0.3)" }} />
                <p className="text-[15px]" style={{ color: "#8b92a5" }}>
                  Select a conversation to start chatting
                </p>
              </div>
            )}
          </main>
        </div>
      </div>
    </DashboardGuard>
  );
}
