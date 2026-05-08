interface DissolutionPortraitProps {
  dissolution_index: number;
}

export function DissolutionPortrait({ dissolution_index }: DissolutionPortraitProps) {
  const stage = Math.min(5, Math.floor(dissolution_index / (100 / 6)));

  return (
    <div className="w-44 h-44 border border-[#FFB000]/60 p-3 flex items-center justify-center relative overflow-hidden bg-[#0A0A0F]">
      <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" strokeLinecap="round">
        <g style={{ opacity: Math.max(0, 1 - stage * 0.22) }} stroke="#FFB000" strokeWidth="1.2">
          <circle cx="50" cy="50" r="28" />
          <circle cx="41" cy="44" r="2.5" fill="#FFB000" />
          <circle cx="59" cy="44" r="2.5" fill="#FFB000" />
          <path d="M 44 58 Q 50 63 56 58" strokeWidth="1.5" />
        </g>

        {stage >= 1 && (
          <g stroke="#00B8B0" strokeWidth="0.6" style={{ opacity: Math.min(1, stage * 0.28) }}>
            <polygon points="50,8 92,82 8,82" />
            <line x1="50" y1="8" x2="50" y2="92" />
          </g>
        )}

        {stage >= 2 && (
          <g stroke="#8C4EFF" strokeWidth="0.5" style={{ opacity: Math.min(1, (stage - 1) * 0.35) }}>
            <polygon points="50,92 92,18 8,18" />
            <circle cx="50" cy="50" r="18" />
          </g>
        )}

        {stage >= 3 && (
          <g stroke="#FFB000" strokeWidth="0.5" strokeDasharray="4 2" style={{ opacity: Math.min(1, (stage - 2) * 0.5) }}>
            <path d="M 50 3 L 97 50 L 50 97 L 3 50 Z" />
            <circle cx="50" cy="50" r="38" />
          </g>
        )}

        {stage >= 4 && (
          <g stroke="#5C0010" strokeWidth="0.7" style={{ opacity: Math.min(1, (stage - 3) * 0.7) }}>
            <path d="M 20 20 L 80 80 M 20 80 L 80 20" />
            <circle cx="50" cy="50" r="45" />
            <circle cx="50" cy="50" r="8" fill="#5C0010" fillOpacity="0.6" />
          </g>
        )}

        {stage >= 5 && (
          <g stroke="#FFB000" strokeWidth="0.3" style={{ opacity: 0.9 }}>
            {[0, 30, 60, 90, 120, 150].map((angle) => {
              const rad = (angle * Math.PI) / 180;
              const x1 = 50 + 10 * Math.cos(rad);
              const y1 = 50 + 10 * Math.sin(rad);
              const x2 = 50 + 48 * Math.cos(rad);
              const y2 = 50 + 48 * Math.sin(rad);
              return <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2} />;
            })}
            <circle cx="50" cy="50" r="10" stroke="#8C4EFF" strokeWidth="1" fill="#8C4EFF" fillOpacity="0.3" />
          </g>
        )}
      </svg>

      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          background: 'linear-gradient(transparent 50%, rgba(0,0,0,0.4) 50%)',
          backgroundSize: '100% 3px',
        }}
      />
    </div>
  );
}
