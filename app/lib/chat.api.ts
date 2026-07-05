import { api, type ApiResponse } from "./api";

export interface ApiError extends Error {
  status?: number;
  errors?: Array<{ msg?: string; path?: string }>;
}

export interface ApiConversation {
  id: string;
  created_at: string;
  updated_at: string;
  other_user_id: string;
  other_user_name: string;
  other_user_avatar?: string | null;
  last_message?: string | null;
  last_message_at?: string | null;
  unread_count: number;
}

export interface ApiMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

// Wrapper di atas api client utama — meng-unwrap { success, message, data }
export const chatApi = {
  conversations: () =>
    api.get<ApiResponse<ApiConversation[]>>("/chat/conversations").then((r) => r.data),

  start: (userId: string) =>
    api.post<ApiResponse<{ id: string }>>("/chat/conversations", { user_id: userId }).then((r) => r.data),

  messages: (conversationId: string) =>
    api.get<ApiResponse<ApiMessage[]>>(`/chat/conversations/${conversationId}/messages`).then((r) => r.data),

  send: (conversationId: string, body: string) =>
    api.post<ApiResponse<ApiMessage>>(`/chat/conversations/${conversationId}/messages`, { body }).then((r) => r.data),
};
