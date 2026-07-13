import { api, type ApiResponse, type PaginatedResponse } from "./api";

export interface ApiJob {
  id: string;
  title: string;
  company: string;
  company_logo?: string;
  company_industry?: string;
  employer_id?: string;
  category: string;
  description: string;
  budget_min: number;
  budget_max: number;
  budget_type: "fixed" | "hourly";
  deadline_days: number;
  deadline_date: string;
  location: string;
  latitude?: number;
  longitude?: number;
  image_url?: string;
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
  status: ApplicationStatus;
  submitted_at: string;
  reviewed_at?: string;
  expires_at: string;
  budget_min: number;
  budget_max: number;
  work_note?: string | null;
  employer_feedback?: string | null;
  work_submitted_at?: string | null;
}

export type ApplicationStatus =
  | "pending" | "reviewed" | "accepted" | "rejected" | "expired"
  | "submitted_for_review" | "revision_requested" | "terminated" | "completed";

export interface ApiEmployerApplication {
  id: string;
  status: ApplicationStatus;
  submitted_at: string;
  cover_letter?: string;
  freelancer_id: string;
  name: string;
  level?: string;
  rating?: number;
  completed_projects?: number;
  profile_picture_url?: string;
  job_id: string;
  job_title: string;
}

export interface ApiJobApplicant {
  id: string;
  status: ApplicationStatus;
  submitted_at: string;
  cover_letter: string;
  freelancer_id: string;
  name: string;
  level?: string;
  rating?: number;
  completed_projects?: number;
  passport_days_completed?: number;
  skills: string[];
  badge_count: number;
  work_note?: string | null;
  employer_feedback?: string | null;
  work_submitted_at?: string | null;
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

  mine: () => api.get<ApiResponse<ApiJob[]>>("/jobs/mine"),

  employerApplications: (limit = 10) =>
    api.get<ApiResponse<ApiEmployerApplication[]>>(`/applications/employer?limit=${limit}`),

  applicantsForJob: (jobId: string) =>
    api.get<ApiResponse<ApiJobApplicant[]>>(`/applications/job/${jobId}`),

  updateApplicationStatus: (id: string, status: "reviewed" | "accepted" | "rejected") =>
    api.put<ApiResponse<null>>(`/applications/${id}/status`, { status }),

  submitWork: (id: string, note?: string) =>
    api.put<ApiResponse<{ status: ApplicationStatus; work_note: string | null; work_submitted_at: string }>>(
      `/applications/${id}/submit-work`, { note }
    ),

  completeApplication: (id: string) =>
    api.put<ApiResponse<null>>(`/applications/${id}/complete`, {}),

  requestRevision: (id: string, note: string) =>
    api.put<ApiResponse<null>>(`/applications/${id}/request-revision`, { note }),

  terminateApplication: (id: string, note?: string) =>
    api.put<ApiResponse<null>>(`/applications/${id}/terminate`, { note }),

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
