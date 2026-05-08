interface StatBarProps {
  label: string;
  value: number;
  max?: number;
  colorClass?: string;
  highValueColorClass?: string;
}

export function StatBar({ label, value, max = 100, colorClass = 'bg-[#FFB000]', highValueColorClass = 'bg-[#8C4EFF]' }: StatBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const isHigh = percentage >= 70;
  
  return (
    <div className="flex flex-col gap-1 w-full max-w-xs mb-2">
      <div className="flex justify-between text-xs tracking-widest uppercase">
        <span>{label}</span>
        <span>{value.toFixed(1)}%</span>
      </div>
      <div className="w-full h-3 border border-[#FFB000] p-[1px] relative overflow-hidden bg-[#0A0A0F]">
        <div 
          className={`h-full transition-all duration-1000 ${isHigh && highValueColorClass ? highValueColorClass : colorClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
