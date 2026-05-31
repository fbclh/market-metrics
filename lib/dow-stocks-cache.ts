type DowStock = {
  ticker: string;
  name: string;
  market: string;
  locale: string;
  primary_exchange: string;
  type: string;
  active: boolean;
};

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const STALE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

let cache: { results: DowStock[]; expiresAt: number } | null = null;

export function getCachedDowStocks(): DowStock[] | null {
  if (!cache) {
    return null;
  }

  if (cache.expiresAt <= Date.now()) {
    return null;
  }

  return cache.results;
}

export function getStaleDowStocks(): DowStock[] | null {
  if (!cache) {
    return null;
  }

  if (cache.expiresAt + STALE_TTL_MS <= Date.now()) {
    cache = null;
    return null;
  }

  return cache.results;
}

export function setCachedDowStocks(results: DowStock[]): void {
  cache = {
    results,
    expiresAt: Date.now() + CACHE_TTL_MS,
  };
}
