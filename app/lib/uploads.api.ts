import { api, type ApiResponse } from "./api";

export const uploadsApi = {
  // Upload gambar lowongan / event (khusus pengelola) — mengembalikan URL relatif /uploads/...
  image: (file: File) => {
    const fd = new FormData();
    fd.append("photo", file);
    return api.upload<ApiResponse<{ url: string }>>("/uploads/image", fd);
  },
};
