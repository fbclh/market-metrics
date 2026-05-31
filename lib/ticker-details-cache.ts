type TickerDetails = Record<string, unknown> & {
  ticker: string;
  name: string;
  branding?: {
    logo_url?: string;
    icon_url?: string;
  };
};

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const cache = new Map<string, { data: TickerDetails; expiresAt: number }>();

export function getCachedTickerDetails(
  ticker: string,
): TickerDetails | null {
  const key = ticker.toUpperCase();
  const cached = cache.get(key);

  if (!cached) {
    return null;
  }

  if (cached.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }

  return cached.data;
}

export function setCachedTickerDetails(
  ticker: string,
  data: TickerDetails,
): void {
  cache.set(ticker.toUpperCase(), {
    data,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}
