"use client";

import type React from "react";
import { createContext, useContext, useState, useEffect } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, avatar?: File | null) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        if (token) {
          // In a real app, you would validate the token with your API
          // For now, we'll just simulate a user
          const userData = JSON.parse(localStorage.getItem("user_data") || "null");
          if (userData) {
            setUser(userData);
          }
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user_data");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // In a real app, you would call your Spring Boot API
      // For now, we'll simulate a successful login
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Simulate a JWT token
      const token = "fake-jwt-token";
      localStorage.setItem("auth_token", token);

      // Set cookie for middleware
      document.cookie = `auth_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;

      // Simulate user data
      const userData = {
        id: "user-1",
        name: "John Doe",
        email,
      };
      localStorage.setItem("user_data", JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, avatar?: File | null) => {
    setIsLoading(true);
    try {
      // In a real app, you would call your Spring Boot API with FormData
      // For now, we'll simulate a successful registration

      // Generate avatar URL if provided
      let avatarUrl: string | undefined = undefined;
      if (avatar) {
        // In a real app, this would be the URL returned from your API
        // For now, we'll create a temporary object URL
        avatarUrl = URL.createObjectURL(avatar);
      }

      // Simulate a JWT token

      // Simulate user data
      const userData = {
        id: "user-" + Date.now(),
        name,
        email,
        avatarUrl,
      };
      localStorage.setItem("user_data", JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      console.error("Registration failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_data");
    document.cookie = "auth_token=; path=/; max-age=0";
    setUser(null);
    window.location.href = "/auth/login";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
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
