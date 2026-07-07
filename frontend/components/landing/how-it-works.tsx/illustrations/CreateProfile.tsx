export default function CreateProfile() {
  return (
    <svg
      viewBox="0 0 420 320"
      className="w-full h-auto"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Card */}

      <rect
        x="120"
        y="35"
        width="210"
        height="235"
        rx="18"
        fill="#171A22"
        stroke="#2B3140"
        strokeWidth="2"
      />

      {/* Header */}

      <rect
        x="145"
        y="58"
        width="90"
        height="12"
        rx="6"
        fill="#F5F5F5"
      />

      {/* Fields */}

      {[
        95,
        125,
        155,
        185,
        215
      ].map((y) => (
        <g key={y}>
          <circle
            cx="155"
            cy={y}
            r="4"
            fill="#FF82A7"
          />

          <rect
            x="170"
            y={y - 5}
            width="110"
            height="10"
            rx="5"
            fill="#4A5568"
          />
        </g>
      ))}

      {/* Neutral avatar */}

      <circle
        cx="70"
        cy="125"
        r="28"
        fill="#ECECEC"
        stroke="#111"
        strokeWidth="2"
      />

      <path
        d="M35 210
           C35 175 55 160 70 160
           C85 160 105 175 105 210"
        fill="#ECECEC"
        stroke="#111"
        strokeWidth="2"
      />

      {/* Pixel-art Blue Cursor */}
      {(() => {
        const grid = [
          "X",
          "XX",
          "XOX",
          "XOOX",
          "XOOOX",
          "XOOOOX",
          "XOOOOOX",
          "XOOOOOOX",
          "XOOOOOOOX",
          "XOOOOOOOOX",
          "XOOOOOOOOOX",
          "XOOOOOOOOOOX",
          "XOOOOOXXXXXX",
          "XOOXOOX",
          "XOX.XOOX",
          "XX..XOOX",
          "....XXOOX",
          ".....XOOX",
          ".....XX"
        ];
        return (
          <g transform="translate(255, 180)">
            {grid.map((row, y) =>
              row.split("").map((char, x) => {
                if (char === "X") {
                  return <rect key={`${x}-${y}`} x={x * 1.6} y={y * 1.6} width={1.6} height={1.6} fill="#4D8CFA" />;
                }
                if (char === "O") {
                  return <rect key={`${x}-${y}`} x={x * 1.6} y={y * 1.6} width={1.6} height={1.6} fill="#EBF3FF" />;
                }
                return null;
              })
            )}
          </g>
        );
      })()}
    </svg>
  );
}