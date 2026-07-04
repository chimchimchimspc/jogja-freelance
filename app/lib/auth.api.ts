import { api, type ApiResponse } from "./api";

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role: "freelancer" | "employer" | "event_organizer" | "admin";
  city: string;
  is_verified: boolean;
  bio?: string;
  profile_picture_url?: string;
  portfolio_url?: string;
  level?: string;
  rating?: number;
  review_count?: number;
  completed_projects?: number;
  passport_days_completed?: number;
}

export interface LoginResponse {
  user: AuthUser;
  token: string;
  refreshToken: string;
}

export interface RegisterResponse {
  user: AuthUser;
  token: string;
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post<ApiResponse<LoginResponse>>("/auth/login", { email, password }),

  register: (data: {
    email: string;
    password: string;
    full_name: string;
    role?: string;
    city?: string;
    skills?: string[];
    company_name?: string;
  }) => api.post<ApiResponse<RegisterResponse>>("/auth/register", data),

  me: () => api.get<ApiResponse<AuthUser>>("/auth/me"),

  logout: () => api.post<ApiResponse<null>>("/auth/logout", {}),
};
