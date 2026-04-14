'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { motion } from 'framer-motion';
import type { ChartDataPoint } from '@/types';
import { formatCurrencyCompact } from '@/lib/calculations';

interface Props {
  data: ChartDataPoint[];
  isDark: boolean;
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  const total = payload.find(p => p.name === 'Total');
  const invested = payload.find(p => p.name === 'Investido');

  return (
    <div
      className="px-4 py-3 rounded-xl shadow-lg text-sm"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        minWidth: '180px',
      }}
    >
      <p className="font-600 mb-2" style={{ color: 'var(--text-secondary)' }}>{label}</p>
      {total && (
        <div className="flex justify-between gap-4">
          <span style={{ color: 'var(--text-muted)' }}>Total</span>
          <span className="font-700" style={{ color: 'var(--accent)' }}>
            {formatCurrencyCompact(total.value)}
          </span>
        </div>
      )}
      {invested && (
        <div className="flex justify-between gap-4 mt-1">
          <span style={{ color: 'var(--text-muted)' }}>Investido</span>
          <span className="font-600" style={{ color: 'var(--text-secondary)' }}>
            {formatCurrencyCompact(invested.value)}
          </span>
        </div>
      )}
      {total && invested && (
        <div
          className="flex justify-between gap-4 mt-2 pt-2"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <span style={{ color: 'var(--text-muted)' }}>Rendimento</span>
          <span className="font-600" style={{ color: 'var(--accent-mid)' }}>
            {formatCurrencyCompact(total.value - invested.value)}
          </span>
        </div>
      )}
    </div>
  );
}

// Filter data to show only key labels
function filterLabels(data: ChartDataPoint[]): ChartDataPoint[] {
  if (data.length <= 24) return data;
  const step = Math.ceil(data.length / 12);
  return data.filter((_, i) => i === 0 || i === data.length - 1 || i % step === 0);
}

export function GrowthChart({ data, isDark }: Props) {
  const filteredForAxis = filterLabels(data);
  const axisLabels = new Set(filteredForAxis.map(d => d.label));

  const gridColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)';
  const textColor = isDark ? '#445568' : '#9aa3b5';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="glass-card p-5 sm:p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-display text-base font-700" style={{ color: 'var(--text-primary)' }}>
            Evolução do patrimônio
          </h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Crescimento ao longo do tempo
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ background: 'var(--accent)' }}/>
            <span style={{ color: 'var(--text-muted)' }}>Total</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ background: isDark ? '#2a4a6a' : '#b8d8f0' }}/>
            <span style={{ color: 'var(--text-muted)' }}>Investido</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gc_total" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.3}/>
              <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.02}/>
            </linearGradient>
            <linearGradient id="gc_invested" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={isDark ? '#1a3a5a' : '#93c5e8'} stopOpacity={0.5}/>
              <stop offset="100%" stopColor={isDark ? '#1a3a5a' : '#93c5e8'} stopOpacity={0.02}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false}/>
          <XAxis
            dataKey="label"
            tick={{ fill: textColor, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(label) => axisLabels.has(label) ? label : ''}
            interval={0}
          />
          <YAxis
            tick={{ fill: textColor, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => formatCurrencyCompact(v)}
            width={72}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--accent)', strokeWidth: 1, strokeDasharray: '4 4' }}/>
          <Area
            type="monotone"
            dataKey="invested"
            name="Investido"
            stroke={isDark ? '#2a4a6a' : '#93c5e8'}
            strokeWidth={2}
            fill="url(#gc_invested)"
            dot={false}
            activeDot={{ r: 4, fill: isDark ? '#2a4a6a' : '#93c5e8', strokeWidth: 0 }}
          />
          <Area
            type="monotone"
            dataKey="totalValue"
            name="Total"
            stroke="var(--accent)"
            strokeWidth={2.5}
            fill="url(#gc_total)"
            dot={false}
            activeDot={{ r: 5, fill: 'var(--accent)', strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
