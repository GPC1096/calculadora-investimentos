'use client';

import useSWR from 'swr';
import { fetchMarketData, fetchHistoricalData } from '@/lib/api';
import type { MarketData, HistoricalPoint, TimeFilter } from '@/types';

export function useMarketData() {
  const { data, error, isLoading } = useSWR<MarketData>(
    'market-data',
    fetchMarketData,
    {
      refreshInterval: 5 * 60 * 1000, // refresh every 5 minutes
      revalidateOnFocus: false,
      dedupingInterval: 60 * 1000,
    }
  );

  return {
    data,
    isLoading,
    isError: !!error,
    error,
  };
}

export function useHistoricalData(indicator: string | null, filter: TimeFilter) {
  const { data, error, isLoading } = useSWR<HistoricalPoint[]>(
    indicator ? `historical-${indicator}-${filter}` : null,
    () => fetchHistoricalData(indicator!, filter),
    {
      revalidateOnFocus: false,
      dedupingInterval: 5 * 60 * 1000,
    }
  );

  return {
    data,
    isLoading,
    isError: !!error,
  };
}
