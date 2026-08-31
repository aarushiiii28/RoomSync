"use client";

import { useState } from "react";
import LoginForm from "./LoginForm";
import ForgotPasswordFlow from "./ForgotPasswordFlow";

export default function LoginCard() {
  const [view, setView] = useState<"login" | "forgot-password">("login");

  return (
    <div className="w-full max-w-[380px] mx-auto">
      {/* Heading */}
      <h1 className="text-[40px] font-bold text-white tracking-tight leading-tight">
        {view === "login" ? "Log in" : "Reset Password"}
      </h1>

      {/* Subtitle */}
      <p className="mt-1.5 text-[#8b92a5] text-[15px]">
        {view === "login" ? "Enter your credentials to continue" : "Follow the steps to reset your password"}
      </p>

      {/* Forms */}
      <div className="mt-8">
        {view === "login" ? (
          <LoginForm onForgotPassword={() => setView("forgot-password")} />
        ) : (
          <ForgotPasswordFlow onBack={() => setView("login")} />
        )}
      </div>
    </div>
  );
}