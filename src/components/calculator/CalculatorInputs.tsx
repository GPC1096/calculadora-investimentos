'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Slider } from '@/components/ui/Slider';
import { CurrencyInput, PercentInput } from '@/components/ui/CurrencyInput';
import { Tooltip } from '@/components/ui/Tooltip';
import type { CalculatorInputs } from '@/types';
import type { MarketData } from '@/types';

interface Props {
  inputs: CalculatorInputs;
  onChange: (inputs: CalculatorInputs) => void;
  marketData?: MarketData;
  activeRate: 'manual' | 'selic' | 'cdi';
  onRateSelect: (type: 'manual' | 'selic' | 'cdi') => void;
}

export function CalculatorInputsPanel({ inputs, onChange, marketData, activeRate, onRateSelect }: Props) {
  const [periodFocused, setPeriodFocused] = useState(false);
  const update = (partial: Partial<CalculatorInputs>) => {
    onChange({ ...inputs, ...partial });
  };

  const handleSelicClick = () => {
    if (marketData) {
      // SELIC is always annual — set rateUnit to year
      update({ annualRate: marketData.selic, rateUnit: 'year' });
      onRateSelect('selic');
    }
  };

  const handleCdiClick = () => {
    if (marketData) {
      update({ annualRate: marketData.cdi, rateUnit: 'year' });
      onRateSelect('cdi');
    }
  };

  const rateLabel = inputs.rateUnit === 'month' ? '% a.m.' : '% a.a.';

  // Effective monthly equivalent for display reference
  const effectiveMonthly =
    inputs.rateUnit === 'year'
      ? ((Math.pow(1 + inputs.annualRate / 100, 1 / 12) - 1) * 100).toFixed(3)
      : inputs.annualRate.toFixed(2);
  const effectiveAnnual =
    inputs.rateUnit === 'month'
      ? ((Math.pow(1 + inputs.annualRate / 100, 12) - 1) * 100).toFixed(2)
      : inputs.annualRate.toFixed(2);

  return (
    <div className="glass-card p-6 space-y-6">
      <h2 className="font-display text-lg font-700" style={{ color: 'var(--text-primary)' }}>
        Configurar simulação
      </h2>

      {/* Initial Amount */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <label className="text-sm font-500" style={{ color: 'var(--text-secondary)' }}>
              Valor inicial
            </label>
            <Tooltip content="Quanto você tem para investir hoje. Pode ser R$ 0 se for começar do zero.">
              <button className="w-4 h-4 rounded-full flex items-center justify-center text-xs" style={{ background: 'var(--surface-3)', color: 'var(--text-muted)' }}>
                ?
              </button>
            </Tooltip>
          </div>
          <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>até R$ 1M</span>
        </div>
        <CurrencyInput
          value={inputs.initialAmount}
          onChange={(v) => update({ initialAmount: v })}
          placeholder="0,00"
        />
        <Slider
          value={Math.min(inputs.initialAmount, 1_000_000)}
          min={0}
          max={1_000_000}
          step={500}
          onChange={(v) => update({ initialAmount: v })}
        />
      </div>

      {/* Monthly Contribution */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <label className="text-sm font-500" style={{ color: 'var(--text-secondary)' }}>
              Aporte mensal
            </label>
            <Tooltip content="Quanto você vai investir todo mês. Ser consistente é o segredo dos juros compostos!">
              <button className="w-4 h-4 rounded-full flex items-center justify-center text-xs" style={{ background: 'var(--surface-3)', color: 'var(--text-muted)' }}>
                ?
              </button>
            </Tooltip>
          </div>
          <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>até R$ 50k/mês</span>
        </div>
        <CurrencyInput
          value={inputs.monthlyContribution}
          onChange={(v) => update({ monthlyContribution: v })}
          placeholder="0,00"
        />
        <Slider
          value={Math.min(inputs.monthlyContribution, 50_000)}
          min={0}
          max={50_000}
          step={100}
          onChange={(v) => update({ monthlyContribution: v })}
        />
      </div>

      {/* Interest Rate */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <label className="text-sm font-500" style={{ color: 'var(--text-secondary)' }}>
              Taxa de juros
            </label>
            <Tooltip content="Rentabilidade esperada. Escolha se a taxa é mensal ou anual. Use os botões SELIC/CDI para preencher automaticamente.">
              <button className="w-4 h-4 rounded-full flex items-center justify-center text-xs" style={{ background: 'var(--surface-3)', color: 'var(--text-muted)' }}>
                ?
              </button>
            </Tooltip>
          </div>
          {/* ao mês / ao ano toggle */}
          <div
            className="flex rounded-lg p-0.5"
            style={{ background: 'var(--surface-3)' }}
          >
            {(['month', 'year'] as const).map((unit) => (
              <button
                key={unit}
                onClick={() => {
                  onRateSelect('manual');
                  update({ rateUnit: unit });
                }}
                className="px-3 py-1 rounded-md text-xs font-600 transition-all duration-200"
                style={{
                  background: inputs.rateUnit === unit ? 'var(--accent)' : 'transparent',
                  color: inputs.rateUnit === unit ? 'white' : 'var(--text-muted)',
                }}
              >
                {unit === 'month' ? 'a.m.' : 'a.a.'}
              </button>
            ))}
          </div>
        </div>

        <PercentInput
          value={inputs.annualRate}
          onChange={(v) => {
            onRateSelect('manual');
            update({ annualRate: v });
          }}
          suffix={rateLabel}
          highlighted={activeRate !== 'manual'}
        />

        {/* Equivalência informativa */}
        {inputs.annualRate > 0 && (
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {inputs.rateUnit === 'year'
              ? `≈ ${effectiveMonthly}% ao mês (juros compostos)`
              : `≈ ${effectiveAnnual}% ao ano (juros compostos)`}
          </p>
        )}

        {/* Quick select: SELIC / CDI */}
        <div className="flex gap-2">
          {[
            { label: 'SELIC', type: 'selic' as const, value: marketData?.selic },
            { label: 'CDI', type: 'cdi' as const, value: marketData?.cdi },
          ].map(({ label, type, value }) => (
            <motion.button
              key={type}
              whileTap={{ scale: 0.97 }}
              onClick={type === 'selic' ? handleSelicClick : handleCdiClick}
              disabled={!marketData}
              className="flex-1 py-2 px-3 rounded-lg text-sm font-600 transition-all duration-200 flex items-center justify-center gap-2"
              style={{
                background: activeRate === type ? 'var(--accent)' : 'var(--surface-3)',
                color: activeRate === type ? 'white' : 'var(--text-secondary)',
                border: `1.5px solid ${activeRate === type ? 'var(--accent)' : 'transparent'}`,
                opacity: !marketData ? 0.5 : 1,
              }}
            >
              <span>{label}</span>
              {value !== undefined && (
                <span
                  className="text-xs opacity-80"
                  style={{ color: activeRate === type ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)' }}
                >
                  {value.toFixed(2)}% a.a.
                </span>
              )}
              {value === undefined && <span className="text-xs opacity-50">...</span>}
            </motion.button>
          ))}
        </div>

        <Slider
          value={Math.min(inputs.annualRate, inputs.rateUnit === 'month' ? 5 : 50)}
          min={0}
          max={inputs.rateUnit === 'month' ? 5 : 50}
          step={0.1}
          onChange={(v) => {
            onRateSelect('manual');
            update({ annualRate: Math.round(v * 10) / 10 });
          }}
        />
      </div>

      {/* Time Period */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <label className="text-sm font-500" style={{ color: 'var(--text-secondary)' }}>
              Período
            </label>
            <Tooltip content="Por quanto tempo você vai manter o investimento. Quanto maior o prazo, mais poderosos são os juros compostos!">
              <button className="w-4 h-4 rounded-full flex items-center justify-center text-xs" style={{ background: 'var(--surface-3)', color: 'var(--text-muted)' }}>
                ?
              </button>
            </Tooltip>
          </div>
          {/* meses / anos toggle */}
          <div className="flex rounded-lg p-0.5" style={{ background: 'var(--surface-3)' }}>
            {(['months', 'years'] as const).map((unit) => (
              <button
                key={unit}
                onClick={() => {
                  if (inputs.periodUnit === unit) return;
                  if (unit === 'months') {
                    // years → months: multiply, cap at 600
                    update({ periodUnit: 'months', period: Math.min(inputs.period * 12, 600) });
                  } else {
                    // months → years: divide, min 1
                    update({ periodUnit: 'years', period: Math.max(1, Math.round(inputs.period / 12)) });
                  }
                }}
                className="px-3 py-1 rounded-md text-xs font-600 transition-all duration-200"
                style={{
                  background: inputs.periodUnit === unit ? 'var(--accent)' : 'transparent',
                  color: inputs.periodUnit === unit ? 'white' : 'var(--text-muted)',
                }}
              >
                {unit === 'months' ? 'meses' : 'anos'}
              </button>
            ))}
          </div>
        </div>

        {(() => {
          const isMonths = inputs.periodUnit === 'months';
          const maxVal = isMonths ? 600 : 50;
          const suffix = isMonths
            ? (inputs.period === 1 ? 'mês' : 'meses')
            : (inputs.period === 1 ? 'ano' : 'anos');
          return (
            <>
              <div
                className="flex items-center gap-2 px-4 py-3 rounded-xl transition-all duration-200"
                style={{
                  background: 'var(--surface-2)',
                  border: `1.5px solid ${periodFocused ? 'var(--accent)' : 'var(--border)'}`,
                  boxShadow: periodFocused ? '0 0 0 3px var(--accent-glow)' : 'none',
                }}
              >
                <input
                  type="number"
                  value={inputs.period || ''}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    if (!isNaN(v) && v >= 1 && v <= maxVal) update({ period: v });
                    else if (e.target.value === '') update({ period: 1 });
                  }}
                  onFocus={() => setPeriodFocused(true)}
                  onBlur={() => setPeriodFocused(false)}
                  placeholder="1"
                  min="1"
                  max={maxVal}
                  className="flex-1 bg-transparent outline-none text-base font-medium min-w-0"
                  style={{ color: 'var(--text-primary)' }}
                />
                <span className="text-sm font-medium shrink-0 select-none" style={{ color: 'var(--text-muted)' }}>
                  {suffix}
                </span>
              </div>
              <Slider
                value={Math.min(inputs.period, maxVal)}
                min={1}
                max={maxVal}
                step={1}
                onChange={(v) => update({ period: v })}
              />
            </>
          );
        })()}
      </div>
    </div>
  );
}
