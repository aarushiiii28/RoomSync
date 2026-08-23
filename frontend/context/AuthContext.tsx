"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { tokenStorage, AUTH_CHANGE_EVENT } from "@/services/token";
import { getMyOnboarding } from "@/services/onboarding";
import { getCurrentUser } from "@/services/auth";

export interface UserProfileInfo {
  id?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string | null;
}

export interface AuthContextType {
  isAuthenticated: boolean;
  profileComplete: boolean;
  user: UserProfileInfo | null;
  loading: boolean;
  refetch: () => Promise<void>;
}

const defaultAuthState: AuthContextType = {
  isAuthenticated: false,
  profileComplete: false,
  user: null,
  loading: true,
  refetch: async () => {},
};

const AuthContext = createContext<AuthContextType>(defaultAuthState);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [profileComplete, setProfileComplete] = useState<boolean>(false);
  const [user, setUser] = useState<UserProfileInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const checkAuth = useCallback(async () => {
    const token = tokenStorage.getAccessToken();

    if (!token) {
      setIsAuthenticated(false);
      setProfileComplete(false);
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      try {
        const onboardingData = await getMyOnboarding();
        setIsAuthenticated(true);
        const isComplete = Boolean(onboardingData.is_complete);
        setProfileComplete(isComplete);

        let username = "";
        let userId = "";
        let userEmail: string | null = null;
        try {
          const userAccount = await getCurrentUser();
          username = userAccount.username;
          userId = userAccount.id;
          userEmail = userAccount.email;
        } catch {
          // ignore
        }

        setUser({
          id: userId,
          username,
          email: userEmail,
          firstName: onboardingData.profile?.first_name || "",
          lastName: onboardingData.profile?.last_name || "",
        });
      } catch (onboardingErr: unknown) {
        const errObj = onboardingErr as { response?: { status?: number } };
        if (errObj?.response?.status === 404) {
          setIsAuthenticated(true);
          setProfileComplete(false);

          try {
            const userAccount = await getCurrentUser();
            setUser({
              id: userAccount.id,
              username: userAccount.username,
              email: userAccount.email,
            });
          } catch {
            setUser(null);
          }
        } else if (errObj?.response?.status === 401) {
          tokenStorage.clearTokens();
          setIsAuthenticated(false);
          setProfileComplete(false);
          setUser(null);
        } else {
          setIsAuthenticated(true);
          setProfileComplete(false);
          setUser(null);
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    async function init() {
      const token = tokenStorage.getAccessToken();

      if (!token) {
        if (!ignore) {
          setIsAuthenticated(false);
          setProfileComplete(false);
          setUser(null);
          setLoading(false);
        }
        return;
      }

      try {
        const onboardingData = await getMyOnboarding();
        if (!ignore) {
          setIsAuthenticated(true);
          const isComplete = Boolean(onboardingData.is_complete);
          setProfileComplete(isComplete);

          let username = "";
          let userId = "";
          let userEmail: string | null = null;
          try {
            const userAccount = await getCurrentUser();
            username = userAccount.username;
            userId = userAccount.id;
            userEmail = userAccount.email;
          } catch {
            // ignore
          }

          setUser({
            id: userId,
            username,
            email: userEmail,
            firstName: onboardingData.profile?.first_name || "",
            lastName: onboardingData.profile?.last_name || "",
          });
        }
      } catch (onboardingErr: unknown) {
        const errObj = onboardingErr as { response?: { status?: number } };
        if (!ignore) {
          if (errObj?.response?.status === 404) {
            setIsAuthenticated(true);
            setProfileComplete(false);

            try {
              const userAccount = await getCurrentUser();
              setUser({
                id: userAccount.id,
                username: userAccount.username,
                email: userAccount.email,
              });
            } catch {
              setUser(null);
            }
          } else if (errObj?.response?.status === 401) {
            tokenStorage.clearTokens();
            setIsAuthenticated(false);
            setProfileComplete(false);
            setUser(null);
          } else {
            setIsAuthenticated(true);
            setProfileComplete(false);
            setUser(null);
          }
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void init();

    const handleAuthChange = () => {
      void checkAuth();
    };

    window.addEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
    window.addEventListener("storage", handleAuthChange);

    return () => {
      ignore = true;
      window.removeEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
      window.removeEventListener("storage", handleAuthChange);
    };
  }, [checkAuth]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        profileComplete,
        user,
        loading,
        refetch: checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  return useContext(AuthContext);
}
