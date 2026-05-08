interface Props {
  dissolution_index: number;
}

export function CRTOverlay({ dissolution_index }: Props) {
  const safe = isNaN(dissolution_index) ? 0 : dissolution_index;
  const baseOpacity = 0.06 + safe * 0.0012;
  const capped = Math.min(baseOpacity, 0.25);

  return (
    <div
      className="fixed inset-0 pointer-events-none z-[9999]"
      style={{
        opacity: capped,
        background: [
          'linear-gradient(rgba(18,16,16,0) 50%, rgba(0,0,0,0.28) 50%)',
          'linear-gradient(90deg, rgba(255,0,0,0.06), rgba(0,255,0,0.02), rgba(0,0,255,0.06))',
        ].join(', '),
        backgroundSize: '100% 2px, 3px 100%',
      }}
    />
  );
}
