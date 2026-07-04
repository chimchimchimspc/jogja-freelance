import { api, type ApiResponse, type PaginatedResponse } from "./api";

export interface ApiJob {
  id: string;
  title: string;
  company: string;
  category: string;
  description: string;
  budget_min: number;
  budget_max: number;
  budget_type: "fixed" | "hourly";
  deadline_days: number;
  deadline_date: string;
  location: string;
  location_type: "Remote" | "Onsite" | "Hybrid";
  experience_level: "Junior" | "Mid" | "Senior";
  contact_whatsapp?: string;
  contact_email: string;
  status: string;
  view_count: number;
  application_count: number;
  created_at: string;
  skills: string[];
  requirements?: string[];
}

export interface ApiApplication {
  id: string;
  job_id: string;
  job_title: string;
  company: string;
  category: string;
  cover_letter: string;
  status: "pending" | "reviewed" | "accepted" | "rejected" | "expired";
  submitted_at: string;
  reviewed_at?: string;
  expires_at: string;
  budget_min: number;
  budget_max: number;
}

export interface JobsQuery {
  page?: number;
  limit?: number;
  category?: string;
  location_type?: string;
  experience_level?: string;
  budget_min?: number;
  budget_max?: number;
  skill?: string;
  sort?: string;
  search?: string;
}

export const jobsApi = {
  list: (query: JobsQuery = {}) => {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== "" && v !== null) params.set(k, String(v));
    });
    const qs = params.toString();
    return api.get<PaginatedResponse<ApiJob>>(`/jobs${qs ? `?${qs}` : ""}`);
  },

  get: (id: string) => api.get<ApiResponse<ApiJob>>(`/jobs/${id}`),

  create: (data: Partial<ApiJob> & { skills?: string[]; requirements?: string[] }) =>
    api.post<ApiResponse<ApiJob>>("/jobs", data),

  myApplications: (query: { page?: number; limit?: number; status?: string } = {}) => {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => {
      if (v) params.set(k, String(v));
    });
    const qs = params.toString();
    return api.get<PaginatedResponse<ApiApplication>>(`/applications${qs ? `?${qs}` : ""}`);
  },

  apply: (job_id: string, cover_letter: string) =>
    api.post<ApiResponse<{ id: string; status: string }>>("/applications", { job_id, cover_letter }),

  withdraw: (applicationId: string) =>
    api.delete<ApiResponse<null>>(`/applications/${applicationId}/withdraw`),
};
