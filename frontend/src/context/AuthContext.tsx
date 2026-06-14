import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { loginRequest, registerRequest, clearTokens, fetchCurrentUser, updateProfileRequest } from "@/lib/authClient";

// Define a type for the user data you expect from the API
type User = {
  id: number;
  username: string;
  email: string;
  role?: string | null;
  bio?: string | null;
  mobile_number?: string | null;
  profile_image?: string | null;
  institution_name?: string | null;
  xp?: number;
  edu_coins?: number;
  wallet_address?: string | null;
};


type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  updateUserProfile: (data: any) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const isAuthenticated = !!user;

  const fetchUser = useCallback(async () => {
    try {
      const userData = await fetchCurrentUser();
      if (userData) {
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (e) {
      console.error("[Auth] Fetch user failed:", e);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    async function bootstrap() {
      setLoading(true);
      await fetchUser();
      setLoading(false);
    }
    bootstrap();
  }, [fetchUser]);

  const login = async (username: string, password: string) => {
    setLoading(true);
    try {
      const userData = await loginRequest(username, password);
      setUser(userData);
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: any) => {
    setLoading(true);
    try {
      const userResult = await registerRequest(userData);
      setUser(userResult);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await clearTokens();
    setUser(null);
  };

    const updateUserProfile = async (data: any) => {
      try {
          const updatedUser = await updateProfileRequest(data);
          setUser(prevUser => {
              if (prevUser) {
                  return { ...prevUser, ...updatedUser };
              }
              return updatedUser;
          });
      } catch (error) {
          console.error("Failed to update profile", error);
          throw error;
      }
    };
  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        login,
        register,
        logout,
        fetchUser,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}