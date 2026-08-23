import api from "./api";
import { AUTH_CHANGE_EVENT } from "./token";
import {
  OnboardingCreate,
  OnboardingPartialUpdate,
  OnboardingProgressResponse,
  OnboardingResponse,
} from "@/types/onboarding";

/**
 * Submit complete profile information for the authenticated user.
 * Sends POST /onboarding and dispatches auth-change event.
 */
export async function submitOnboarding(payload: OnboardingCreate): Promise<OnboardingResponse> {
  const response = await api.post<OnboardingResponse>("/onboarding", payload);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
  }
  return response.data;
}

/**
 * Save partial onboarding progress (Save & Exit).
 * Sends PATCH /onboarding.
 */
export async function savePartialOnboarding(
  payload: OnboardingPartialUpdate
): Promise<OnboardingProgressResponse> {
  const response = await api.patch<OnboardingProgressResponse>("/onboarding", payload);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
  }
  return response.data;
}

/**
 * Fetch existing profile progress for the authenticated user.
 * Sends GET /onboarding/me.
 */
export async function getMyOnboarding(): Promise<OnboardingProgressResponse> {
  const response = await api.get<OnboardingProgressResponse>("/onboarding/me");
  return response.data;
}
