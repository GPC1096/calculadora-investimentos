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
import { useMarketData, useHistoricalData } from '@/hooks/useMarketData';
import type { MarketIndicator, TimeFilter } from '@/types';
import { formatCurrencyCompact } from '@/lib/calculations';

const TIME_FILTERS: TimeFilter[] = ['1D', '1W', '1M', '6M', '12M', '5Y'];

const INDICATORS: Array<{
  key: MarketIndicator;
  label: string;
  format: (v: number) => string;
  isRate: boolean;
}> = [
  { key: 'SELIC', label: 'SELIC', format: (v) => `${v.toFixed(2)}%`, isRate: true },
  { key: 'CDI', label: 'CDI', format: (v) => `${v.toFixed(2)}%`, isRate: true },
  { key: 'IBOVESPA', label: 'IBOVESPA', format: (v) => v.toLocaleString('pt-BR', { maximumFractionDigits: 0 }), isRate: false },
  { key: 'USD/BRL', label: 'USD/BRL', format: (v) => `R$ ${v.toFixed(2)}`, isRate: false },
];

function SkeletonCard() {
  return (
    <div className="market-card p-4 animate-pulse">
      <div className="flex justify-between items-start mb-3">
        <div className="h-3 w-16 rounded" style={{ background: 'var(--border)' }} />
        <div className="h-5 w-12 rounded" style={{ background: 'var(--border)' }} />
      </div>
      <div className="h-7 w-24 rounded mb-1" style={{ background: 'var(--border)' }} />
      <div className="h-3 w-10 rounded" style={{ background: 'var(--border)' }} />
    </div>
  );
}

/** Badge showing variation — handles both % changes and bp changes for rates */
function VariationBadge({
  variation,
  isRate,
  changed,
}: {
  variation: number;
  isRate: boolean;
  changed?: boolean;
}) {
  const isZero = Math.abs(variation) < 0.001;

  if (isRate) {
    // For SELIC/CDI: show basis points change or "Estável"
    if (isZero || !changed) {
      return (
        <span
          className="text-xs font-600 px-1.5 py-0.5 rounded-md"
          style={{ background: 'var(--surface-3)', color: 'var(--text-muted)' }}
        >
          Estável
        </span>
      );
    }
    const bp = Math.round(variation * 100); // convert pp → basis points
    const isPos = bp > 0;
    return (
      <span
        className="text-xs font-700 px-1.5 py-0.5 rounded-md"
        style={{
          background: isPos ? 'var(--accent-light)' : 'rgba(224,92,92,0.1)',
          color: isPos ? 'var(--accent)' : 'var(--negative)',
        }}
      >
        {isPos ? '+' : ''}{bp}bp
      </span>
    );
  }

  // For market prices: show % variation
  if (isZero) {
    return (
      <span
        className="text-xs font-600 px-1.5 py-0.5 rounded-md"
        style={{ background: 'var(--surface-3)', color: 'var(--text-muted)' }}
      >
        0,00%
      </span>
    );
  }
  const isPos = variation > 0;
  return (
    <span
      className="text-xs font-700 px-1.5 py-0.5 rounded-md"
      style={{
        background: isPos ? 'var(--accent-light)' : 'rgba(224,92,92,0.1)',
        color: isPos ? 'var(--accent)' : 'var(--negative)',
      }}
    >
      {isPos ? '+' : ''}{variation.toFixed(2).replace('.', ',')}%
    </span>
  );
}

