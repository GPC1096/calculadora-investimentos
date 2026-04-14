'use client';

import { motion } from 'framer-motion';
import { useCountUp } from '@/hooks/useCountUp';
import { formatCurrency } from '@/lib/calculations';
import type { CalculatorResults } from '@/types';

interface Props {
  results: CalculatorResults;
}

function AnimatedValue({ value, label, accent = false, sublabel }: {
  value: number;
  label: string;
  accent?: boolean;
  sublabel?: string;
}) {
  const animated = useCountUp(value);
  const formatted = formatCurrency(animated);

  const [integer, decimal] = formatted.replace('R$\u00a0', '').split(',');

  return (
    <div
      className="glass-card p-5 sm:p-6 relative overflow-hidden"
      style={{
        borderColor: accent ? 'var(--accent)' : 'var(--border)',
        background: accent ? 'linear-gradient(135deg, var(--accent-light) 0%, var(--bg-card) 100%)' : 'var(--bg-card)',
      }}
    >
      {accent && (
        <div
          className="absolute top-0 left-0 right-0 h-0.5"
          style={{ background: 'linear-gradient(90deg, var(--accent), var(--accent-mid))' }}
        />
      )}
      <p className="text-xs font-600 uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
        {label}
      </p>
      <div className="flex items-baseline gap-0.5">
        <span className="text-sm font-500 mr-1" style={{ color: 'var(--text-muted)' }}>R$</span>
        <span
          className="font-display font-800 leading-none"
          style={{
            color: accent ? 'var(--accent)' : 'var(--text-primary)',
            fontSize: 'clamp(1.4rem, 4vw, 2rem)',
          }}
        >
          {integer}
        </span>
        <span
          className="font-display font-600"
          style={{
            color: accent ? 'var(--accent)' : 'var(--text-secondary)',
            fontSize: 'clamp(0.9rem, 2.5vw, 1.2rem)',
          }}
        >
          ,{decimal}
        </span>
      </div>
      {sublabel && (
        <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>{sublabel}</p>
      )}
    </div>
  );
}

export function ResultCards({ results }: Props) {
  const profitPercent = results.totalInvested > 0
    ? ((results.totalInterest / results.totalInvested) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className=""
      >
        <AnimatedValue
          value={results.totalAccumulated}
          label="Total acumulado"
          accent
          sublabel="Valor final do investimento"
        />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
      >
        <AnimatedValue
          value={results.totalInvested}
          label="Total investido"
          sublabel="Capital que você aportou"
        />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <AnimatedValue
          value={results.totalInterest}
          label="Rendimento"
          sublabel={`+${profitPercent}% sobre o investido`}
        />
      </motion.div>
    </div>
  );
}
