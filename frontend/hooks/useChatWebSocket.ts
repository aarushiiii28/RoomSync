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
  client_id?: string;
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
  const messageHandlersRef = useRef<Set<(msg: Message) => void>>(new Set());
  const statusHandlersRef = useRef<Set<(update: StatusUpdate) => void>>(new Set());
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
        if (frame.type === "message") {
          messageHandlersRef.current.forEach(handler => handler(frame.payload as Message));
        } else if (frame.type === "status_update") {
          statusHandlersRef.current.forEach(handler => handler(frame.payload as StatusUpdate));
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
          setWsStatus("disconnected");
          const failedIds = messageQueueRef.current.map((m) => m.clientId).filter(Boolean) as string[];
          if (failedIds.length > 0) {
            statusHandlersRef.current.forEach(handler => handler({ event: "queue_failed", client_ids: failedIds }));
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
      messageQueueRef.current.push({ conversationId, content, clientId });
      return true;
    }
    return false;
  }, []);

  const onMessage = useCallback((handler: (msg: Message) => void) => {
    messageHandlersRef.current.add(handler);
    return () => {
      messageHandlersRef.current.delete(handler);
    };
  }, []);

  const onStatusUpdate = useCallback((handler: (update: StatusUpdate) => void) => {
    statusHandlersRef.current.add(handler);
    return () => {
      statusHandlersRef.current.delete(handler);
    };
  }, []);

  return { wsStatus, sendMessage, onMessage, onStatusUpdate };
}
