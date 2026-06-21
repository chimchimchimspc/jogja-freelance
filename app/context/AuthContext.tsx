"use client";
import { createContext, useContext, useState, ReactNode } from "react";

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
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const DUMMY_USER = {
  id: "user-1",
  name: "Ariawan Beku",
  email: "test@jogja.id",
  password: "test123", // for demo only
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Simulasi API call
      await new Promise((r) => setTimeout(r, 1000));

      // Check dummy account
      if (email === DUMMY_USER.email && password === DUMMY_USER.password) {
        setUser({
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

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
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
