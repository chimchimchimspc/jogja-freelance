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

export const profileApi = {
  getOwn: () => api.get<ApiResponse<ApiProfile>>("/profile"),

  getPublic: (userId: string) =>
    api.get<ApiResponse<ApiProfile>>(`/profile/${userId}`),

  update: (data: UpdateProfileData) =>
    api.put<ApiResponse<null>>("/profile", data),
};
