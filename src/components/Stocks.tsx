'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { StockResult } from '../api/API';
import styles from '../styles/Stocks.module.css';

interface StocksProps {
  stocks: StockResult[];
  loadingMore?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

function getInitials(ticker: string): string {
  return ticker.slice(0, 2).toUpperCase();
}

function StockLogo({ stock }: { stock: StockResult }) {
  const [imageFailed, setImageFailed] = useState(false);
  const logoSrc = stock.logo_url;

  useEffect(() => {
    setImageFailed(false);
  }, [stock.ticker, stock.logo_url]);

  if (imageFailed || !logoSrc) {
    return (
      <div className={styles.placeholder}>{getInitials(stock.ticker)}</div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={styles.logo}
      src={logoSrc}
      alt={`${stock.name} logo`}
      onError={() => {
        setImageFailed(true);
      }}
    />
  );
}

export function Stocks({
  stocks,
  loadingMore = false,
  hasMore = false,
  onLoadMore,
}: StocksProps) {
  if (stocks.length === 0) {
    return null;
  }

  return (
    <section className={styles.section}>
      <div className="w-full max-w-[calc(190px*5+1.25rem*4)]">
        <ul className={styles.ul}>
          {stocks.map((stock) => {
            const exchangeLabel = stock.exchange?.trim() || null;

            return (
              <li className={styles.li} key={stock.ticker}>
                <Link
                  href={`/stocks/${encodeURIComponent(stock.ticker)}`}
                  className={styles.cardLink}
                >
                  <div className={styles.media}>
                    <StockLogo stock={stock} />
                  </div>
                  <div className={styles.caption}>
                    <p className={styles.ticker}>{stock.ticker}</p>
                    <p className={styles.name}>{stock.name}</p>
                    {exchangeLabel && (
                      <span className={styles.exchange}>{exchangeLabel}</span>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>

        {hasMore && onLoadMore && (
          <div className={styles.loadMoreWrap}>
            <button
              type="button"
              className={styles.loadMore}
              onClick={onLoadMore}
              disabled={loadingMore}
            >
              {loadingMore ? 'Loading…' : 'Load More'}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
