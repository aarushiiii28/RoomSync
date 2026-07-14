export default function Compatibility() {
  return (
    <svg viewBox="0 0 280 200" className="w-full h-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Person A */}
      <circle cx="80" cy="70" r="22" fill="#ECECEC" stroke="#111" strokeWidth="1.5" />
      <path d="M48 170 Q48 130 80 130 Q112 130 112 170" fill="#ECECEC" stroke="#111" strokeWidth="1.5" />

      {/* Person B */}
      <circle cx="200" cy="70" r="22" fill="#ECECEC" stroke="#111" strokeWidth="1.5" />
      <path d="M168 170 Q168 130 200 130 Q232 130 232 170" fill="#ECECEC" stroke="#111" strokeWidth="1.5" />

      {/* Compatibility bars in the middle */}
      {[
        { y: 55, w: 50, color: "#F472B6" },
        { y: 70, w: 35, color: "#818CF8" },
        { y: 85, w: 42, color: "#34D399" },
      ].map(({ y, w, color }) => (
        <g key={y}>
          <rect x={140 - w / 2} y={y} width={w} height="8" rx="4" fill={color} opacity="0.85" />
        </g>
      ))}

      {/* Match % label */}
      <rect x="115" y="110" width="50" height="18" rx="9" fill="#F472B6" opacity="0.9" />
      <text x="140" y="123" textAnchor="middle" fontSize="10" fill="white" fontWeight="bold">94%</text>
    </svg>
  );
}
