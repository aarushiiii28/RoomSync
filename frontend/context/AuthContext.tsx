"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { tokenStorage, AUTH_CHANGE_EVENT } from "@/services/token";
import { getMyOnboarding, savePartialOnboarding } from "@/services/onboarding";
import { getCurrentUser } from "@/services/auth";

export interface UserProfileInfo {
  id?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string | null;
  profilePhotoUrl?: string | null;
}

export interface AuthContextType {
  isAuthenticated: boolean;
  profileComplete: boolean;
  user: UserProfileInfo | null;
  loading: boolean;
  refetch: () => Promise<void>;
  updateProfilePhoto: (photoUrl: string | null) => Promise<void>;
}

const defaultAuthState: AuthContextType = {
  isAuthenticated: false,
  profileComplete: false,
  user: null,
  loading: true,
  refetch: async () => {},
  updateProfilePhoto: async () => {},
};

const AuthContext = createContext<AuthContextType>(defaultAuthState);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [profileComplete, setProfileComplete] = useState<boolean>(false);
  const [user, setUser] = useState<UserProfileInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const checkAuth = useCallback(async () => {
    setLoading(true);
    const token = tokenStorage.getAccessToken();

    if (!token) {
      setIsAuthenticated(false);
      setProfileComplete(false);
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      // 1. Fetch User Identity (id, username, email)
      // User is ONLY authenticated if this request succeeds with a valid user
      let userAccount;
      try {
        userAccount = await getCurrentUser();
      } catch {
        tokenStorage.clearTokens();
        setIsAuthenticated(false);
        setProfileComplete(false);
        setUser(null);
        setLoading(false);
        return;
      }

      if (!userAccount || !userAccount.id) {
        tokenStorage.clearTokens();
        setIsAuthenticated(false);
        setProfileComplete(false);
        setUser(null);
        setLoading(false);
        return;
      }

      const userId = userAccount.id;
      const username = userAccount.username || "";
      const userEmail = userAccount.email || null;

      // 2. Fetch Onboarding Profile (first_name, last_name, avatar, is_complete)
      let firstName = "";
      let lastName = "";
      let photoUrl: string | null = null;
      let isComplete = false;

      try {
        const onboardingData = await getMyOnboarding();
        isComplete = Boolean(onboardingData.is_complete);
        firstName = onboardingData.profile?.first_name || "";
        lastName = onboardingData.profile?.last_name || "";

        const cachedPhoto =
          typeof window !== "undefined" && userId
            ? localStorage.getItem(`roomsync_avatar_${userId}`)
            : null;
        photoUrl = onboardingData.profile?.profile_photo_url || cachedPhoto || null;
        if (photoUrl && typeof window !== "undefined" && userId) {
          try {
            localStorage.setItem(`roomsync_avatar_${userId}`, photoUrl);
          } catch {
            // ignore
          }
        }
      } catch (onboardingErr: unknown) {
        const errObj = onboardingErr as { response?: { status?: number } };
        if (errObj?.response?.status === 401) {
          tokenStorage.clearTokens();
          setIsAuthenticated(false);
          setProfileComplete(false);
          setUser(null);
          setLoading(false);
          return;
        }
        isComplete = false;
      }

      setIsAuthenticated(true);
      setProfileComplete(isComplete);
      setUser({
        id: userId,
        username,
        email: userEmail,
        firstName,
        lastName,
        profilePhotoUrl: photoUrl,
      });
    } catch {
      tokenStorage.clearTokens();
      setIsAuthenticated(false);
      setProfileComplete(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfilePhoto = useCallback(async (photoUrl: string | null) => {
    const currentUserId = user?.id;
    // Optimistic update
    setUser((prev) => (prev ? { ...prev, profilePhotoUrl: photoUrl } : null));

    if (typeof window !== "undefined" && currentUserId) {
      if (photoUrl) {
        try {
          localStorage.setItem(`roomsync_avatar_${currentUserId}`, photoUrl);
        } catch {
          // ignore storage quota
        }
      } else {
        localStorage.removeItem(`roomsync_avatar_${currentUserId}`);
      }
    }

    try {
      await savePartialOnboarding({
        profile: {
          profile_photo_url: photoUrl,
        } as any,
      });
    } catch (err) {
      console.error("Failed to sync profile photo to backend:", err);
    }
  }, [user?.id]);

  useEffect(() => {
    let ignore = false;

    async function init() {
      if (!ignore) {
        await checkAuth();
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
        updateProfilePhoto,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  return useContext(AuthContext);
}
