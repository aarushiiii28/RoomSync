export default function Lifestyle() {
  return (
    <svg viewBox="0 0 280 200" className="w-full h-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Sun / morning */}
      <circle cx="60" cy="55" r="28" fill="#FBBF24" opacity="0.85" />
      <line x1="60" y1="15" x2="60" y2="5" stroke="#FBBF24" strokeWidth="3" strokeLinecap="round" />
      <line x1="60" y1="95" x2="60" y2="105" stroke="#FBBF24" strokeWidth="3" strokeLinecap="round" />
      <line x1="20" y1="55" x2="10" y2="55" stroke="#FBBF24" strokeWidth="3" strokeLinecap="round" />
      <line x1="100" y1="55" x2="110" y2="55" stroke="#FBBF24" strokeWidth="3" strokeLinecap="round" />
      <line x1="32" y1="27" x2="25" y2="20" stroke="#FBBF24" strokeWidth="3" strokeLinecap="round" />
      <line x1="88" y1="83" x2="95" y2="90" stroke="#FBBF24" strokeWidth="3" strokeLinecap="round" />
      <line x1="88" y1="27" x2="95" y2="20" stroke="#FBBF24" strokeWidth="3" strokeLinecap="round" />
      <line x1="32" y1="83" x2="25" y2="90" stroke="#FBBF24" strokeWidth="3" strokeLinecap="round" />

      {/* Moon / night */}
      <path d="M210 30 Q230 55 210 80 Q245 75 248 55 Q248 35 210 30Z" fill="#A78BFA" opacity="0.8" />

      {/* Routine timeline */}
      <rect x="40" y="130" width="200" height="4" rx="2" fill="#374151" />
      {[60, 100, 140, 180, 220].map((x, i) => (
        <g key={x}>
          <circle cx={x} cy="132" r="7" fill={["#F472B6","#818CF8","#34D399","#F472B6","#818CF8"][i]} />
          <rect x={x - 14} y="148" width="28" height="6" rx="3" fill="#374151" />
        </g>
      ))}
    </svg>
  );
}
