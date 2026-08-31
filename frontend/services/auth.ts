import api from "./api";
import { tokenStorage } from "./token";

export interface RegisterData {
  username: string;
  email?: string;
  password: string;
}

export interface LoginData {
  username: string;
  password: string;
}

export interface CurrentUser {
  id: string;
  username: string;
  email: string | null;
  is_active: boolean;
  email_verified?: boolean;
  is_email_verified?: boolean;
}

export async function checkUsernameAvailability(username: string): Promise<{ available: boolean; message: string }> {
  const response = await api.get<{ available: boolean; message: string }>("/auth/check-username", {
    params: { username },
  });
  return response.data;
}

export async function register(data: RegisterData) {
  const response = await api.post("/auth/register", data);
  return response.data;
}

export async function login(data: LoginData) {
  const response = await api.post("/auth/login/json", data);

  tokenStorage.setTokens(
    response.data.access_token,
    response.data.refresh_token
  );

  return response.data;
}

export async function googleLogin(code: string) {
  const response = await api.post("/auth/google-callback", { code });

  tokenStorage.setTokens(
    response.data.access_token,
    response.data.refresh_token
  );

  return response.data;
}

export async function refreshToken() {
  const refresh_token = tokenStorage.getRefreshToken();

  const response = await api.post("/auth/refresh", {
    refresh_token,
  });

  tokenStorage.setTokens(
    response.data.access_token,
    response.data.refresh_token
  );

  return response.data;
}

export async function forgotPassword(email: string) {
  const response = await api.post("/auth/forgot-password", { email });
  return response.data;
}

export async function confirmForgotPassword(email: string, confirmation_code: string, new_password: string) {
  const response = await api.post("/auth/confirm-forgot-password", {
    email,
    confirmation_code,
    new_password,
  });
  return response.data;
}

export async function logout() {
  const refresh_token = tokenStorage.getRefreshToken();

  if (refresh_token) {
    try {
      await api.post("/auth/logout", {
        refresh_token,
      });
    } catch {
      // Ignore network/server errors during session revocation
    }
  }

  tokenStorage.clearTokens();
}

export async function getCurrentUser(): Promise<CurrentUser> {
  const response = await api.get<CurrentUser>("/users/me");
  return response.data;
}