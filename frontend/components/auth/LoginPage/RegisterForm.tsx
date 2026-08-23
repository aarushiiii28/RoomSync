"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, User } from "lucide-react";

import AuthInput from "../shared/AuthInput";
import PasswordInput from "../shared/PasswordInput";
import PrimaryButton from "../shared/PrimaryButton";
import Divider from "../shared/Divider";
import SocialLogin from "./SocialLogin";

import { register } from "@/services/auth";

export default function RegisterForm() {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!firstName.trim()) {
      setError("First name is required.");
      return;
    }

    if (!lastName.trim()) {
      setError("Last name is required.");
      return;
    }

    if (username.trim().length < 5) {
      setError("Username must be at least 5 characters.");
      return;
    }

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    if (password.length < 8) {
      setError(
        "Password must be at least 8 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!acceptedTerms) {
      setError(
        "Please accept the Terms and Privacy Policy."
      );
      return;
    }

    try {
      setLoading(true);

      await register({
        username,
        email,
        password,
      });

      setSuccess("Account Created!");

      setTimeout(() => {
        router.push("/login");
      }, 1500);

    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { detail?: string } } };
      setError(
        errorObj?.response?.data?.detail ??
        "Registration failed."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      <div className="grid grid-cols-2 gap-3">
        <AuthInput
          icon={<User size={16} />}
          placeholder="First name"
          value={firstName}
          onChange={(e) =>
            setFirstName(e.target.value)
          }
          disabled={loading}
        />

        <AuthInput
          icon={<User size={16} />}
          placeholder="Last name"
          value={lastName}
          onChange={(e) =>
            setLastName(e.target.value)
          }
          disabled={loading}
        />
      </div>

      <AuthInput
        icon={<User size={16} />}
        placeholder="Username"
        value={username}
        onChange={(e) =>
          setUsername(e.target.value)
        }
        disabled={loading}
      />

      <AuthInput
        type="email"
        icon={<Mail size={16} />}
        placeholder="Email address"
        value={email}
        onChange={(e) =>
          setEmail(e.target.value)
        }
        disabled={loading}
      />

      <PasswordInput
        placeholder="Password"
        value={password}
        onChange={(e) =>
          setPassword(e.target.value)
        }
        disabled={loading}
      />

      <PasswordInput
        placeholder="Confirm password"
        value={confirmPassword}
        onChange={(e) =>
          setConfirmPassword(e.target.value)
        }
        disabled={loading}
      />

          {error && (
        <p className="text-sm text-red-400">
          {error}
        </p>
      )}

      {success && (
        <p className="text-sm text-green-400">
          {success}
        </p>
      )}

      <label className="flex items-start gap-2.5 text-sm text-zinc-400 cursor-pointer select-none pt-1">
        <input
          type="checkbox"
          checked={acceptedTerms}
          onChange={(e) =>
            setAcceptedTerms(e.target.checked)
          }
          disabled={loading}
          className="
            w-4 h-4
            mt-0.5
            flex-shrink-0
            rounded
            border border-white/20
            bg-transparent
            accent-[#F8B4C8]
            cursor-pointer
          "
        />

        <span>
          I agree to the{" "}
          <Link
            href="#"
            className="text-[#F8B4C8] hover:opacity-80 transition-all duration-200"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            href="#"
            className="text-[#F8B4C8] hover:opacity-80 transition-all duration-200"
          >
            Privacy Policy
          </Link>
        </span>
      </label>

      <div className="pt-1">
        <PrimaryButton disabled={loading}>
          {loading ? "Creating account..." : "Create account"}
        </PrimaryButton>
      </div>

      <Divider />

      <SocialLogin />

      <p className="text-center text-sm text-zinc-400 pt-1">
        Already have an account?{" "}
        <Link
          href="/login"
          className="
            text-[#F8B4C8]
            hover:opacity-80
            font-medium
            transition-all
            duration-200
          "
        >
          Log In
        </Link>
      </p>
    </form>
  );
}