interface Props {
  children: React.ReactNode;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}

export default function PrimaryButton({
  children,
  type = "submit",
  disabled = false,
}: Props) {
  return (
    <button
      type={type}
      disabled={disabled}
      className="
        w-full
        h-12
        rounded-lg
        bg-[#F8B4C8]
        text-[#161925]
        text-[14px]
        font-bold
        transition-all duration-200
        hover:opacity-95
        hover:shadow-[0_6px_24px_rgba(248,180,200,0.35)]
        active:scale-[0.98]
        cursor-pointer
        disabled:opacity-60
        disabled:cursor-not-allowed
        disabled:active:scale-100
      "
    >
      {children}
    </button>
  );
}