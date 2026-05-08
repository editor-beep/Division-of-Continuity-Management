interface DissolutionPortraitProps {
  dissolution_index: number;
}

export function DissolutionPortrait({ dissolution_index }: DissolutionPortraitProps) {
  // Stage 0: 0-20%
  // Stage 1: 20-40%
  // Stage 2: 40-60%
  // Stage 3: 60-80%
  // Stage 4: 80-100%
  const stage = Math.min(4, Math.floor(dissolution_index / 20));
  
  return (
    <div className="w-48 h-48 border-2 border-[#FFB000] p-4 flex items-center justify-center relative overflow-hidden bg-[#0A0A0F]">
      <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" stroke="#FFB000" strokeWidth="1.5">
        {/* Base face-like structure that slowly fades */}
        <g style={{ opacity: Math.max(0, 1 - stage * 0.25) }}>
          <circle cx="50" cy="50" r="30" />
          <circle cx="40" cy="45" r="2" fill="#FFB000" />
          <circle cx="60" cy="45" r="2" fill="#FFB000" />
          <path d="M 45 60 Q 50 65 55 60" />
        </g>
        
        {/* Geometric structures that emerge */}
        {stage >= 1 && (
          <g stroke="#00B8B0" style={{ opacity: stage * 0.25 }}>
            <polygon points="50,10 90,90 10,90" />
          </g>
        )}
        
        {stage >= 2 && (
          <g stroke="#8C4EFF" style={{ opacity: (stage - 1) * 0.33 }}>
            <polygon points="50,90 10,10 90,10" />
            <circle cx="50" cy="50" r="15" />
          </g>
        )}
        
        {stage >= 3 && (
          <g stroke="#FFB000" style={{ opacity: (stage - 2) * 0.5 }}>
            <path d="M 50 5 L 95 50 L 50 95 L 5 50 Z" />
            <circle cx="50" cy="50" r="40" strokeDasharray="5,5" />
          </g>
        )}
        
        {stage >= 4 && (
          <g stroke="#5C0010" style={{ opacity: (stage - 3) * 1 }}>
            <circle cx="50" cy="50" r="45" />
            <path d="M 25 25 L 75 75 M 25 75 L 75 25" />
            <circle cx="50" cy="50" r="5" fill="#5C0010" />
          </g>
        )}
      </svg>
      
      {/* Scanline effect over portrait */}
      <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] pointer-events-none opacity-50" />
    </div>
  );
}
