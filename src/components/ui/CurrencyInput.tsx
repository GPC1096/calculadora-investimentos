'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  prefix?: string;
  suffix?: string;
  placeholder?: string;
}

/** Format a numeric value as Brazilian currency string (no R$ prefix) */
function formatBRL(cents: number): string {
  if (cents === 0) return '';
  const value = cents / 100;
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function CurrencyInput({
  value,
  onChange,
  prefix = 'R$',
  suffix,
  placeholder = '0,00',
}: CurrencyInputProps) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Internal display state: formatted string
  const [displayValue, setDisplayValue] = useState(() => formatBRL(Math.round(value * 100)));

  // Sync external value → display when not focused
  const externalCents = Math.round(value * 100);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    // Strip everything except digits
    const digitsOnly = e.target.value.replace(/\D/g, '');
    const cents = parseInt(digitsOnly || '0', 10);
    const formatted = formatBRL(cents);
    setDisplayValue(formatted);
    onChange(cents / 100);
  }, [onChange]);

  const handleFocus = () => {
    setFocused(true);
    // Ensure display is in sync on focus
    setDisplayValue(formatBRL(externalCents));
  };

  const handleBlur = () => {
    setFocused(false);
    setDisplayValue(formatBRL(externalCents));
  };

  // When not focused, always show the external value formatted
  const shownValue = focused ? displayValue : (externalCents === 0 ? '' : formatBRL(externalCents));

  return (
    <div
      className="flex items-center gap-2 px-4 py-3 rounded-xl transition-all duration-200 cursor-text"
      style={{
        background: 'var(--surface-2)',
        border: `1.5px solid ${focused ? 'var(--accent)' : 'var(--border)'}`,
        boxShadow: focused ? '0 0 0 3px var(--accent-glow)' : 'none',
      }}
      onClick={() => inputRef.current?.focus()}
    >
      {prefix && (
        <span className="text-sm font-medium select-none shrink-0" style={{ color: 'var(--text-muted)' }}>
          {prefix}
        </span>
      )}
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        value={shownValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        className="flex-1 bg-transparent outline-none text-base font-medium min-w-0"
        style={{ color: 'var(--text-primary)' }}
      />
      {suffix && (
        <span className="text-sm font-medium shrink-0 select-none" style={{ color: 'var(--text-muted)' }}>
          {suffix}
        </span>
      )}
    </div>
  );
}

/** Percentage input with real-time decimal formatting */
interface PercentInputProps {
  value: number;
  onChange: (value: number) => void;
  suffix?: string;
  placeholder?: string;
  step?: number;
  max?: number;
  highlighted?: boolean;
}

export function PercentInput({
  value,
  onChange,
  suffix = '%',
  placeholder = '0,00',
  highlighted = false,
}: PercentInputProps) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [raw, setRaw] = useState('');

  const formatPct = (v: number) =>
    v === 0
      ? ''
      : v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Sync raw display when external value changes (e.g. SELIC/CDI button click while focused)
  useEffect(() => {
    if (focused) {
      setRaw(value === 0 ? '' : formatPct(value));
    }
  }, [value, focused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setRaw(input);
    const cleaned = input.replace(',', '.').replace(/[^0-9.]/g, '');
    const parsed = parseFloat(cleaned);
    if (!isNaN(parsed)) onChange(parsed);
    else if (cleaned === '' || cleaned === '.') onChange(0);
  };

  const handleFocus = () => {
    setFocused(true);
    setRaw(value === 0 ? '' : formatPct(value));
  };

  const handleBlur = () => {
    setFocused(false);
    setRaw('');
  };

  return (
    <div
      className="flex items-center gap-2 px-4 py-3 rounded-xl transition-all duration-200 cursor-text"
      style={{
        background: 'var(--surface-2)',
        border: `1.5px solid ${highlighted || focused ? 'var(--accent)' : 'var(--border)'}`,
        boxShadow: highlighted || focused ? '0 0 0 3px var(--accent-glow)' : 'none',
      }}
      onClick={() => inputRef.current?.focus()}
    >
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        value={focused ? raw : formatPct(value)}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        className="flex-1 bg-transparent outline-none text-base font-medium min-w-0"
        style={{ color: 'var(--text-primary)' }}
      />
      {suffix && (
        <span className="text-sm font-medium shrink-0 select-none" style={{ color: 'var(--text-muted)' }}>
          {suffix}
        </span>
      )}
    </div>
  );
}
