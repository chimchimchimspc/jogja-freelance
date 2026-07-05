import { api, type ApiResponse } from "./api";

export interface ApiProfile {
  id: string;
  full_name: string;
  city: string;
  role: string;
  created_at: string;
  bio?: string;
  profile_picture_url?: string;
  portfolio_url?: string;
  level?: string;
  rating?: number;
  review_count?: number;
  completed_projects?: number;
  passport_days_completed?: number;
  skills: string[];
  badges: Array<{ name: string; icon: string; rarity: string }>;
}

export interface UpdateProfileData {
  full_name?: string;
  city?: string;
  bio?: string;
  portfolio_url?: string;
  skills?: string[];
}

export interface ApiEmployerProfile {
  id: string;
  full_name: string;
  city: string;
  created_at: string;
  company_name: string;
  industry?: string;
  company_description?: string;
  company_logo_url?: string;
  website_url?: string;
  location?: string;
  total_jobs_posted: number;
  total_hired: number;
}

export interface UpdateEmployerProfileData {
  company_name?: string;
  industry?: string;
  company_description?: string;
  website_url?: string;
  location?: string;
}

export const profileApi = {
  getOwn: () => api.get<ApiResponse<ApiProfile>>("/profile"),

  getPublic: (userId: string) =>
    api.get<ApiResponse<ApiProfile>>(`/profile/${userId}`),

  update: (data: UpdateProfileData) =>
    api.put<ApiResponse<null>>("/profile", data),

  uploadPhoto: (file: File) => {
    const fd = new FormData();
    fd.append("photo", file);
    return api.upload<ApiResponse<{ url: string }>>("/profile/photo", fd);
  },

  getOwnEmployer: () =>
    api.get<ApiResponse<ApiEmployerProfile>>("/profile/employer"),

  updateEmployer: (data: UpdateEmployerProfileData) =>
    api.put<ApiResponse<null>>("/profile/employer", data),
};
