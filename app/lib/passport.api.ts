import { api, type ApiResponse } from "./api";

export interface PassportProgress {
  current_day: number;
  start_date: string;
  level: string;
  days_completed: number;
  completed_days: number[];
  earned_badges: string[];
  completed_at?: string | null;
}

export interface PassportDayEntry {
  day_number: number;
  day: number;
  phase: string;
  task: string;
  description: string;
  estimated_time: string;
  estimatedTime?: string;
  tips: string[];
  badge_unlock?: string;
  badgeUnlock?: string;
  badgeIcon?: string;
  resources?: { label: string; url: string }[];
  is_completed?: boolean;
}

export interface PassportJourneyResponse {
  progress: PassportProgress;
  days: PassportDayEntry[];
}

export interface MarkCompleteResponse {
  day_number: number;
  badge_awarded: { name: string; icon: string } | null;
  progress: PassportProgress;
}

export const passportApi = {
  getJourney: () =>
    api.get<ApiResponse<PassportJourneyResponse>>("/passport/journey"),

  getTodayTask: () =>
    api.get<ApiResponse<PassportDayEntry & { progress: PassportProgress }>>("/passport/today-task"),

  getProgress: () =>
    api.get<ApiResponse<PassportProgress>>("/passport/progress"),

  getDayDetail: (dayNumber: number) =>
    api.get<ApiResponse<PassportDayEntry>>(`/passport/daily/${dayNumber}`),

  markComplete: (dayNumber: number) =>
    api.put<ApiResponse<MarkCompleteResponse>>(`/passport/mark-complete/${dayNumber}`, {}),
};
