interface Props {
  children: React.ReactNode;
  type?: "button" | "submit" | "reset";
}

export default function PrimaryButton({ children, type = "submit" }: Props) {
  return (
    <button
      type={type}
      className="
        w-full
        h-12

        rounded-lg

        bg-gradient-to-r
        from-[#9b51e0]
        to-[#7c3aed]

        text-white
        text-[14px]
        font-medium

        transition-all
        duration-200

        hover:opacity-90
        hover:shadow-lg hover:shadow-violet-500/20
        active:scale-[0.98]
      "
    >
      {children}
    </button>
  );
}