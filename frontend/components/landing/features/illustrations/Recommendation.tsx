export default function Recommendation() {
  return (
    <svg viewBox="0 0 280 200" className="w-full h-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Central AI node */}
      <circle cx="140" cy="95" r="28" fill="#1E1B4B" stroke="#818CF8" strokeWidth="2" />
      <text x="140" y="99" textAnchor="middle" fontSize="11" fill="#A78BFA" fontWeight="bold">AI</text>

      {/* Recommendation cards radiating out */}
      {[
        { x: 40,  y: 40,  label: "97%" },
        { x: 210, y: 40,  label: "91%" },
        { x: 40,  y: 140, label: "88%" },
        { x: 210, y: 140, label: "85%" },
      ].map(({ x, y, label }, i) => (
        <g key={i}>
          <line x1={140} y1={95} x2={x + 25} y2={y + 18} stroke="#818CF8" strokeWidth="1" strokeDasharray="4 3" opacity="0.5" />
          <rect x={x} y={y} width="50" height="36" rx="10" fill="#171A22" stroke="#818CF8" strokeWidth="1.5" />
          <circle cx={x + 14} cy={y + 14} r="8" fill="#374151" />
          <rect x={x + 26} y={y + 9} width="18" height="5" rx="2.5" fill="#818CF8" opacity="0.7" />
          <rect x={x + 26} y={y + 18} width="12" height="5" rx="2.5" fill="#F472B6" opacity="0.8" />
          <text x={x + 25} y={y + 32} fontSize="8" fill="#34D399" fontWeight="bold">{label}</text>
        </g>
      ))}
    </svg>
  );
}
