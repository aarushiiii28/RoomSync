export default function ExplainableAI() {
  return (
    <svg viewBox="0 0 280 200" className="w-full h-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Brain outline */}
      <ellipse cx="140" cy="90" rx="55" ry="50" fill="#1E1B4B" stroke="#818CF8" strokeWidth="2" />
      <path d="M120 60 Q140 45 160 60" stroke="#A78BFA" strokeWidth="1.5" fill="none" />
      <path d="M108 85 Q100 70 110 60" stroke="#A78BFA" strokeWidth="1.5" fill="none" />
      <path d="M172 85 Q180 70 170 60" stroke="#A78BFA" strokeWidth="1.5" fill="none" />
      <path d="M110 100 Q105 115 115 125" stroke="#A78BFA" strokeWidth="1.5" fill="none" />
      <path d="M170 100 Q175 115 165 125" stroke="#A78BFA" strokeWidth="1.5" fill="none" />
      <path d="M130 115 Q140 130 150 115" stroke="#A78BFA" strokeWidth="1.5" fill="none" />

      {/* Nodes */}
      {[[140,90],[118,75],[162,75],[108,100],[172,100],[130,115],[150,115]].map(([cx,cy],i) => (
        <circle key={i} cx={cx} cy={cy} r="5" fill="#818CF8" opacity="0.9" />
      ))}

      {/* Explanation bubble */}
      <rect x="20" y="150" width="240" height="36" rx="10" fill="#1E1B4B" stroke="#818CF8" strokeWidth="1.5" />
      <rect x="34" y="161" width="80" height="6" rx="3" fill="#818CF8" opacity="0.7" />
      <rect x="124" y="161" width="50" height="6" rx="3" fill="#F472B6" opacity="0.7" />
      <rect x="184" y="161" width="60" height="6" rx="3" fill="#34D399" opacity="0.7" />
      <rect x="34" y="173" width="120" height="6" rx="3" fill="#374151" />
    </svg>
  );
}
