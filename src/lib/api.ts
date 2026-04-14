import type { MarketData, HistoricalPoint, TimeFilter } from '@/types';

// All external calls go through our own API routes to avoid CORS issues

export async function fetchMarketData(): Promise<MarketData> {
  const res = await fetch('/api/market', { next: { revalidate: 300 } });
  if (!res.ok) throw new Error('Failed to fetch market data');
  const json = await res.json();

  return {
    ...json,
    lastUpdated: new Date(json.lastUpdated),
  };
}

export async function fetchHistoricalData(
  indicator: string,
  filter: TimeFilter
): Promise<HistoricalPoint[]> {
  const params = new URLSearchParams({ indicator, filter });
  const res = await fetch(`/api/historical?${params}`, { next: { revalidate: 300 } });
  if (!res.ok) throw new Error('Failed to fetch historical data');
  return res.json();
}
