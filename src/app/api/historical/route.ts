import { NextRequest, NextResponse } from 'next/server';

// ── Yahoo Finance config ──
const RANGE_MAP: Record<string, string> = {
  '1D': '1d', '1W': '5d', '1M': '1mo', '6M': '6mo', '12M': '1y', '5Y': '5y',
};
const INTERVAL_MAP: Record<string, string> = {
  '1D': '5m', '1W': '1h', '1M': '1d', '6M': '1wk', '12M': '1wk', '5Y': '1mo',
};

// Days in each filter window
const FILTER_DAYS: Record<string, number> = {
  '1D': 1, '1W': 7, '1M': 30, '6M': 180, '12M': 365, '5Y': 1825,
};

async function safeFetch(url: string, headers?: Record<string, string>) {
  try {
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    return null;
  }
}

/** Locale-safe DD/MM/YYYY formatter — no Intl dependency */
function fmtDate(d: Date): string {
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = d.getUTCFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/** Parse BCB DD/MM/YYYY string → Date at noon UTC (avoids TZ drift) */
function parseBCBDate(s: string): Date {
  const [dd, mm, yyyy] = s.split('/');
  return new Date(`${yyyy}-${mm}-${dd}T12:00:00Z`);
}

/**
 * Shared rate normalizer — same function used in market/route.ts, card and chart.
 * Parses a BCB valor string and rounds to 2 decimal places (% a.a.).
 *
 * Both series 432 (Meta SELIC) and 4389 (CDI) return values already in % a.a.
 * (e.g. "14.75", "14.65") — no unit conversion needed.
 */
function parseRate(valor: string): number {
  return Math.round(parseFloat(valor) * 100) / 100;
}

/**
 * Fetch a BCB series for the given window using a DATE-RANGE query.
 *
 * WHY date-range instead of /ultimos/N:
 *   BCB series 432 (SELIC) and 4389 (CDI) are both daily-frequency — they
 *   return one entry per calendar day, repeating the same rate between COPOM
 *   meetings.  Using /ultimos/N with small N (e.g. 16) only covers the last
 *   16 calendar days, giving no baseline for a 12M or 5Y chart.  A date-range
 *   query always returns the full window regardless of series frequency.
 *
 * Steps:
 *   1. Fetch (window + 45 days) to guarantee a baseline point.
 *   2. Round every valor to 2dp — eliminates CDI micro-noise (14.64999 → 14.65).
 *   3. Deduplicate consecutive identical values — keeps only actual rate changes.
 *   4. Build step series: [window-start baseline] + [in-window decisions] + [today].
 */
async function buildRateSeries(
  series: string,
  filter: string,
): Promise<{ date: string; value: number }[] | null> {
  const days = FILTER_DAYS[filter] ?? 365;
  const now = new Date();
  const fetchStart = new Date(now.getTime() - (days + 45) * 86400_000);
  const windowStart = new Date(now.getTime() - days * 86400_000);

  const url =
    `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${series}/dados` +
    `?dataInicial=${fmtDate(fetchStart)}&dataFinal=${fmtDate(now)}&formato=json`;

  console.log(`[historical] fetch series=${series} filter=${filter} url=${url}`);

  const raw = await safeFetch(url);
  if (!raw?.length) {
    console.log(`[historical] series=${series} returned empty — will use fallback`);
    return null;
  }

  // Parse → round to 2dp → sort ascending → deduplicate
  const allPoints = (raw as Array<{ data: string; valor: string }>)
    .map(d => ({ dt: parseBCBDate(d.data), date: d.data, value: parseRate(d.valor) }))
    .sort((a, b) => a.dt.getTime() - b.dt.getTime());

  const decisions = allPoints.filter(
    (p, i) => i === 0 || p.value !== allPoints[i - 1].value,
  );

  // Debug: show raw BCB sample and parsed values so card vs chart can be verified
  const rawSample = (raw as Array<{ data: string; valor: string }>).slice(-3);
  console.log(
    `[historical][${series}] raw BCB sample (last 3):`,
    rawSample.map(d => `${d.data}=${d.valor}`).join(' | '),
  );
  console.log(
    `[historical][${series}] parsed sample (last 3):`,
    allPoints.slice(-3).map(d => `${d.date}=${d.value}%`).join(' | '),
  );
  console.log(
    `[historical][${series}] filter=${filter}:`,
    `${allPoints.length} raw entries → ${decisions.length} distinct rate changes`,
    decisions.length
      ? `| first=${decisions[0].date}:${decisions[0].value}%  last=${decisions[decisions.length - 1].date}:${decisions[decisions.length - 1].value}%`
      : '',
  );
  if (!decisions.length) return null;

  // Last decision at/before window start → opening (baseline) value
  const baseline = [...decisions].reverse().find(d => d.dt <= windowStart);
  const inWindow = decisions.filter(d => d.dt > windowStart);

  const openValue =
    baseline?.value ?? inWindow[0]?.value ?? decisions[decisions.length - 1].value;

  const result: { date: string; value: number }[] = [
    { date: fmtDate(windowStart), value: openValue },
    ...inWindow.map(d => ({ date: d.date, value: d.value })),
  ];

  // Close at today with the last known value
  const closeValue = result[result.length - 1].value;
  const todayStr = fmtDate(now);
  if (result[result.length - 1].date !== todayStr) {
    result.push({ date: todayStr, value: closeValue });
  }

  console.log(
    `[historical][${series}] chart series → opening=${openValue}% | closing=${closeValue}% | points=${result.length}`,
  );

  return result;
}

// ── Fallback data — used ONLY when BCB API is completely unreachable ──
// SELIC: series 4390 (Meta para a taxa over-Selic) — COPOM decision history
const SELIC_DECISIONS = [
  { date: '31/07/2024', value: 10.50 },
  { date: '18/09/2024', value: 10.75 },
  { date: '06/11/2024', value: 11.25 },
  { date: '11/12/2024', value: 12.25 },
  { date: '29/01/2025', value: 13.25 },
  { date: '19/03/2025', value: 14.25 },
  { date: '07/05/2025', value: 14.75 },
  { date: '18/06/2025', value: 15.00 },
  { date: '10/12/2025', value: 14.75 },
];

// CDI: series 4389 — same decision dates, values ≈ SELIC − 0.10 pp
const CDI_DECISIONS = SELIC_DECISIONS.map(d => ({
  ...d,
  value: Math.round((d.value - 0.1) * 100) / 100,
}));

function buildFallback(
  decisions: { date: string; value: number }[],
  filter: string,
): { date: string; value: number }[] {
  const now = new Date();
  const days = FILTER_DAYS[filter] ?? 365;
  const windowStart = new Date(now.getTime() - days * 86400_000);

  const parsed = decisions
    .map(d => ({ ...d, dt: parseBCBDate(d.date) }))
    .sort((a, b) => a.dt.getTime() - b.dt.getTime());

  const baseline = [...parsed].reverse().find(d => d.dt <= windowStart);
  const inWindow = parsed.filter(d => d.dt > windowStart);

  const openValue =
    baseline?.value ?? inWindow[0]?.value ?? decisions[decisions.length - 1]?.value ?? 14.75;

  const result: { date: string; value: number }[] = [
    { date: fmtDate(windowStart), value: openValue },
    ...inWindow.map(d => ({ date: d.date, value: d.value })),
  ];

  const closeValue = result[result.length - 1].value;
  result.push({ date: fmtDate(now), value: closeValue });

  return result;
}

// ── Route handler ──

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const indicator = searchParams.get('indicator') ?? 'SELIC';
  const filter = searchParams.get('filter') ?? '1M';

  // SELIC — BCB series 432 (Meta SELIC / COPOM target, % a.a.)
  if (indicator === 'SELIC') {
    const points = await buildRateSeries('432', filter);
    return NextResponse.json(points ?? buildFallback(SELIC_DECISIONS, filter), {
      headers: { 'Cache-Control': 'public, s-maxage=600' },
    });
  }

  // CDI — BCB series 4389 (CDI Over annualized, % a.a.)
  // Same source as the market card → card value and chart are always consistent.
  if (indicator === 'CDI') {
    const points = await buildRateSeries('4389', filter);
    return NextResponse.json(points ?? buildFallback(CDI_DECISIONS, filter), {
      headers: { 'Cache-Control': 'public, s-maxage=600' },
    });
  }

  // IBOVESPA / USD/BRL — Yahoo Finance
  const symbolMap: Record<string, string> = {
    IBOVESPA: '%5EBVSP',
    'USD/BRL': 'BRL=X',
  };
  const symbol = symbolMap[indicator];

  if (symbol) {
    const data = await safeFetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${INTERVAL_MAP[filter] ?? '1d'}&range=${RANGE_MAP[filter] ?? '1mo'}`,
      { 'User-Agent': 'Mozilla/5.0' },
    );

    const result = data?.chart?.result?.[0];
    const timestamps: number[] = result?.timestamp ?? [];
    const closes: number[] = result?.indicators?.quote?.[0]?.close ?? [];

    if (timestamps.length) {
      const points = timestamps
        .map((ts, i) => ({
          date: new Date(ts * 1000).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            ...(filter === '5Y' ? { year: '2-digit' } : {}),
          }),
          value: Math.round((closes[i] ?? 0) * 100) / 100,
        }))
        .filter(p => p.value > 0);

      return NextResponse.json(points, {
        headers: { 'Cache-Control': 'public, s-maxage=300' },
      });
    }
  }

  return NextResponse.json(generatePriceFallback(indicator));
}

function generatePriceFallback(indicator: string) {
  const n = 30;
  const bases: Record<string, number> = { IBOVESPA: 125000, 'USD/BRL': 5.0 };
  const base = bases[indicator] ?? 100;
  return Array.from({ length: n }, (_, i) => ({
    date: new Date(Date.now() - (n - i) * 86400_000).toLocaleDateString('pt-BR'),
    value: Math.round((base + (Math.random() - 0.5) * base * 0.02) * 100) / 100,
  }));
}
