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

type StockCard = StockResult & {
  company_name?: string;
  exchange?: string;
};

function getInitials(ticker: string): string {
  return ticker.slice(0, 2).toUpperCase();
}

function getCompanyName(stock: StockCard): string {
  if (typeof stock.name === 'string' && stock.name.trim()) {
    return stock.name.trim();
  }

  if (typeof stock.company_name === 'string' && stock.company_name.trim()) {
    return stock.company_name.trim();
  }

  return stock.ticker;
}

function getExchangeCode(stock: StockCard): string | undefined {
  const exchange =
    stock.primary_exchange?.trim() || stock.exchange?.trim() || '';

  return exchange || undefined;
}

function formatExchange(exchange: string): string {
  if (exchange === 'XNAS') return 'NASDAQ';
  if (exchange === 'XNYS') return 'NYSE';
  if (exchange === 'ARCX') return 'NYSE Arca';
  if (exchange === 'BATS') return 'CBOE BZX';

  return exchange;
}

function StockLogo({ stock }: { stock: StockCard }) {
  const [imageFailed, setImageFailed] = useState(false);
  const logoSrc = `/api/stocks/${encodeURIComponent(stock.ticker)}/logo`;

  useEffect(() => {
    setImageFailed(false);
  }, [stock.ticker]);

  if (imageFailed) {
    return (
      <div className={styles.placeholder}>{getInitials(stock.ticker)}</div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={styles.logo}
      src={logoSrc}
      alt={`${getCompanyName(stock)} logo`}
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
            const companyName = getCompanyName(stock);
            const exchangeCode = getExchangeCode(stock);
            const exchangeLabel = exchangeCode
              ? formatExchange(exchangeCode)
              : null;

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
                    <p className={styles.name}>{companyName}</p>
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
