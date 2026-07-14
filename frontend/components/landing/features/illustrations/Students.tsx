export default function Students() {
  return (
    <svg viewBox="0 0 280 200" className="w-full h-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Building */}
      <rect x="70" y="70" width="140" height="110" rx="8" fill="#171A22" stroke="#374151" strokeWidth="2" />
      {/* Floors */}
      <line x1="70" y1="110" x2="210" y2="110" stroke="#374151" strokeWidth="1.5" />
      <line x1="70" y1="145" x2="210" y2="145" stroke="#374151" strokeWidth="1.5" />
      {/* Windows */}
      {[90, 130, 170].map((x) =>
        [82, 118, 155].map((y) => (
          <rect key={`${x}-${y}`} x={x} y={y} width="18" height="14" rx="3"
            fill={Math.random() > 0.4 ? "#FBBF24" : "#1E293B"}
            opacity="0.85"
          />
        ))
      )}
      {/* Door */}
      <rect x="126" y="152" width="28" height="28" rx="4" fill="#374151" />
      <circle cx="149" cy="167" r="2.5" fill="#F472B6" />
      {/* Roof cap */}
      <rect x="65" y="62" width="150" height="12" rx="4" fill="#818CF8" opacity="0.6" />
      {/* Sign */}
      <rect x="95" y="32" width="90" height="22" rx="6" fill="#1E1B4B" stroke="#818CF8" strokeWidth="1.5" />
      <rect x="104" y="40" width="55" height="6" rx="3" fill="#818CF8" opacity="0.8" />
      <rect x="164" y="40" width="14" height="6" rx="3" fill="#F472B6" opacity="0.8" />
    </svg>
  );
}
