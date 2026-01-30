"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { authApi, User } from "@/lib/auth";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  signup: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const token = localStorage.getItem("aniways-token");
      if (!token) {
        setUser(null);
        return;
      }
      const userData = await authApi.getMe();
      setUser(userData);
    } catch {
      localStorage.removeItem("aniways-token");
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      await refreshUser();
      setIsLoading(false);
    };
    initAuth();
  }, [refreshUser]);

  const login = async (username: string, password: string) => {
    const response = await authApi.login(username, password);
    localStorage.setItem("aniways-token", response.access_token);
    setUser(response.user);
  };

  const signup = async (username: string, password: string) => {
    const response = await authApi.signup(username, password);
    localStorage.setItem("aniways-token", response.access_token);
    setUser(response.user);
  };

  const logout = () => {
    localStorage.removeItem("aniways-token");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
