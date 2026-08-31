import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { tokenStorage } from "./token";

// Extend to track if we've already retried this request
interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── Request Interceptor ──────────────────────────────────────────────────────
// Attach the current access token to every outgoing request.
api.interceptors.request.use((config) => {
  const token = tokenStorage.getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ─── Response Interceptor ─────────────────────────────────────────────────────
// On a 401 "Could not validate credentials" response:
//   1. Try to refresh the access token using the stored refresh token.
//   2. Retry the original request with the new access token.
//   3. If refresh itself fails, clear tokens (user needs to log in again).
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

function addRefreshSubscriber(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    // Only handle 401s on non-refresh endpoints to avoid infinite loops
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/refresh") &&
      !originalRequest.url?.includes("/auth/login")
    ) {
      // If we're already refreshing, queue this request
      if (isRefreshing) {
        return new Promise<string>((resolve) => {
          addRefreshSubscriber(resolve);
        }).then((newToken) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = tokenStorage.getRefreshToken();

      if (!refreshToken) {
        // No refresh token stored — clear everything and reject
        isRefreshing = false;
        tokenStorage.clearTokens();
        return Promise.reject(error);
      }

      try {
        // Call the refresh endpoint directly (bypasses interceptor to avoid loops)
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const refreshResponse = await axios.post(
          `${baseUrl}/auth/refresh`,
          { refresh_token: refreshToken },
          { headers: { "Content-Type": "application/json" } }
        );

        const { access_token, refresh_token: newRefreshToken } =
          refreshResponse.data;

        tokenStorage.setTokens(access_token, newRefreshToken);
        isRefreshing = false;
        onRefreshed(access_token);

        // Retry the original request with the new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
        }
        return api(originalRequest);
      } catch {
        // Refresh failed — session is dead, clear tokens
        isRefreshing = false;
        refreshSubscribers = [];
        tokenStorage.clearTokens();
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default api;