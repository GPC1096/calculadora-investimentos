import type { CalculatorInputs, CalculatorResults, ChartDataPoint, AdvancedResults } from '@/types';

// IR tax brackets for fixed income in Brazil (tabela regressiva)
export function getIRRate(months: number): number {
  if (months <= 6) return 0.225;
  if (months <= 12) return 0.20;
  if (months <= 24) return 0.175;
  return 0.15;
}

/** Convert entered rate to effective monthly rate */
function toMonthlyRate(rate: number, unit: 'month' | 'year'): number {
  if (unit === 'month') {
    return rate / 100;
  }
  // Annual → monthly using compound formula for accuracy
  return Math.pow(1 + rate / 100, 1 / 12) - 1;
}

export function calculate(inputs: CalculatorInputs, inflationRate = 4.5): CalculatorResults {
  const { initialAmount, monthlyContribution, annualRate, rateUnit, period } = inputs;

  const totalMonths = inputs.periodUnit === 'months' ? period : period * 12;
  const monthlyRate = toMonthlyRate(annualRate, rateUnit);

  const chartData: ChartDataPoint[] = [];
  let totalValue = initialAmount;
  let totalInvested = initialAmount;

  const monthlyInflation = inflationRate / 100 / 12;
  const irRate = getIRRate(totalMonths);

  for (let m = 0; m <= totalMonths; m++) {
    if (m === 0) {
      chartData.push({
        period: 0,
        label: 'Início',
        totalValue: initialAmount,
        invested: initialAmount,
        interest: 0,
        inflationAdjusted: initialAmount,
        taxAdjusted: initialAmount,
      });
      continue;
    }

    totalValue = totalValue * (1 + monthlyRate) + monthlyContribution;
    totalInvested = initialAmount + monthlyContribution * m;

    const profit = totalValue - totalInvested;
    const taxOnProfit = profit > 0 ? profit * irRate : 0;
    const afterTax = totalValue - taxOnProfit;

    const inflationFactor = Math.pow(1 + monthlyInflation, m);
    const realValue = totalValue / inflationFactor;

    const label = m % 12 === 0 ? `Ano ${m / 12}` : `Mês ${m}`;

    chartData.push({
      period: m,
      label,
      totalValue: Math.round(totalValue * 100) / 100,
      invested: Math.round(totalInvested * 100) / 100,
      interest: Math.round(Math.max(0, totalValue - totalInvested) * 100) / 100,
      inflationAdjusted: Math.round(realValue * 100) / 100,
      taxAdjusted: Math.round(afterTax * 100) / 100,
    });
  }

  const finalProfit = totalValue - totalInvested;
  const irRateFinal = getIRRate(totalMonths);
  const taxOnFinalProfit = finalProfit > 0 ? finalProfit * irRateFinal : 0;
  const afterTaxFinal = totalValue - taxOnFinalProfit;
  const inflationFactor = Math.pow(1 + monthlyInflation, totalMonths);
  const inflationAdjustedTotal = totalValue / inflationFactor;

  // Downsample for performance (max 120 points)
  let displayData = chartData;
  if (chartData.length > 120) {
    const step = Math.ceil(chartData.length / 120);
    displayData = chartData.filter((_, i) => i === 0 || i === chartData.length - 1 || i % step === 0);
  }

  const advancedResults: AdvancedResults = {
    inflationRate,
    taxRate: irRateFinal * 100,
    inflationAdjustedTotal: Math.round(inflationAdjustedTotal * 100) / 100,
    afterTaxTotal: Math.round(afterTaxFinal * 100) / 100,
    realGain: Math.round((inflationAdjustedTotal - totalInvested) * 100) / 100,
    netTaxProfit: Math.round((afterTaxFinal - totalInvested) * 100) / 100,
  };

  return {
    totalAccumulated: Math.round(totalValue * 100) / 100,
    totalInvested: Math.round(totalInvested * 100) / 100,
    totalInterest: Math.round(Math.max(0, totalValue - totalInvested) * 100) / 100,
    chartData: displayData,
    advancedResults,
  };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatCurrencyCompact(value: number): string {
  if (value >= 1_000_000) {
    return (
      new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value / 1_000_000) + 'M'
    );
  }
  if (value >= 1_000) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }
  return formatCurrency(value);
}

export function formatPercent(value: number, decimals = 2): string {
  return `${value.toFixed(decimals)}%`;
}
