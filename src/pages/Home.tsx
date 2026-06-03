'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSessionId } from '@/lib/session';
import { resolveStockLoadError } from '@/lib/api-errors';
import { searchStocks, type StockResult } from '../api/API';
import { Stocks } from '../components/Stocks';
import { HomeHeader } from '../components/layout/HomeHeader';
import styles from '../styles/Home.module.css';

export const Home = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchFromUrl = searchParams?.get('search')?.trim() ?? '';

  const [stocks, setStocks] = useState<StockResult[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStocks = useCallback(
    async (query: string, cursor?: string, append = false) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        const response = await searchStocks({
          query: query || undefined,
          cursor,
        });

        setStocks((current) =>
          append ? [...current, ...response.results] : response.results,
        );
        setNextCursor(response.nextCursor);
        setError(null);

        if (!append && query.trim() && response.results.length > 0) {
          fetch('/api/telemetry/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query: query.trim(),
              session_id: getSessionId(),
            }),
          }).catch(() => {});
        }

        if (!append) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } catch (err) {
        if (!append) {
          setStocks([]);
          setNextCursor(undefined);
        }

        setError(resolveStockLoadError(err));
      } finally {
        if (append) {
          setLoadingMore(false);
        } else {
          setLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    loadStocks(activeSearch);
  }, [activeSearch, loadStocks]);

  useEffect(() => {
    setInputValue(searchFromUrl);
    setActiveSearch(searchFromUrl);
  }, [searchFromUrl]);

  const handleSearchSubmit = (query: string) => {
    const trimmed = query.trim();
    if (trimmed) {
      router.replace(`/?search=${encodeURIComponent(trimmed)}`);
      return;
    }

    router.replace('/');
  };

  const handleLogoClick = () => {
    setInputValue('');
    setActiveSearch('');
    router.replace('/');
  };

  const handleLoadMore = () => {
    if (!nextCursor || loadingMore) {
      return;
    }

    loadStocks(activeSearch, nextCursor, true);
  };

  return (
    <>
      <HomeHeader
        searchValue={inputValue}
        onSearchChange={setInputValue}
        onSearchSubmit={handleSearchSubmit}
        onLogoClick={handleLogoClick}
      />
      <div className={styles.layout}>
        {loading && stocks.length === 0 && (
          <p className="status">
            {activeSearch
              ? `Searching for “${activeSearch}”…`
              : 'Loading stocks…'}
          </p>
        )}
        {error && (
          <p
            className={`status status--error ${styles.message}`}
            role="alert"
          >
            {error}
          </p>
        )}
        {!loading && !error && stocks.length === 0 && (
          <p className={`status ${styles.message}`}>
            {activeSearch
              ? `No stocks found for “${activeSearch}”.`
              : 'No stocks found.'}
          </p>
        )}
        {!error && stocks.length > 0 && (
          <Stocks
            stocks={stocks}
            hasMore={Boolean(nextCursor)}
            loadingMore={loadingMore}
            onLoadMore={handleLoadMore}
          />
        )}
      </div>
    </>
  );
};

export default Home;
