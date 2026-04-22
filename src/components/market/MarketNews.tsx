'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useSWR from 'swr';
import type { NewsItem } from '@/types';

async function fetchNews(): Promise<NewsItem[]> {
  const res = await fetch('/api/news');
  if (!res.ok) throw new Error('Failed to fetch news');
  return res.json();
}

function NewsItemRow({ item, index }: { item: NewsItem; index: number }) {
  return (
    <motion.a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      className="flex gap-3 p-4 rounded-xl group no-underline"
      style={{
        background: 'var(--surface-2)',
        border: '1px solid var(--border)',
        textDecoration: 'none',
      }}
      whileHover={{ x: 3 }}
    >
      {/* Index number */}
      <div
        className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-700 mt-0.5"
        style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
      >
        {index + 1}
      </div>

      {/* Thumbnail */}
      {item.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.imageUrl}
          alt=""
          onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          className="shrink-0 rounded-lg object-cover mt-0.5"
          style={{ width: 56, height: 56 }}
        />
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-600 leading-snug transition-colors duration-150"
          style={{ color: 'var(--text-primary)' }}
        >
          {item.title}
        </p>
        {item.description && (
          <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-muted)' }}>
            {item.description}
          </p>
        )}
        <div className="flex items-center gap-2 mt-2">
          <span
            className="text-xs font-600 px-2 py-0.5 rounded-md"
            style={{ background: 'var(--surface-3)', color: 'var(--text-secondary)' }}
          >
            {item.source}
          </span>
         {item.pubDate && (
  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
    {(() => {
      const data = new Date(item.pubDate)
      return isNaN(data)
        ? item.pubDate
        : data.toLocaleString('pt-BR', {
            timeZone: 'America/Sao_Paulo'
          })
    })()}
  </span>
)}
            </span>
          )}
        </div>
      </div>

      {/* Arrow */}
      <div
        className="shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
        style={{ color: 'var(--accent)' }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M2 7h10M7 2l5 5-5 5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </motion.a>
  );
}

function SkeletonRow() {
  return (
    <div
      className="flex gap-3 p-4 rounded-xl animate-pulse"
      style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
    >
      <div className="w-7 h-7 rounded-lg shrink-0" style={{ background: 'var(--border)' }} />
      <div className="w-14 h-14 rounded-lg shrink-0" style={{ background: 'var(--border)' }} />
      <div className="flex-1 space-y-2 pt-0.5">
        <div className="h-4 rounded-md w-4/5" style={{ background: 'var(--border)' }} />
        <div className="h-3 rounded-md w-3/5" style={{ background: 'var(--border)' }} />
        <div className="h-3 rounded-md w-1/4" style={{ background: 'var(--border)' }} />
      </div>
    </div>
  );
}

export function MarketNews() {
  const [open, setOpen] = useState(false);
  const { data, isLoading, error } = useSWR<NewsItem[]>(
    open ? 'market-news' : null,
    fetchNews,
    { revalidateOnFocus: false, dedupingInterval: 10 * 60 * 1000 }
  );

  return (
    <div>
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 rounded-xl transition-all duration-200"
        style={{
          background: 'var(--surface-2)',
          border: `1.5px solid ${open ? 'var(--accent)' : 'var(--border)'}`,
          color: 'var(--text-primary)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: open ? 'var(--accent)' : 'var(--surface-3)' }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              stroke={open ? 'white' : 'var(--text-muted)'}
              strokeWidth="1.5"
            >
              <rect x="1" y="2" width="12" height="10" rx="2" />
              <path d="M4 5h6M4 7.5h6M4 10h3" strokeLinecap="round" />
            </svg>
          </div>
          <div className="text-left">
            <span className="text-sm font-600">Notícias do mercado</span>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              InfoMoney · UOL Economia
            </p>
          </div>
        </div>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="var(--text-muted)"
            strokeWidth="1.5"
          >
            <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div className="mt-3 glass-card p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-display text-base font-700" style={{ color: 'var(--text-primary)' }}>
                  Últimas notícias
                </h4>
                {data && (
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {data.length} artigos
                  </p>
                )}
              </div>

              <div className="space-y-2">
                {isLoading && Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}

                {error && (
                  <div
                    className="p-4 rounded-xl text-sm text-center"
                    style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}
                  >
                    Não foi possível carregar as notícias no momento.
                  </div>
                )}

                {data?.map((item, i) => (
                  <NewsItemRow key={`${item.link}-${i}`} item={item} index={i} />
                ))}
              </div>

              {data && data.length > 0 && (
                <div className="flex gap-3 mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                  <a
                    href="https://www.infomoney.com.br/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center py-2 px-3 rounded-lg text-xs font-600 transition-colors duration-150"
                    style={{
                      background: 'var(--surface-3)',
                      color: 'var(--text-secondary)',
                      textDecoration: 'none',
                    }}
                  >
                    InfoMoney →
                  </a>
                  <a
                    href="https://economia.uol.com.br/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center py-2 px-3 rounded-lg text-xs font-600 transition-colors duration-150"
                    style={{
                      background: 'var(--surface-3)',
                      color: 'var(--text-secondary)',
                      textDecoration: 'none',
                    }}
                  >
                    UOL Economia →
                  </a>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
