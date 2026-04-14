'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { CalculatorResults } from '@/types';
import { formatCurrency, formatCurrencyCompact } from '@/lib/calculations';
import { useCountUp } from '@/hooks/useCountUp';

interface Props {
  results: CalculatorResults;
  isDark: boolean;
}

function AdvancedCard({ label, value, desc, color }: {
  label: string;
  value: number;
  desc: string;
  color?: string;
}) {
  const animated = useCountUp(value);
  return (
    <div
      className="p-4 rounded-xl"
      style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
    >
      <p className="text-xs font-600 uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>
        {label}
      </p>
      <p
        className="font-display text-xl font-800"
        style={{ color: color ?? 'var(--text-primary)' }}
      >
        {formatCurrency(animated)}
      </p>
      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{desc}</p>
    </div>
  );
}

export function AdvancedMode({ results, isDark }: Props) {
  const [open, setOpen] = useState(false);
  const adv = results.advancedResults;

  if (!adv) return null;

  const gridColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)';
  const textColor = isDark ? '#445568' : '#9aa3b5';

  return (
    <div>
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 rounded-xl transition-all duration-200"
        style={{
          background: 'var(--surface-2)',
          border: `1.5px solid ${open ? 'var(--accent)' : 'var(--border)'}`,
          color: 'var(--text-primary)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: open ? 'var(--accent)' : 'var(--surface-3)' }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={open ? 'white' : 'var(--text-muted)'} strokeWidth="1.5">
              <path d="M2 4h10M2 7h10M2 10h6" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="text-left">
            <span className="text-sm font-600">Ver simulação detalhada</span>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Com inflação e imposto de renda
            </p>
          </div>
        </div>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--text-muted)" strokeWidth="1.5">
            <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div
              className="mt-3 p-5 sm:p-6 space-y-6 rounded-2xl"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              {/* Inflation section */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-1 h-5 rounded-full"
                    style={{ background: 'linear-gradient(180deg, #f59e0b, #ef6c00)' }}
                  />
                  <h4 className="text-sm font-700" style={{ color: 'var(--text-primary)' }}>
                    Cenário corrigido pela inflação
                  </h4>
                </div>
                <div
                  className="text-xs p-3 rounded-lg mb-3"
                  style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}
                >
                  Usando inflação de <strong style={{ color: 'var(--text-secondary)' }}>{adv.inflationRate}% a.a. (IPCA estimado)</strong>.
                  Mostra o poder de compra real do seu dinheiro no futuro.
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <AdvancedCard
                    label="Valor real"
                    value={adv.inflationAdjustedTotal}
                    desc="Poder de compra hoje"
                    color="#f59e0b"
                  />
                  <AdvancedCard
                    label="Ganho real"
                    value={adv.realGain}
                    desc="Acima da inflação"
                    color={adv.realGain > 0 ? 'var(--accent)' : 'var(--negative)'}
                  />
                </div>
              </div>

              {/* Tax section */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-1 h-5 rounded-full"
                    style={{ background: 'linear-gradient(180deg, var(--accent), var(--accent-dark))' }}
                  />
                  <h4 className="text-sm font-700" style={{ color: 'var(--text-primary)' }}>
                    Cenário líquido de IR
                  </h4>
                </div>
                <div
                  className="text-xs p-3 rounded-lg mb-3"
                  style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}
                >
                  Alíquota de IR: <strong style={{ color: 'var(--text-secondary)' }}>{adv.taxRate.toFixed(1)}%</strong> sobre o lucro
                  (tabela regressiva — quanto maior o prazo, menor o IR).
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <AdvancedCard
                    label="Líquido de IR"
                    value={adv.afterTaxTotal}
                    desc="Após imposto de renda"
                    color="var(--accent)"
                  />
                  <AdvancedCard
                    label="Lucro líquido"
                    value={adv.netTaxProfit}
                    desc="Ganho após IR"
                    color="var(--accent-mid)"
                  />
                </div>
              </div>

              {/* Comparison chart */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-700" style={{ color: 'var(--text-primary)' }}>
                    Comparativo ao longo do tempo
                  </h4>
                </div>

                {/* Custom legend — uses real CSS variables, reliable in dark mode */}
                <div className="flex flex-wrap gap-3 mb-3">
                  {[
                    { color: 'var(--accent)', label: 'Bruto' },
                    { color: 'var(--accent-mid)', label: 'Líquido IR' },
                    { color: '#f59e0b', label: 'Valor real (inflação)', dashed: true },
                    { color: isDark ? '#2a4a6a' : '#93c5e8', label: 'Investido' },
                  ].map(({ color, label, dashed }) => (
                    <div key={label} className="flex items-center gap-1.5">
                      <svg width="16" height="8" viewBox="0 0 16 8">
                        <line
                          x1="0" y1="4" x2="16" y2="4"
                          stroke={color}
                          strokeWidth="2"
                          strokeDasharray={dashed ? '4 2' : undefined}
                        />
                      </svg>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
                    </div>
                  ))}
                </div>

                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={results.chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="adv_g1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.3}/>
                        <stop offset="100%" stopColor="var(--accent)" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="adv_g2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.2}/>
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="adv_g3" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={isDark ? '#1a3a5a' : '#93c5e8'} stopOpacity={0.3}/>
                        <stop offset="100%" stopColor={isDark ? '#1a3a5a' : '#93c5e8'} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false}/>
                    <XAxis dataKey="label" tick={{ fill: textColor, fontSize: 10 }} axisLine={false} tickLine={false}
                      tickFormatter={(l) => l.includes('Ano') ? l : ''}/>
                    <YAxis tick={{ fill: textColor, fontSize: 10 }} axisLine={false} tickLine={false}
                      tickFormatter={(v) => formatCurrencyCompact(v)} width={68}/>
                    <Tooltip
                      formatter={(v: unknown, name: unknown) => [formatCurrencyCompact(v as number), name as string]}
                      contentStyle={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: '12px',
                        fontSize: '12px',
                        color: 'var(--text-primary)',
                      }}
                    />
                    <Area type="monotone" dataKey="invested" name="Investido" stroke={isDark ? '#2a4a6a' : '#93c5e8'} strokeWidth={1.5} fill="url(#adv_g3)" dot={false}/>
                    <Area type="monotone" dataKey="inflationAdjusted" name="Valor real" stroke="#f59e0b" strokeWidth={1.5} fill="url(#adv_g2)" dot={false} strokeDasharray="5 3"/>
                    <Area type="monotone" dataKey="taxAdjusted" name="Líquido IR" stroke="var(--accent-mid)" strokeWidth={1.5} fill="url(#adv_g1)" dot={false}/>
                    <Area type="monotone" dataKey="totalValue" name="Bruto" stroke="var(--accent)" strokeWidth={2} fill="none" dot={false}/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
