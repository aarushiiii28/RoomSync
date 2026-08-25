import api from "./api";

export interface VerifyEmailPayload {
  email: string;
  otp: string;
}

export interface ResendVerificationPayload {
  email: string;
}

export interface VerificationResponse {
  message: string;
}

export async function verifyEmail(
  email: string,
  otp: string
): Promise<VerificationResponse> {
  const response = await api.post<VerificationResponse>("/auth/verify-email", {
    email: email.trim(),
    otp: otp.trim(),
  });
  return response.data;
}

export async function resendVerification(
  email: string
): Promise<VerificationResponse> {
  const response = await api.post<VerificationResponse>(
    "/auth/resend-verification",
    {
      email: email.trim(),
    }
  );
  return response.data;
}
