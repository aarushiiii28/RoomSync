import api from "./api";
import { tokenStorage } from "./token";

export interface OtherUserInfo {
  id: string;
  username: string;
  display_name?: string | null;
  photo_url?: string | null;
}

export interface MessagePreview {
  content: string;
  sender_id: string;
  created_at: string;
  status: "sending" | "sent" | "delivered" | "read" | "failed";
}

export interface Conversation {
  id: string;
  other_user: OtherUserInfo;
  last_message: MessagePreview | null;
  unread_count: number;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  status: "sending" | "sent" | "delivered" | "read" | "failed";
  created_at: string;
  delivered_at: string | null;
  read_at: string | null;
  client_id?: string;
}

export async function createOrOpenConversation(candidateId: string): Promise<Conversation> {
  const resp = await api.post("/chat/conversations", { candidate_id: candidateId });
  return resp.data;
}

export async function listConversations(): Promise<Conversation[]> {
  const resp = await api.get("/chat/conversations");
  return resp.data;
}

export async function getMessages(
  conversationId: string,
  page = 1,
  pageSize = 50
): Promise<Message[]> {
  const resp = await api.get(`/chat/conversations/${conversationId}/messages`, {
    params: { page, page_size: pageSize },
  });
  return resp.data;
}

export async function markAsRead(conversationId: string): Promise<void> {
  await api.post(`/chat/conversations/${conversationId}/read`);
}

export function getChatWebSocketUrl(): string {
  const token = tokenStorage.getAccessToken();
  const baseUrl =
    (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000")
      .replace(/^http/, "ws")
      .replace(/^https/, "wss");
  return `${baseUrl}/chat/ws?token=${encodeURIComponent(token ?? "")}`;
}
