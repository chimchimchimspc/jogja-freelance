import { api, type ApiResponse, type PaginatedResponse } from "./api";

export interface AdminAnalytics {
  totalUsers: number;
  activeJobs: number;
  pendingJobs: number;
  totalEvents: number;
  pendingEvents: number;
  pendingBadgeVerifications: number;
  jobApplicationsToday: number;
  newUsersThisWeek: number;
  checkInsThisWeek: number;
}

export interface AnalyticsDetail {
  jobsByCategory: { category: string; count: number }[];
  eventsByType: { type: string; count: number }[];
  userGrowth: { date: string; count: number }[];
  applicationsTrend: { date: string; count: number }[];
  topSkills: { name: string; count: number }[];
  topCities: { city: string; count: number }[];
}

export interface ApiPendingJob {
  id: string;
  title: string;
  company_name: string | null;
  category: string | null;
  budget_min: number | null;
  budget_max: number | null;
  contact_email: string | null;
  created_at: string;
}

export interface ApiAdminJob extends ApiPendingJob {
  status: "draft" | "pending_review" | "active" | "closed" | "rejected";
  admin_notes: string | null;
  reviewed_at: string | null;
}

export interface ApiPendingEvent {
  id: string;
  title: string;
  type: string;
  event_date: string;
  event_time: string;
  organizer_name: string | null;
  location_name: string | null;
  organizer_email: string | null;
  created_at: string;
}

export interface ApiAdminEvent extends ApiPendingEvent {
  status: "pending_review" | "active" | "rejected";
  admin_notes: string | null;
  reviewed_at: string | null;
}

export interface ApiAdminUser {
  id: string;
  email: string;
  full_name: string;
  role: "freelancer" | "employer" | "event_organizer" | "admin";
  city: string | null;
  is_verified: boolean;
  created_at: string;
  last_login: string | null;
}

export interface ApiPendingBadge {
  user_badge_id: string;
  earned_at: string;
  user_id: string;
  full_name: string;
  email: string;
  badge_name: string;
  icon: string;
  rarity: string;
  event_id: string | null;
  event_title: string | null;
}

export interface ApiCategory {
  id: string;
  name: string;
  icon: string | null;
  created_at: string;
  job_count: number;
}

export interface ApiSkill {
  id: string;
  name: string;
  category: string | null;
  created_at: string;
  job_count: number;
}

export const adminApi = {
  getAnalytics: () => api.get<ApiResponse<AdminAnalytics>>("/admin/analytics"),
  getAnalyticsDetail: () => api.get<ApiResponse<AnalyticsDetail>>("/admin/analytics/detail"),

  listJobs: (query: { page?: number; limit?: number; status?: string; search?: string } = {}) => {
    const params = new URLSearchParams(
      Object.entries(query).filter(([, v]) => v !== undefined && v !== "").map(([k, v]) => [k, String(v)])
    );
    return api.get<PaginatedResponse<ApiAdminJob>>(`/admin/jobs?${params.toString()}`);
  },
  getPendingJobs: () => api.get<ApiResponse<ApiPendingJob[]>>("/admin/jobs/pending"),

  approveJob: (id: string) =>
    api.put<ApiResponse<unknown>>(`/admin/jobs/${id}/approve`, {}),

  rejectJob: (id: string, reason?: string) =>
    api.put<ApiResponse<null>>(`/admin/jobs/${id}/reject`, { reason }),

  listEvents: (query: { page?: number; limit?: number; status?: string; search?: string } = {}) => {
    const params = new URLSearchParams(
      Object.entries(query).filter(([, v]) => v !== undefined && v !== "").map(([k, v]) => [k, String(v)])
    );
    return api.get<PaginatedResponse<ApiAdminEvent>>(`/admin/events?${params.toString()}`);
  },
  getPendingEvents: () => api.get<ApiResponse<ApiPendingEvent[]>>("/admin/events/pending"),

  approveEvent: (id: string) =>
    api.put<ApiResponse<unknown>>(`/admin/events/${id}/approve`, {}),

  rejectEvent: (id: string, reason?: string) =>
    api.put<ApiResponse<null>>(`/admin/events/${id}/reject`, { reason }),

  listUsers: (query: { page?: number; limit?: number; role?: string; search?: string } = {}) => {
    const params = new URLSearchParams(
      Object.entries(query).filter(([, v]) => v !== undefined && v !== "").map(([k, v]) => [k, String(v)])
    );
    return api.get<ApiResponse<{ rows: ApiAdminUser[]; total: number }>>(`/admin/users?${params.toString()}`);
  },

  getPendingBadges: () => api.get<ApiResponse<ApiPendingBadge[]>>("/admin/badges/pending"),

  verifyUserBadge: (userBadgeId: string) =>
    api.put<ApiResponse<unknown>>(`/admin/badges/${userBadgeId}/verify`, {}),

  listCategories: () => api.get<ApiResponse<ApiCategory[]>>("/admin/categories"),
  createCategory: (data: { name: string; icon?: string }) =>
    api.post<ApiResponse<ApiCategory>>("/admin/categories", data),
  updateCategory: (id: string, data: { name?: string; icon?: string }) =>
    api.put<ApiResponse<ApiCategory>>(`/admin/categories/${id}`, data),
  deleteCategory: (id: string) => api.delete<ApiResponse<null>>(`/admin/categories/${id}`),

  listSkills: () => api.get<ApiResponse<ApiSkill[]>>("/admin/skills"),
  createSkill: (data: { name: string; category?: string }) =>
    api.post<ApiResponse<ApiSkill>>("/admin/skills", data),
  updateSkill: (id: string, data: { name?: string; category?: string }) =>
    api.put<ApiResponse<ApiSkill>>(`/admin/skills/${id}`, data),
  deleteSkill: (id: string) => api.delete<ApiResponse<null>>(`/admin/skills/${id}`),
};
