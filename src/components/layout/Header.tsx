'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';

export function Header() {
  const { isDark, toggle, mounted } = useTheme();
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <>
      <header
        className="sticky top-0 z-40 backdrop-blur-xl border-b"
        style={{
          background: 'color-mix(in srgb, var(--bg-card) 90%, transparent)',
          borderColor: 'var(--border)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--accent)' }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 12 L5 6 L8 9 L11 3 L14 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="font-display text-lg font-700 tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Invista<span style={{ color: 'var(--accent)' }}>Sim</span>
            </span>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            {/* Como usar — text+icon on sm+, icon-only on mobile */}
            <button
              onClick={() => setHelpOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-3)';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="8" cy="8" r="6.5"/>
                <path d="M8 7v4M8 5.5v.5" strokeLinecap="round"/>
              </svg>
              <span className="hidden sm:inline">Como usar</span>
            </button>

            {/* Theme toggle */}
            {mounted && (
              <button
                onClick={toggle}
                className="relative w-10 h-6 rounded-full transition-all duration-300 focus:outline-none"
                style={{
                  background: isDark ? 'var(--accent)' : 'var(--border)',
                }}
                aria-label="Toggle dark mode"
              >
                <motion.div
                  className="absolute top-0.5 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: 'white' }}
                  animate={{ left: isDark ? 'calc(100% - 22px)' : '2px' }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                >
                  {isDark ? (
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                      <path d="M10 6.5A4.5 4.5 0 016.5 2a4.5 4.5 0 100 9A4.5 4.5 0 0110 6.5z" fill="var(--accent)"/>
                    </svg>
                  ) : (
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                      <circle cx="6" cy="6" r="2.5" fill="#f59e0b"/>
                      <path d="M6 1v1M6 10v1M1 6h1M10 6h1M2.5 2.5l.7.7M8.8 8.8l.7.7M2.5 9.5l.7-.7M8.8 3.2l.7-.7"
                        stroke="#f59e0b" strokeWidth="1" strokeLinecap="round"/>
                    </svg>
                  )}
                </motion.div>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Help Modal */}
      <AnimatePresence>
        {helpOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            onClick={() => setHelpOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="glass-card w-full max-w-lg p-6 sm:p-8"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-xl font-700" style={{ color: 'var(--text-primary)' }}>
                  Como usar a calculadora
                </h2>
                <button
                  onClick={() => setHelpOpen(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                  style={{ background: 'var(--surface-3)', color: 'var(--text-secondary)' }}
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {[
                  {
                    icon: '1',
                    title: 'Configure o investimento',
                    desc: 'Defina quanto você vai investir hoje (valor inicial) e quanto vai colocar todo mês (aporte mensal).',
                  },
                  {
                    icon: '2',
                    title: 'Escolha a taxa de juros',
                    desc: 'Digite uma taxa manualmente ou clique em "SELIC" ou "CDI" para usar as taxas reais do mercado brasileiro.',
                  },
                  {
                    icon: '3',
                    title: 'Defina o período',
                    desc: 'Escolha por quantos anos você pretende investir — use o slider ou o campo de texto.',
                  },
                  {
                    icon: '4',
                    title: 'Veja os resultados',
                    desc: 'O gráfico mostra como seu dinheiro cresce. Os cards mostram o valor total, quanto você investiu e quanto rendeu.',
                  },
                  {
                    icon: '5',
                    title: 'Explore o mercado',
                    desc: 'Clique nos indicadores (SELIC, CDI, IBOVESPA, USD/BRL) para ver gráficos históricos com filtros de tempo.',
                  },
                ].map((step) => (
                  <div key={step.icon} className="flex gap-4">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-700"
                      style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
                    >
                      {step.icon}
                    </div>
                    <div>
                      <p className="text-sm font-600" style={{ color: 'var(--text-primary)' }}>
                        {step.title}
                      </p>
                      <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                        {step.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div
                className="mt-6 p-4 rounded-xl text-sm"
                style={{ background: 'var(--accent-light)', color: 'var(--accent-dark)' }}
              >
                <strong>Dica:</strong> Use o "Modo Avançado" para ver o impacto da inflação e do imposto de renda no seu investimento.
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
