const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

// Origin of the backend server, for static assets like /uploads/xxx.jpg
const API_ORIGIN = BASE_URL.replace(/\/api\/v1\/?$/, "");

/** Resolve a server-relative asset path (e.g. "/uploads/a.jpg") to a full URL. */
export function assetUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (/^(https?:\/\/|data:|blob:)/.test(path)) return path;
  return `${API_ORIGIN}${path}`;
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("jfp_token");
}

export function setToken(token: string) {
  localStorage.setItem("jfp_token", token);
}

export function clearToken() {
  localStorage.removeItem("jfp_token");
  localStorage.removeItem("jfp_user");
}

export function getStoredUser() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("jfp_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: object) {
  localStorage.setItem("jfp_user", JSON.stringify(user));
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await res.json();

  if (!res.ok) {
    const message = data?.message || `HTTP ${res.status}`;
    throw new Error(message);
  }

  return data;
}

async function uploadRequest<T>(path: string, formData: FormData): Promise<T> {
  const token = getToken();

  // No Content-Type header — the browser sets multipart/form-data with boundary
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  const data = await res.json();

  if (!res.ok) {
    const message = data?.message || `HTTP ${res.status}`;
    throw new Error(message);
  }

  return data;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),

  post: <T>(path: string, body: object) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),

  upload: <T>(path: string, formData: FormData) => uploadRequest<T>(path, formData),

  put: <T>(path: string, body: object) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),

  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

// ---- Typed API helpers ----

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: Pagination;
}
