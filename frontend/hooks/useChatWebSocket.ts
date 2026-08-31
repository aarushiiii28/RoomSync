"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Message } from "@/services/chat";
import { getChatWebSocketUrl } from "@/services/chat";

export type WsStatus = "connecting" | "connected" | "disconnected" | "error";

export interface StatusUpdate {
  message_id?: string;
  conversation_id?: string;
  event?: "read" | "queue_failed";
  reader_id?: string;
  status?: "sent" | "delivered" | "read" | "failed";
  client_ids?: string[];
}

interface UseChatWebSocketReturn {
  wsStatus: WsStatus;
  sendMessage: (conversationId: string, content: string, clientId?: string) => boolean;
  onMessage: (handler: (msg: Message) => void) => void;
  onStatusUpdate: (handler: (update: StatusUpdate) => void) => void;
}

export function useChatWebSocket(): UseChatWebSocketReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const [wsStatus, setWsStatus] = useState<WsStatus>("disconnected");
  const messageHandlerRef = useRef<((msg: Message) => void) | null>(null);
  const statusHandlerRef = useRef<((update: StatusUpdate) => void) | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldConnectRef = useRef(true);
  const reconnectAttemptRef = useRef(0);
  
  // In-memory message queue
  const messageQueueRef = useRef<{ conversationId: string; content: string; clientId?: string }[]>([]);

  const connect = useCallback(() => {
    if (!shouldConnectRef.current) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const url = getChatWebSocketUrl();
    if (!url.includes("token=") || url.endsWith("token=")) {
      // No token — user not logged in, don't connect
      setWsStatus("disconnected");
      return;
    }

    setWsStatus("connecting");
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsStatus("connected");
      reconnectAttemptRef.current = 0;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      // Flush queue
      const queue = [...messageQueueRef.current];
      messageQueueRef.current = [];
      queue.forEach((msg) => {
        ws.send(JSON.stringify({
          type: "message",
          conversation_id: msg.conversationId,
          content: msg.content,
          client_id: msg.clientId
        }));
      });
    };

    ws.onmessage = (event) => {
      try {
        const frame = JSON.parse(event.data);
        if (frame.type === "message" && messageHandlerRef.current) {
          messageHandlerRef.current(frame.payload as Message);
        } else if (frame.type === "status_update" && statusHandlerRef.current) {
          statusHandlerRef.current(frame.payload as StatusUpdate);
        }
      } catch {
        // ignore malformed frames
      }
    };

    ws.onerror = () => {
      setWsStatus("error");
    };

    ws.onclose = () => {
      wsRef.current = null;
      if (shouldConnectRef.current) {
        if (reconnectAttemptRef.current >= 5) {
          // Exhausted attempts, mark queue as failed
          setWsStatus("disconnected");
          const failedIds = messageQueueRef.current.map((m) => m.clientId).filter(Boolean) as string[];
          if (failedIds.length > 0 && statusHandlerRef.current) {
            statusHandlerRef.current({ event: "queue_failed", client_ids: failedIds });
          }
          messageQueueRef.current = [];
          return;
        }
        
        setWsStatus("disconnected");
        const baseDelay = 1000;
        const maxDelay = 8000;
        const delay = Math.min(baseDelay * Math.pow(2, reconnectAttemptRef.current), maxDelay);
        reconnectAttemptRef.current += 1;
        reconnectTimeoutRef.current = setTimeout(connect, delay);
      }
    };
  }, []);

  useEffect(() => {
    shouldConnectRef.current = true;
    connect();

    return () => {
      shouldConnectRef.current = false;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      wsRef.current?.close(1000, "Component unmounted");
      wsRef.current = null;
    };
  }, [connect]);

  const sendMessage = useCallback((conversationId: string, content: string, clientId?: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({ type: "message", conversation_id: conversationId, content, client_id: clientId })
      );
      return true;
    } else if (shouldConnectRef.current) {
      // Queue it if we're trying to reconnect
      messageQueueRef.current.push({ conversationId, content, clientId });
      return true;
    }
    return false; // Total failure
  }, []);

  const onMessage = useCallback((handler: (msg: Message) => void) => {
    messageHandlerRef.current = handler;
  }, []);

  const onStatusUpdate = useCallback((handler: (update: StatusUpdate) => void) => {
    statusHandlerRef.current = handler;
  }, []);

  return { wsStatus, sendMessage, onMessage, onStatusUpdate };
}
