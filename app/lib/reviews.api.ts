import { api, type ApiResponse } from "./api";

export interface ApiReview {
  id: string;
  rating: number;
  comment: string | null;
  job_id: string | null;
  created_at: string;
  reviewer_id: string;
  reviewer_name: string;
  reviewer_avatar?: string | null;
}

export interface ReviewsResult {
  summary: { average: number; total: number };
  reviews: ApiReview[];
}

export const reviewsApi = {
  create: (data: { reviewee_id: string; job_id?: string; rating: number; comment?: string }) =>
    api.post<ApiResponse<ApiReview>>("/reviews", data),

  forUser: (userId: string) =>
    api.get<ApiResponse<ReviewsResult>>(`/reviews/${userId}`),
};
