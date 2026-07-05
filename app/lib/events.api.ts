import { api, type ApiResponse, type PaginatedResponse } from "./api";

export interface ApiEvent {
  id: string;
  title: string;
  description: string;
  type: "workshop" | "meetup" | "coffee_chat" | "networking";
  event_date: string;
  event_time: string;
  duration_minutes: number;
  location_name: string;
  location_address?: string;
  latitude?: number;
  longitude?: number;
  organizer_name: string;
  image_url?: string;
  attendee_limit: number;
  attendee_count: number;
  check_in_code?: string;
  is_free: boolean;
  price?: number;
  registration_url?: string;
  skills: string[];
}

export const eventsApi = {
  list: (query: { page?: number; limit?: number; type?: string; upcoming?: boolean; past?: boolean } = {}) => {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined) params.set(k, String(v));
    });
    const qs = params.toString();
    return api.get<PaginatedResponse<ApiEvent>>(`/events${qs ? `?${qs}` : ""}`);
  },

  get: (id: string) => api.get<ApiResponse<ApiEvent>>(`/events/${id}`),

  mine: () => api.get<ApiResponse<(ApiEvent & { status: string; created_at: string })[]>>("/events/mine"),

  attendees: (eventId: string) =>
    api.get<ApiResponse<{
      event_title: string;
      attendees: Array<{
        id: string;
        rsvp_at: string;
        checked_in: boolean;
        checked_in_at?: string;
        user_id: string;
        name: string;
        city?: string;
        level?: string;
        profile_picture_url?: string;
      }>;
    }>>(`/events/${eventId}/attendees`),

  create: (data: {
    title: string;
    description?: string;
    type: ApiEvent["type"];
    event_date: string;
    event_time: string;
    duration_minutes?: number;
    location_name?: string;
    location_address?: string;
    organizer_name?: string;
    image_url?: string;
    attendee_limit?: number;
    check_in_code?: string;
    is_free?: boolean;
    price?: number;
    registration_url?: string;
    skills?: string[];
  }) => api.post<ApiResponse<ApiEvent>>("/events", data),

  rsvp: (id: string) =>
    api.post<ApiResponse<{ id: string; rsvp_at: string }>>(`/events/${id}/rsvp`, {}),

  checkIn: (id: string, check_in_code: string) =>
    api.post<ApiResponse<{ checked_in_at: string; awardedBadge: { name: string; icon: string } | null }>>(
      `/events/${id}/check-in`,
      { check_in_code }
    ),
};
