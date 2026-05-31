'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getSessionId } from '@/lib/session';
import { getApiErrorMessage } from '@/lib/api-errors';
import { SubpageHeader } from '@/src/components/layout/SubpageHeader';
import {
  WATCHLIST_STATUS_LABELS,
  WATCHLIST_TABS,
  type WatchlistStatus,
} from '@/types/watchlist';

type PreviousClose = {
  c?: number;
};

type StockDetail = {
  ticker?: string;
  name?: string;
  market?: string;
  locale?: string;
  primary_exchange?: string;
  type?: string;
  description?: string;
  market_cap?: number;
  sic_description?: string;
  logo_url?: string | null;
  branding?: {
    logo_url?: string;
    icon_url?: string;
  };
  previousClose?: PreviousClose | null;
};

function getInitials(ticker: string): string {
  return ticker.slice(0, 2).toUpperCase();
}

function formatExchange(exchange: string): string {
  if (exchange === 'XNAS') return 'NASDAQ';
  if (exchange === 'XNYS') return 'NYSE';
  return exchange;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatMarketCap(value: number): string {
  if (value >= 1e12) {
    return `$${(value / 1e12).toFixed(1)}T`;
  }

  if (value >= 1e9) {
    return `$${(value / 1e9).toFixed(0)}B`;
  }

  if (value >= 1e6) {
    return `$${(value / 1e6).toFixed(0)}M`;
  }

  return formatCurrency(value);
}

export default function StockDetailPage({
  params,
}: {
  params: { ticker: string };
}) {
  const ticker = params.ticker.toUpperCase();
  const [stock, setStock] = useState<StockDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedStatus, setSavedStatus] = useState<WatchlistStatus | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [savingWatchlist, setSavingWatchlist] = useState(false);
  const [watchlistError, setWatchlistError] = useState<string | null>(null);
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadStock() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/stocks/${encodeURIComponent(ticker)}`,
        );

        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(
            getApiErrorMessage(
              response.status,
              payload,
              `Failed to load ${ticker}.`,
            ),
          );
        }

        const data = (await response.json()) as StockDetail;

        if (!cancelled) {
          setStock(data);
        }
      } catch (err) {
        if (!cancelled) {
          setStock(null);
          setError(
            err instanceof Error ? err.message : `Failed to load ${ticker}.`,
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadStock();

    return () => {
      cancelled = true;
    };
  }, [ticker]);

  useEffect(() => {
    setLogoFailed(false);
  }, [ticker]);

  useEffect(() => {
    if (!stock?.ticker || !stock.name) {
      return;
    }

    fetch('/api/telemetry/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ticker: stock.ticker,
        company_name: stock.name,
        session_id: getSessionId(),
      }),
    }).catch(() => {});
  }, [stock?.ticker, stock?.name]);

  useEffect(() => {
    let cancelled = false;

    async function loadSavedStatus() {
      try {
        const sessionId = getSessionId();
        const response = await fetch(
          `/api/watchlist?session_id=${encodeURIComponent(sessionId)}`,
        );
        const payload = await response.json();

        if (!response.ok || !payload.ok || cancelled) {
          return;
        }

        const match = (payload.data ?? []).find(
          (item: { ticker?: string; status?: WatchlistStatus }) =>
            item.ticker?.toUpperCase() === ticker,
        );

        if (match?.status && !cancelled) {
          setSavedStatus(match.status);
        }
      } catch {
        // Ignore watchlist preload errors on detail page.
      }
    }

    loadSavedStatus();

    return () => {
      cancelled = true;
    };
  }, [ticker]);

  const handleSaveToWatchlist = async (status: WatchlistStatus) => {
    if (!stock?.ticker || !stock.name) {
      return;
    }

    setDropdownOpen(false);

    const sessionId = getSessionId();
    const logoUrl = `/api/stocks/${encodeURIComponent(stock.ticker ?? ticker)}/logo`;

    setSavingWatchlist(true);
    setWatchlistError(null);

    try {
      const response = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker: stock.ticker,
          company_name: stock.name,
          logo_url: logoUrl,
          sector: stock.sic_description ?? null,
          status,
          session_id: sessionId,
        }),
      });

      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? 'Failed to save to watchlist.');
      }

      setSavedStatus(status);
    } catch (err) {
      console.error('Watchlist save failed:', err);
      setWatchlistError(
        err instanceof Error ? err.message : 'Failed to save to watchlist.',
      );
    } finally {
      setSavingWatchlist(false);
    }
  };

  const logoSrc = `/api/stocks/${encodeURIComponent(ticker)}/logo`;
  const previousClose = stock?.previousClose?.c;

  return (
    <>
      <SubpageHeader />
      <div className="min-h-screen bg-[var(--page-bg)] text-[var(--text-primary)]">
        <div className="mx-auto max-w-3xl px-4 py-8">
        <Link
          href="/"
          className="mb-6 inline-block text-sm font-semibold text-[var(--brand-accent-light)] transition hover:text-white"
        >
          ← Back to stocks
        </Link>

        {loading && (
          <p className="text-sm text-[var(--text-secondary)]">Loading {ticker}…</p>
        )}

        {error && (
          <p className="text-sm text-[var(--error)]" role="alert">
            {error}
          </p>
        )}

        {!loading && !error && stock && (
          <article className="rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)]">
            <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-start">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-navy-hover)]">
                {!logoFailed ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoSrc}
                    alt={`${stock.name} logo`}
                    className="h-16 w-16 object-contain"
                    onError={() => setLogoFailed(true)}
                  />
                ) : (
                  <span className="text-lg font-bold text-white">
                    {getInitials(stock.ticker ?? ticker)}
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
                  {stock.ticker ?? ticker}
                </p>
                <h1 className="mt-1 text-xl text-[var(--text-secondary)]">{stock.name}</h1>

                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="font-semibold text-[var(--text-muted)]">Sector</dt>
                    <dd className="text-[var(--text-primary)]">—</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-[var(--text-muted)]">Industry</dt>
                    <dd className="text-[var(--text-primary)]">
                      {stock.sic_description ?? '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-[var(--text-muted)]">
                      Previous close
                    </dt>
                    <dd className="text-[var(--text-primary)]">
                      {typeof previousClose === 'number'
                        ? formatCurrency(previousClose)
                        : '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-[var(--text-muted)]">Market cap</dt>
                    <dd className="text-[var(--text-primary)]">
                      {typeof stock.market_cap === 'number'
                        ? formatMarketCap(stock.market_cap)
                        : '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-[var(--text-muted)]">Exchange</dt>
                    <dd className="text-[var(--text-primary)]">
                      {stock.primary_exchange
                        ? formatExchange(stock.primary_exchange)
                        : '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-[var(--text-muted)]">Market type</dt>
                    <dd className="capitalize text-[var(--text-primary)]">
                      {stock.market ?? '—'}
                      {stock.type ? ` · ${stock.type}` : ''}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {stock.description && (
              <div className="border-t border-[var(--border-subtle)] px-6 py-5">
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  About
                </h2>
                <p className="text-sm leading-7 text-[var(--text-secondary)]">
                  {stock.description}
                </p>
              </div>
            )}

            <div className="border-t border-[var(--border-subtle)] px-6 py-5">
              {watchlistError && (
                <p className="mb-3 text-sm text-[var(--error)]" role="alert">
                  {watchlistError}
                </p>
              )}
              <div>
                <button
                  type="button"
                  disabled={savingWatchlist}
                  onClick={() => setDropdownOpen((open) => !open)}
                  className="rounded-md bg-[var(--brand-blue)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--brand-blue-hover)] disabled:opacity-60"
                >
                  {savingWatchlist
                    ? 'Saving…'
                    : savedStatus
                      ? `${WATCHLIST_STATUS_LABELS[savedStatus]} ✓`
                      : 'Save'}
                </button>

                {dropdownOpen && !savingWatchlist && (
                  <div className="mt-2 w-fit overflow-hidden rounded-md border border-[var(--border)] bg-[var(--surface-raised)] shadow-[var(--shadow)]">
                    {WATCHLIST_TABS.map((tab) => (
                      <button
                        key={tab.status}
                        type="button"
                        onClick={() => {
                          void handleSaveToWatchlist(tab.status);
                        }}
                        className="block w-full min-w-[180px] px-4 py-2 text-left text-sm text-[var(--text-secondary)] transition hover:bg-[var(--surface-hover)]"
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </article>
        )}
        </div>
      </div>
    </>
  );
}
