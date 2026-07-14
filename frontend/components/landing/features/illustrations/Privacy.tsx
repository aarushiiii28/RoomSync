export default function Privacy() {
  return (
    <svg viewBox="0 0 280 200" className="w-full h-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Shield */}
      <path
        d="M140 20 L195 45 L195 100 Q195 150 140 175 Q85 150 85 100 L85 45 Z"
        fill="#064E3B"
        stroke="#34D399"
        strokeWidth="2"
      />
      {/* Lock body */}
      <rect x="122" y="100" width="36" height="28" rx="6" fill="#34D399" opacity="0.9" />
      {/* Lock shackle */}
      <path d="M128 100 L128 88 Q128 75 140 75 Q152 75 152 88 L152 100" stroke="#34D399" strokeWidth="4" strokeLinecap="round" fill="none" />
      {/* Keyhole */}
      <circle cx="140" cy="111" r="4" fill="#064E3B" />
      <rect x="138" y="111" width="4" height="8" rx="1" fill="#064E3B" />

      {/* Blurred data rows suggesting privacy */}
      {[155, 165, 175].map((y) => (
        <rect key={y} x="90" y={y} width={60 + Math.sin(y) * 20} height="5" rx="2.5" fill="#374151" opacity="0.5" />
      ))}
    </svg>
  );
}
