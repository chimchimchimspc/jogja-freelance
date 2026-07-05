import { api, type ApiResponse } from "./api";
import type { ApiJob } from "./jobs.api";
import type { ApiEvent } from "./events.api";

export interface Recommendations {
  top_categories: string[];
  top_event_types: string[];
  jobs: ApiJob[];
  events: ApiEvent[];
}

export const recommendationsApi = {
  // Rekomendasi lowongan & event berdasarkan yang sering dibuka user
  get: () => api.get<ApiResponse<Recommendations>>("/recommendations"),
};
