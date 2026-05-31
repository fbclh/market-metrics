type LogoCacheHit = {
  kind: 'hit';
  buffer: ArrayBuffer;
  contentType: string;
};

type LogoCacheMiss = {
  kind: 'miss';
  status: number;
};

type LogoCacheEntry = LogoCacheHit | LogoCacheMiss;

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const MISS_TTL_MS = 60 * 60 * 1000;

const cache = new Map<string, { entry: LogoCacheEntry; expiresAt: number }>();

export function getCachedLogo(ticker: string): LogoCacheEntry | null {
  const cached = cache.get(ticker);
  if (!cached) {
    return null;
  }

  if (cached.expiresAt <= Date.now()) {
    cache.delete(ticker);
    return null;
  }

  return cached.entry;
}

export function setCachedLogo(ticker: string, entry: LogoCacheEntry): void {
  const ttl = entry.kind === 'hit' ? CACHE_TTL_MS : MISS_TTL_MS;
  cache.set(ticker, { entry, expiresAt: Date.now() + ttl });
}
