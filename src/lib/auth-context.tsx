"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { UserResponse } from "@/models/authModel";

interface AuthContextType {
  user: UserResponse | null;
  isLoading: boolean;
  loginAs: (email: string, role?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  loginAs: async () => false,
  logout: async () => {},
  refreshUser: async () => {},
});

export const DEMO_USERS = [
  {
    name: "Alexander Wright",
    email: "admin@realestate.com",
    role: "ADMIN",
    password: "Admin@123",
    label: "Alexander (Admin)",
  },
  {
    name: "Sarah Jenkins",
    email: "sarah.rep@realestate.com",
    role: "SALES_REP",
    password: "Sales@123",
    label: "Sarah (Sales Rep 1)",
  },
  {
    name: "David Miller",
    email: "david.rep@realestate.com",
    role: "SALES_REP",
    password: "Sales@123",
    label: "David (Sales Rep 2)",
  },
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth");
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setUser(json.data);
          return;
        }
      }
      setUser(null);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const loginAs = async (email: string) => {
    setIsLoading(true);
    const demo = DEMO_USERS.find((u) => u.email === email);
    const password = demo?.password || "Sales@123";

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data?.user) {
          setUser(json.data.user);
          setIsLoading(false);
          return true;
        }
      }
      setIsLoading(false);
      return false;
    } catch (e) {
      console.error("Failed to log in:", e);
      setIsLoading(false);
      return false;
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth", { method: "DELETE" });
    } catch {
      // ignore
    }
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, loginAs, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
