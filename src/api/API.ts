import {
  API_RATE_LIMIT_MESSAGE,
  getApiErrorMessage,
  isRateLimitPayload,
  isRateLimitStatus,
} from '@/lib/api-errors';

export type StockResult = {
  ticker: string;
  name: string;
  sector: string | null;
  exchange: string;
  logo_url: string;
  marketCap?: number;
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

type StocksApiResponse = {
  results?: StockResult[];
  total?: number;
  status?: string;
  message?: string;
  error?: string;
};

export async function searchStocks({
  query,
}: SearchStocksParams = {}): Promise<SearchStocksResponse> {
  const params = new URLSearchParams();

  if (query?.trim()) {
    params.set('search', query.trim());
  }

  const queryString = params.toString();
  const response = await fetch(
    queryString ? `/api/stocks?${queryString}` : '/api/stocks',
    { cache: 'no-store' },
  );

  let data: StocksApiResponse;
  try {
    data = (await response.json()) as StocksApiResponse;
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

  const results = data.results ?? [];

  return {
    results,
    total: data.total ?? results.length,
  };
}
