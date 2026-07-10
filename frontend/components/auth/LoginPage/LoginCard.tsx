import LoginForm from "./LoginForm";

export default function LoginCard() {
  return (
    <div className="w-full max-w-[380px] mx-auto">
      {/* Heading */}
      <h1 className="text-[40px] font-bold text-white tracking-tight leading-tight">
        Log in
      </h1>

      {/* Subtitle */}
      <p className="mt-1.5 text-[#8b92a5] text-[15px]">
        Enter your credentials to continue
      </p>

      {/* Login Form */}
      <div className="mt-8">
        <LoginForm />
      </div>
    </div>
  );
}