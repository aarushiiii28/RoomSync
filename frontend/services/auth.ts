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
  is_email_verified?: boolean;
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