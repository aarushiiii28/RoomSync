import RegisterForm from "./RegisterForm";

export default function RegisterCard() {
  return (
    <div className="w-full max-w-[380px] mx-auto">
      <h1 className="text-[40px] font-bold text-white tracking-tight leading-tight">
        Join RoomSync
      </h1>

      <p className="mt-1.5 text-[#8b92a5] text-[15px]">
        Find your perfect roommate match.
      </p>

      <div className="mt-8">
        <RegisterForm />
      </div>
    </div>
  );
}
