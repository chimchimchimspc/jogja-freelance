"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = "jogja-auth-user";
const TOKEN_KEY = "jogja-auth-token";
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

export const DUMMY_USER = {
  id: "user-1",
  name: "Ariawan Beku",
  email: "test@jogja.id",
  password: "test123", // for demo only
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Muat sesi tersimpan saat pertama kali render (agar login tetap ada setelah refresh)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setUser(JSON.parse(saved));
    } catch {
      // abaikan jika localStorage tidak tersedia / data rusak
    }
  }, []);

  // Simpan helper: set state + persist ke localStorage
  const persistUser = (u: User | null) => {
    setUser(u);
    try {
      if (u) localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // abaikan
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Simulasi API call
      await new Promise((r) => setTimeout(r, 1000));

      // Check dummy account
      if (email === DUMMY_USER.email && password === DUMMY_USER.password) {
        persistUser({
          id: DUMMY_USER.id,
          name: DUMMY_USER.name,
          email: DUMMY_USER.email,
        });
      } else {
        throw new Error("Email atau password salah");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Login lewat akun Google: kirim kredensial ke backend agar user
  // tersimpan di PostgreSQL, lalu simpan user + token yang dikembalikan.
  const loginWithGoogle = async (credential: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal login dengan Google");
      }

      const u = json.data.user;
      persistUser({
        id: u.id,
        name: u.full_name,
        email: u.email,
        avatar: u.avatar || undefined,
      });
      try {
        localStorage.setItem(TOKEN_KEY, json.data.token);
      } catch {
        // abaikan
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    persistUser(null);
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // abaikan
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth harus digunakan dalam AuthProvider");
  }
  return context;
}
