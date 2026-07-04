import { api, ApiResponse } from "./api";

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  related_id: string | null;
  related_type: string | null;
  created_at: string;
}

interface NotificationsResult {
  rows: Notification[];
  total: number;
}

export const notificationsApi = {
  getAll: () =>
    api.get<ApiResponse<NotificationsResult>>("/notifications"),

  markRead: (id: string) =>
    api.put<ApiResponse<null>>(`/notifications/${id}/read`, {}),

  markAllRead: () =>
    api.put<ApiResponse<null>>("/notifications/read-all", {}),

  delete: (id: string) =>
    api.delete<ApiResponse<null>>(`/notifications/${id}`),
};
