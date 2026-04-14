import { NextResponse } from 'next/server';

async function safeFetch(url: string, options?: RequestInit) {
  try {
    const res = await fetch(url, { ...options, signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Parse BCB valor string → % a.a. rounded to 2dp.
 * Both series 432 (Meta SELIC) and 4389 (CDI) return values already in % a.a.
 * (e.g. "14.75", "14.65") — no unit conversion needed.
 */
function parseRate(valor: string): number {
  return Math.round(parseFloat(valor) * 100) / 100;
}

export async function GET() {
  try {
    const [selicData, cdiData, ibovData, usdData] = await Promise.all([
      // Series 432 = Taxa de juros - Selic (Meta SELIC / COPOM target) — % a.a.
      safeFetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/2?formato=json'),
      // Series 4389 = CDI Over (annualized overnight) — % a.a.
      safeFetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.4389/dados/ultimos/5?formato=json'),
      safeFetch('https://query1.finance.yahoo.com/v8/finance/chart/%5EBVSP?interval=1d&range=5d', {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      }),
      safeFetch('https://query1.finance.yahoo.com/v8/finance/chart/BRL=X?interval=1d&range=5d', {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      }),
    ]);

    // ── SELIC — series 432 (Meta SELIC / COPOM target), % a.a. ──
    let selic = 14.75;
    let selicPrev = 15.00;
    if (selicData?.length >= 1) {
      selic = parseRate(selicData[selicData.length - 1].valor);
      selicPrev = selicData.length >= 2 ? parseRate(selicData[selicData.length - 2].valor) : selic;
    }
    console.log('[market][SELIC] raw BCB valor =', selicData?.[selicData?.length - 1]?.valor, '| card display =', selic, '% a.a.');
    const selicChanged = selic !== selicPrev;
    const selicVariation = Math.round((selic - selicPrev) * 100) / 100;

    // ── CDI — series 4389, % a.a. ──
    // Take the last daily entry as current; compare with entry 2 days prior to detect changes.
    let cdi = 14.65;
    let cdiVariation = 0;
    let cdiChanged = false;
    if (cdiData?.length >= 1) {
      cdi = parseRate(cdiData[cdiData.length - 1].valor);
      const prevCdi = cdiData.length >= 2 ? parseRate(cdiData[0].valor) : cdi;
      cdiVariation = Math.round((cdi - prevCdi) * 100) / 100;
      cdiChanged = Math.abs(cdiVariation) >= 0.01;
    }
    console.log('[market][CDI]  raw BCB valor =', cdiData?.[cdiData?.length - 1]?.valor, '| card display =', cdi, '% a.a.');

    // ── IBOVESPA ──
    let ibov = 128000;
    let ibovVar = 0;
    const ibovResult = ibovData?.chart?.result?.[0];
    if (ibovResult) {
      const closes = ibovResult.indicators?.quote?.[0]?.close ?? [];
      const valid = (closes as (number | null)[]).filter((v): v is number => v != null && v > 0);
      if (valid.length >= 2) {
        ibov = Math.round(valid[valid.length - 1]);
        ibovVar = Math.round(((valid[valid.length - 1] - valid[valid.length - 2]) / valid[valid.length - 2]) * 10000) / 100;
      } else if (ibovResult.meta) {
        const m = ibovResult.meta;
        ibov = Math.round(m.regularMarketPrice ?? m.previousClose);
        const prev = m.chartPreviousClose ?? m.previousClose ?? ibov;
        ibovVar = prev > 0 ? Math.round(((ibov - prev) / prev) * 10000) / 100 : 0;
      }
    }

    // ── USD/BRL ──
    let usd = 5.05;
    let usdVar = 0;
    const usdResult = usdData?.chart?.result?.[0];
    if (usdResult) {
      const closes = usdResult.indicators?.quote?.[0]?.close ?? [];
      const valid = (closes as (number | null)[]).filter((v): v is number => v != null && v > 0);
      if (valid.length >= 2) {
        usd = Math.round(valid[valid.length - 1] * 10000) / 10000;
        usdVar = Math.round(((valid[valid.length - 1] - valid[valid.length - 2]) / valid[valid.length - 2]) * 10000) / 100;
      } else if (usdResult.meta) {
        const m = usdResult.meta;
        usd = Math.round((m.regularMarketPrice ?? m.previousClose) * 10000) / 10000;
        const prev = m.chartPreviousClose ?? m.previousClose ?? usd;
        usdVar = prev > 0 ? Math.round(((usd - prev) / prev) * 10000) / 100 : 0;
      }
    }

    return NextResponse.json(
      {
        selic,
        cdi,
        ibovespa: ibov,
        usdBrl: Math.round(usd * 100) / 100,
        selicVariation,
        cdiVariation,
        ibovespaVariation: ibovVar,
        usdBrlVariation: usdVar,
        selicChanged,
        cdiChanged,
        lastUpdated: new Date().toISOString(),
      },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } },
    );
  } catch {
    return NextResponse.json({
      selic: 14.75,
      cdi: 14.65,
      ibovespa: 128000,
      usdBrl: 5.05,
      selicVariation: 0,
      cdiVariation: 0,
      ibovespaVariation: -0.3,
      usdBrlVariation: 0.2,
      selicChanged: false,
      cdiChanged: false,
      lastUpdated: new Date().toISOString(),
      fallback: true,
    });
  }
}
