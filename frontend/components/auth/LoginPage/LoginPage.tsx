import LoginImage from "./LoginImage";
import LoginCard from "./LoginCard";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#05050c] flex items-center justify-center p-6">

      {/* Outer container */}
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
          <LoginCard />
        </div>
      </div>
    </main>
  );
}