export default function Divider() {
  return (
    <div className="flex items-center gap-4 py-2">
      <div className="flex-1 h-px bg-white/5" />
      <span className="text-zinc-600 text-[12px]">
        OR
      </span>
      <div className="flex-1 h-px bg-white/5" />
    </div>
  );
}