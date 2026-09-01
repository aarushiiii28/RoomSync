"use client";

import { useState } from "react";
import { AlertCircle, Check, Loader2 } from "lucide-react";

interface SetPasswordModalProps {
  onSuccess: () => void;
  defaultUsername: string;
}

export default function SetPasswordModal({ onSuccess, defaultUsername }: SetPasswordModalProps) {
  const [username, setUsername] = useState(defaultUsername);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { tokenStorage } = await import("@/services/token");
      const token = tokenStorage.getAccessToken();
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      
      const res = await fetch(`${API_URL}/users/me/set-credentials`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Failed to set credentials");
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-[#1C1F2E] p-8 rounded-2xl border border-white/10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">You're all set!</h2>
          <p className="text-white/70">
            You can now log in using your email and password next time.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#1C1F2E] p-6 sm:p-8 rounded-2xl border border-white/10 max-w-md w-full">
        <h2 className="text-2xl font-bold text-white mb-2">Secure your account</h2>
        <p className="text-[14px] text-white/60 mb-6">
          You signed in with Google. Please set a username and password so you can use email login in the future.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-white/70 uppercase tracking-wider mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-white focus:outline-none focus:border-white/20 transition-colors"
              placeholder="Choose a username"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-white/70 uppercase tracking-wider mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-white focus:outline-none focus:border-white/20 transition-colors"
              placeholder="Create a password"
              required
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 bg-red-400/10 p-3 rounded-lg text-[13px]">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-white text-black font-semibold rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Credentials"}
            </button>
            <button
              type="button"
              onClick={onSuccess}
              className="w-full h-12 bg-transparent text-white/60 font-medium rounded-xl hover:bg-white/5 transition-colors mt-2"
            >
              Skip for now
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
