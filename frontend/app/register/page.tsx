import LoginImage from "@/components/auth/LoginPage/LoginImage";
import RegisterCard from "@/components/auth/LoginPage/RegisterCard";

export default function Register() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div
        className="
          w-full max-w-[1040px]
          rounded-3xl
          overflow-hidden
          border border-white/5
          bg-[#161925]
          shadow-2xl
          flex
          min-h-[640px]
        "
      >
        {/* Left half: Image */}
        <div className="relative hidden md:block w-1/2">
          <LoginImage />
        </div>

        {/* Right half: Form Panel */}
        <div className="w-full md:w-1/2 p-10 sm:p-14 lg:p-16 flex flex-col justify-center">
          <RegisterCard />
        </div>
      </div>
    </main>
  );
}
