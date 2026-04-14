'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { CalculatorInputsPanel } from '@/components/calculator/CalculatorInputs';
import { ResultCards } from '@/components/calculator/ResultCards';
import { GrowthChart } from '@/components/calculator/GrowthChart';
import { AdvancedMode } from '@/components/calculator/AdvancedMode';
import { MarketCards } from '@/components/market/MarketCards';
import { MarketNews } from '@/components/market/MarketNews';
import { calculate } from '@/lib/calculations';
import { useTheme } from '@/hooks/useTheme';
import { useMarketData } from '@/hooks/useMarketData';
import type { CalculatorInputs } from '@/types';

const DEFAULT_INPUTS: CalculatorInputs = {
  initialAmount: 1000,
  monthlyContribution: 500,
  annualRate: 12,
  rateUnit: 'year',
  period: 10,
  periodUnit: 'years',
};

export default function Home() {
  const { isDark } = useTheme();
  const { data: marketData } = useMarketData();
  const [inputs, setInputs] = useState<CalculatorInputs>(DEFAULT_INPUTS);
  const [activeRate, setActiveRate] = useState<'manual' | 'selic' | 'cdi'>('manual');

  const results = useMemo(() => calculate(inputs), [inputs]);

  return (
    <div className="mesh-bg min-h-screen" style={{ background: 'var(--bg)' }}>
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 sm:mb-10"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="accent-line w-8" />
            <span
              className="text-xs font-700 uppercase tracking-widest"
              style={{ color: 'var(--accent)' }}
            >
              Simulador de investimentos
            </span>
          </div>

          <h1
            className="font-display leading-tight"
            style={{
              color: 'var(--text-primary)',
              fontSize: 'clamp(1.5rem, 3.5vw, 2.25rem)',
              fontWeight: 400,
              letterSpacing: '-0.02em',
            }}
          >
            Veja seu dinheiro{' '}
            <span className="gradient-text">crescer no tempo</span>
          </h1>

          <p
            className="mt-3 max-w-2xl"
            style={{ color: 'var(--text-secondary)', fontSize: 'clamp(0.95rem, 2vw, 1.05rem)', lineHeight: 1.65 }}
          >
            Configure seu investimento e acompanhe o poder dos juros compostos em tempo real.
            Use dados atualizados da SELIC e CDI para simulações mais precisas.
          </p>
        </motion.div>

        {/* Market indicators */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <MarketCards isDark={isDark} />
        </motion.section>

        {/* Calculator grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <CalculatorInputsPanel
              inputs={inputs}
              onChange={setInputs}
              marketData={marketData}
              activeRate={activeRate}
              onRateSelect={setActiveRate}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-4"
          >
            <ResultCards results={results} />
            <GrowthChart data={results.chartData} isDark={isDark} />
          </motion.div>
        </div>

        {/* Advanced mode + News — stacked collapsibles */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-6 space-y-3"
        >
          <AdvancedMode results={results} isDark={isDark} />
          <MarketNews />
        </motion.div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-12 pt-8 text-center"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Os valores são estimativas baseadas em juros compostos mensais.
            Resultados reais podem variar. Consulte um assessor financeiro antes de investir.
          </p>
          <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
            Dados de mercado via Banco Central do Brasil e Yahoo Finance.
          </p>
        </motion.footer>
      </main>
    </div>
  );
}
