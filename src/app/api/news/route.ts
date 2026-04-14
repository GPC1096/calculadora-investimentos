import { NextResponse } from 'next/server';
import type { NewsItem } from '@/types';

const FEEDS = [
  {
    url: 'https://www.infomoney.com.br/feed/',
    source: 'InfoMoney',
  },
  {
    url: 'https://economia.uol.com.br/rss.xml',
    source: 'UOL Economia',
  },
];

async function fetchFeed(url: string, source: string): Promise<NewsItem[]> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RSS reader)',
        Accept: 'application/rss+xml, application/xml, text/xml',
      },
      signal: AbortSignal.timeout(7000),
      next: { revalidate: 600 },
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();
    return parseRSS(xml, source);
  } catch {
    return [];
  }
}

function extractImage(block: string): string {
  // <enclosure url="..." type="image/..."/>
  const enc1 = /enclosure[^>]+url=["']([^"']+)["'][^>]+type=["']image/i.exec(block);
  if (enc1) return enc1[1];
  const enc2 = /enclosure[^>]+type=["']image[^"']*["'][^>]+url=["']([^"']+)["']/i.exec(block);
  if (enc2) return enc2[1];

  // <media:content url="..."/>
  const mc = /media:content[^>]+url=["']([^"']+)["']/i.exec(block);
  if (mc) return mc[1];

  // <media:thumbnail url="..."/>
  const mt = /media:thumbnail[^>]+url=["']([^"']+)["']/i.exec(block);
  if (mt) return mt[1];

  // <img src="..."> inside description/content
  const img = /<img[^>]+src=["']([^"']+)["']/i.exec(block);
  if (img) return img[1];

  return '';
}

function parseRSS(xml: string, source: string): NewsItem[] {
  const items: NewsItem[] = [];

  // Extract <item> blocks
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/g;
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(xml)) !== null && items.length < 8) {
    const block = match[1];

    const title = extractTag(block, 'title');
    const link = extractTag(block, 'link') || extractAttr(block, 'link', 'href');
    const pubDate = extractTag(block, 'pubDate') || extractTag(block, 'dc:date');
    const description = extractTag(block, 'description');
    const imageUrl = extractImage(block);

    if (!title || !link) continue;

    items.push({
      title: decodeEntities(stripCDATA(title)).trim(),
      link: decodeEntities(stripCDATA(link)).trim(),
      source,
      pubDate: formatPubDate(pubDate),
      description: description
        ? decodeEntities(stripCDATA(stripHTML(description))).slice(0, 160).trim()
        : undefined,
      imageUrl: imageUrl || undefined,
    });
  }

  return items;
}

function extractTag(xml: string, tag: string): string {
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?>(\\s*(?:<\\!\\[CDATA\\[)?[\\s\\S]*?(?:\\]\\]>)?\\s*)<\\/${tag}>`, 'i');
  const m = re.exec(xml);
  return m?.[1]?.trim() ?? '';
}

function extractAttr(xml: string, tag: string, attr: string): string {
  const re = new RegExp(`<${tag}[^>]+${attr}=["']([^"']+)["']`, 'i');
  const m = re.exec(xml);
  return m?.[1] ?? '';
}

function stripCDATA(s: string): string {
  return s.replace(/^\s*<!\[CDATA\[/, '').replace(/\]\]>\s*$/, '').trim();
}

function stripHTML(s: string): string {
  return s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)));
}

function formatPubDate(raw: string): string {
  if (!raw) return '';
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return raw;
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return raw;
  }
}

export async function GET() {
  try {
    const results = await Promise.all(
      FEEDS.map(({ url, source }) => fetchFeed(url, source))
    );

    // Interleave results and take top 10
    const merged: NewsItem[] = [];
    const maxLen = Math.max(...results.map((r) => r.length));
    for (let i = 0; i < maxLen && merged.length < 10; i++) {
      for (const arr of results) {
        if (arr[i]) merged.push(arr[i]);
        if (merged.length >= 10) break;
      }
    }

    if (merged.length === 0) {
      return NextResponse.json(getFallbackNews(), {
        headers: { 'Cache-Control': 'public, s-maxage=600' },
      });
    }

    return NextResponse.json(merged, {
      headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200' },
    });
  } catch {
    return NextResponse.json(getFallbackNews());
  }
}

function getFallbackNews(): NewsItem[] {
  return [
    {
      title: 'Copom mantém Selic em 14,75% ao ano',
      link: 'https://www.infomoney.com.br/',
      source: 'InfoMoney',
      pubDate: new Date().toLocaleDateString('pt-BR'),
      description: 'O Comitê de Política Monetária do Banco Central decidiu manter a taxa básica de juros.',
    },
    {
      title: 'Ibovespa fecha em alta com dados do mercado americano',
      link: 'https://economia.uol.com.br/',
      source: 'UOL Economia',
      pubDate: new Date().toLocaleDateString('pt-BR'),
      description: 'O principal índice da bolsa brasileira encerrou o pregão em alta.',
    },
    {
      title: 'Dólar recua frente ao real com melhora do cenário externo',
      link: 'https://www.infomoney.com.br/',
      source: 'InfoMoney',
      pubDate: new Date().toLocaleDateString('pt-BR'),
      description: 'A moeda americana cedeu terreno em relação ao real nesta sessão.',
    },
  ];
}
