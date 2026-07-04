"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { authApi, type AuthUser } from "../lib/auth.api";
import { setToken, clearToken, getStoredUser, setStoredUser } from "../lib/api";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "freelancer" | "employer" | "event_organizer" | "admin";
  avatar?: string;
  level?: string;
  passport_days_completed?: number;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    full_name: string;
    role?: string;
    city?: string;
    skills?: string[];
    company_name?: string;
  }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function toUser(u: AuthUser): User {
  return {
    id: u.id,
    name: u.full_name,
    email: u.email,
    role: u.role,
    avatar: u.profile_picture_url,
    level: u.level,
    passport_days_completed: u.passport_days_completed,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = getStoredUser();
    if (stored) setUser(stored);
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await authApi.login(email, password);
      const u = toUser(res.data.user);
      setToken(res.data.token);
      setStoredUser(u);
      setUser(u);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: {
    email: string;
    password: string;
    full_name: string;
    role?: string;
    city?: string;
    skills?: string[];
    company_name?: string;
  }) => {
    setIsLoading(true);
    try {
      const res = await authApi.register(data);
      const u = toUser(res.data.user);
      setToken(res.data.token);
      setStoredUser(u);
      setUser(u);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
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
