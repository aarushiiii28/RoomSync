import api from "./api";

export interface VerifyEmailPayload {
  email: string;
  username?: string;
  otp: string;
}

export interface ResendVerificationPayload {
  email: string;
  username?: string;
}

export interface VerificationResponse {
  message: string;
}

export async function verifyEmail(
  email: string,
  otp: string,
  username?: string
): Promise<VerificationResponse> {
  const response = await api.post<VerificationResponse>("/auth/verify-email", {
    email: email.trim(),
    otp: otp.trim(),
    ...(username ? { username: username.trim() } : {}),
  });
  return response.data;
}

export async function resendVerification(
  email: string,
  username?: string
): Promise<VerificationResponse> {
  const response = await api.post<VerificationResponse>(
    "/auth/resend-verification",
    {
      email: email.trim(),
      ...(username ? { username: username.trim() } : {}),
    }
  );
  return response.data;
}
