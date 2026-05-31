import {
  API_RATE_LIMIT_MESSAGE,
  getApiErrorMessage,
  isRateLimitPayload,
  isRateLimitStatus,
} from '@/lib/api-errors';

export type StockResult = {
  ticker: string;
  name: string;
  market: string;
  locale: string;
  primary_exchange: string;
  type: string;
  active: boolean;
  logo_url?: string;
  description?: string;
};

export type SearchStocksParams = {
  query?: string;
  cursor?: string;
};

export type SearchStocksResponse = {
  results: StockResult[];
  total: number;
  nextCursor?: string;
};

type MassiveTicker = {
  ticker: string;
  name: string;
  market: string;
  locale: string;
  primary_exchange: string;
  type: string;
  active: boolean;
  logo_url?: string | null;
  branding?: {
    logo_url?: string;
    icon_url?: string;
  };
};

type MassiveTickersResponse = {
  results?: MassiveTicker[];
  count?: number;
  next_url?: string;
  status?: string;
  message?: string;
  error?: string;
};

function parseCursor(nextUrl?: string): string | undefined {
  if (!nextUrl) {
    return undefined;
  }

  try {
    return new URL(nextUrl).searchParams.get('cursor') ?? undefined;
  } catch {
    return undefined;
  }
}

function mapTicker(ticker: MassiveTicker): StockResult {
  const logoUrl = ticker.logo_url?.trim() || undefined;

  return {
    ticker: ticker.ticker,
    name: ticker.name,
    market: ticker.market,
    locale: ticker.locale,
    primary_exchange: ticker.primary_exchange,
    type: ticker.type,
    active: ticker.active,
    logo_url: logoUrl,
  };
}

export async function searchStocks({
  query,
  cursor,
}: SearchStocksParams = {}): Promise<SearchStocksResponse> {
  const params = new URLSearchParams();

  if (query?.trim()) {
    params.set('search', query.trim());
  }

  if (cursor) {
    params.set('cursor', cursor);
  }

  const queryString = params.toString();
  const response = await fetch(
    queryString ? `/api/stocks?${queryString}` : '/api/stocks',
    { cache: 'no-store' },
  );

  let data: MassiveTickersResponse;
  try {
    data = (await response.json()) as MassiveTickersResponse;
  } catch {
    throw new Error(
      isRateLimitStatus(response.status)
        ? API_RATE_LIMIT_MESSAGE
        : getApiErrorMessage(response.status, null, 'Failed to load stocks.'),
    );
  }

  if (isRateLimitStatus(response.status) || isRateLimitPayload(data)) {
    throw new Error(API_RATE_LIMIT_MESSAGE);
  }

  if (!response.ok) {
    throw new Error(
      getApiErrorMessage(response.status, data, 'Failed to load stocks.'),
    );
  }

  if (data.status === 'ERROR' && !(data.results?.length ?? 0)) {
    throw new Error(
      getApiErrorMessage(response.status, data, 'Failed to load stocks.'),
    );
  }

  return {
    results: (data.results ?? []).map(mapTicker),
    total: data.count ?? data.results?.length ?? 0,
    nextCursor: parseCursor(data.next_url),
  };
}