function HistoricalChart({
  indicator,
  filter,
  isDark,
}: {
  indicator: MarketIndicator;
  filter: TimeFilter;
  isDark: boolean;
}) {
  const { data, isLoading } = useHistoricalData(indicator, filter);
  const isRate = indicator === 'SELIC' || indicator === 'CDI';

  const gridColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)';
  const textColor = isDark ? '#445568' : '#9aa3b5';

  if (isLoading) {
    return (
      <div className="h-48 flex items-center justify-center">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-6 rounded-full"
              style={{ background: 'var(--accent)' }}
              animate={{ scaleY: [1, 2, 1] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="h-48 flex items-center justify-center text-sm" style={{ color: 'var(--text-muted)' }}>
        Dados indisponíveis
      </div>
    );
  }

  const first = data[0]?.value ?? 0;
  const last = data[data.length - 1]?.value ?? 0;
  const isPositive = last >= first;
  const strokeColor = isPositive ? 'var(--accent)' : 'var(--negative)';
  const gradId = `hg_${indicator.replace('/', '_')}`;

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity={0.25} />
            <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: textColor, fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: textColor, fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          domain={['auto', 'auto']}
          tickFormatter={(v) => {
            if (indicator === 'IBOVESPA') return formatCurrencyCompact(v).replace('R$\u00a0', '');
            if (indicator === 'USD/BRL') return `R$${v.toFixed(2)}`;
            return `${v.toFixed(2)}%`;
          }}
          width={62}
        />
        <Tooltip
          formatter={(v: unknown, _name: unknown) => {
            const n = v as number;
            if (indicator === 'IBOVESPA') return [n.toLocaleString('pt-BR', { maximumFractionDigits: 0 }) + ' pts', 'Pontos'];
            if (indicator === 'USD/BRL') return [`R$ ${n.toFixed(4)}`, 'USD/BRL'];
            return [`${n.toFixed(2)}% a.a.`, indicator];
          }}
          contentStyle={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            fontSize: '12px',
            color: 'var(--text-primary)',
          }}
        />
        <Area
          // Step chart for rates (SELIC/CDI) — shows decision points clearly
          type={isRate ? 'stepAfter' : 'monotone'}
          dataKey="value"
          stroke={strokeColor}
          strokeWidth={2}
          fill={`url(#${gradId})`}
          dot={isRate ? { r: 3, fill: strokeColor, strokeWidth: 0 } : false}
          activeDot={{ r: 4, strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

interface Props {
  isDark: boolean;
}

export function MarketCards({ isDark }: Props) {
  const { data, isLoading, isError } = useMarketData();
  const [activeCard, setActiveCard] = useState<MarketIndicator | null>(null);
  const [activeFilter, setActiveFilter] = useState<TimeFilter>('1M');

  const getVariation = (indicator: MarketIndicator): number => {
    if (!data) return 0;
    return {
      SELIC: data.selicVariation,
      CDI: data.cdiVariation,
      IBOVESPA: data.ibovespaVariation,
      'USD/BRL': data.usdBrlVariation,
    }[indicator];
  };

  const getValue = (indicator: MarketIndicator): number | undefined => {
    if (!data) return undefined;
    return { SELIC: data.selic, CDI: data.cdi, IBOVESPA: data.ibovespa, 'USD/BRL': data.usdBrl }[indicator];
  };

  const getChanged = (indicator: MarketIndicator): boolean => {
    if (!data) return false;
    return indicator === 'SELIC' ? data.selicChanged : indicator === 'CDI' ? data.cdiChanged : false;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-700" style={{ color: 'var(--text-primary)' }}>
          Mercado ao vivo
        </h3>
        <div className="flex items-center gap-3">
          {isError && (
            <p className="text-xs" style={{ color: 'var(--negative)' }}>Usando dados aproximados</p>
          )}
          {data && (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Atualizado às {data.lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : INDICATORS.map(({ key, label, format, isRate }) => {
              const value = getValue(key);
              const variation = getVariation(key);
              const changed = getChanged(key);
              const isActive = activeCard === key;

              return (
                <motion.div
                  key={key}
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.98 }}
                  className={`market-card p-4 select-none ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveCard((prev) => (prev === key ? null : key))}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-700 uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                      {label}
                    </span>
                    <VariationBadge variation={variation} isRate={isRate} changed={changed} />
                  </div>
                  <p
                    className="font-display font-800 leading-tight"
                    style={{
                      color: isActive ? 'var(--accent)' : 'var(--text-primary)',
                      fontSize: 'clamp(1.1rem, 3vw, 1.4rem)',
                    }}
                  >
                    {value !== undefined ? format(value) : '—'}
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    {isActive ? 'Ver menos ↑' : 'Ver histórico ↓'}
                  </p>
                </motion.div>
              );
            })}
      </div>

      {/* Expanded historical chart */}
      <AnimatePresence>
        {activeCard && (
          <motion.div
            key={activeCard}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div className="glass-card p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h4 className="font-display text-base font-700" style={{ color: 'var(--text-primary)' }}>
                    {INDICATORS.find((i) => i.key === activeCard)?.label} — Histórico
                  </h4>
                  {(activeCard === 'SELIC' || activeCard === 'CDI') && (
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      Mostra apenas decisões que alteraram a taxa
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: 'var(--surface-3)' }}>
                  {TIME_FILTERS.map((f) => (
                    <button
                      key={f}
                      onClick={() => setActiveFilter(f)}
                      className="px-2.5 py-1 rounded-md text-xs font-600 transition-all duration-150"
                      style={{
                        background: activeFilter === f ? 'var(--accent)' : 'transparent',
                        color: activeFilter === f ? 'white' : 'var(--text-muted)',
                      }}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <HistoricalChart indicator={activeCard} filter={activeFilter} isDark={isDark} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
