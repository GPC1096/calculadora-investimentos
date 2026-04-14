'use client';

interface SliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  formatLabel?: (value: number) => string;
}

export function Slider({ value, min, max, step = 1, onChange }: SliderProps) {
  const percent = ((value - min) / (max - min)) * 100;

  return (
    <div className="relative w-full">
      <div
        className="absolute top-1/2 left-0 h-1 rounded-full pointer-events-none"
        style={{
          width: `${percent}%`,
          background: 'linear-gradient(90deg, var(--accent), var(--accent-mid))',
          transform: 'translateY(-50%)',
          zIndex: 1,
        }}
      />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full relative"
        style={{ zIndex: 2 }}
      />
    </div>
  );
}
