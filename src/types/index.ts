export interface CalculatorInputs {
  initialAmount: number;
  monthlyContribution: number;
  annualRate: number;       // The rate as entered by user (could be monthly or annual)
  rateUnit: 'month' | 'year';
  period: number;           // Always in years
  periodUnit: 'months' | 'years';
}

export interface CalculatorResults {
  totalAccumulated: number;
  totalInvested: number;
  totalInterest: number;
  chartData: ChartDataPoint[];
  advancedResults?: AdvancedResults;
}

export interface ChartDataPoint {
  period: number;
  label: string;
  totalValue: number;
  invested: number;
  interest: number;
  inflationAdjusted?: number;
  taxAdjusted?: number;
}

export interface AdvancedResults {
  inflationRate: number;
  taxRate: number;
  inflationAdjustedTotal: number;
  afterTaxTotal: number;
  realGain: number;
  netTaxProfit: number;
}

export interface MarketData {
  selic: number;
  cdi: number;
  ibovespa: number;
  usdBrl: number;
  selicVariation: number;
  cdiVariation: number;
  ibovespaVariation: number;
  usdBrlVariation: number;
  selicChanged: boolean;
  cdiChanged: boolean;
  lastUpdated: Date;
}

export interface HistoricalPoint {
  date: string;
  value: number;
}

export interface NewsItem {
  title: string;
  link: string;
  source: string;
  pubDate: string;
  description?: string;
  imageUrl?: string;
}

export type MarketIndicator = 'SELIC' | 'CDI' | 'IBOVESPA' | 'USD/BRL';

export type TimeFilter = '1D' | '1W' | '1M' | '6M' | '12M' | '5Y';
