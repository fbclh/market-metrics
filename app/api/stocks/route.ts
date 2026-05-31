import { NextRequest, NextResponse } from 'next/server';
import {
  getCachedTickerDetails,
  setCachedTickerDetails,
} from '@/lib/ticker-details-cache';
import {
  isRateLimitPayload,
  isRateLimitStatus,
  rateLimitJsonResponse,
} from '@/lib/api-errors';

const DOW_TICKERS = [
  'AAPL',
  'MSFT',
  'JPM',
  'V',
  'JNJ',
  'WMT',
  'PG',
  'UNH',
  'HD',
  'CVX',
  'MRK',
  'AMZN',
  'CAT',
  'BA',
  'GS',
  'MCD',
  'DIS',
  'AXP',
  'IBM',
  'TRV',
  'MMM',
  'NKE',
  'HON',
  'CRM',
  'INTC',
  'VZ',
  'KO',
  'DOW',
  'WBA',
  'CSCO',
];

type TickerResult = {
  ticker: string;
  name: string;
  market: string;
  locale: string;
  primary_exchange: string;
  type: string;
  active: boolean;
};

const DOW_STOCK_METADATA: Record<
  string,
  Pick<TickerResult, 'name' | 'primary_exchange'>
> = {
  AAPL: { name: 'Apple Inc.', primary_exchange: 'XNAS' },
  MSFT: { name: 'Microsoft Corp', primary_exchange: 'XNAS' },
  JPM: { name: 'JPMorgan Chase & Co.', primary_exchange: 'XNYS' },
  V: { name: 'Visa Inc.', primary_exchange: 'XNYS' },
  JNJ: { name: 'Johnson & Johnson', primary_exchange: 'XNYS' },
  WMT: { name: 'Walmart Inc.', primary_exchange: 'XNYS' },
  PG: { name: 'Procter & Gamble Co.', primary_exchange: 'XNYS' },
  UNH: { name: 'UnitedHealth Group Inc.', primary_exchange: 'XNYS' },
  HD: { name: 'Home Depot Inc.', primary_exchange: 'XNYS' },
  CVX: { name: 'Chevron Corp', primary_exchange: 'XNYS' },
  MRK: { name: 'Merck & Co. Inc.', primary_exchange: 'XNYS' },
  AMZN: { name: 'Amazon.com Inc.', primary_exchange: 'XNAS' },
  CAT: { name: 'Caterpillar Inc.', primary_exchange: 'XNYS' },
  BA: { name: 'Boeing Co.', primary_exchange: 'XNYS' },
  GS: { name: 'Goldman Sachs Group Inc.', primary_exchange: 'XNYS' },
  MCD: { name: "McDonald's Corp", primary_exchange: 'XNYS' },
  DIS: { name: 'Walt Disney Co.', primary_exchange: 'XNYS' },
  AXP: { name: 'American Express Co.', primary_exchange: 'XNYS' },
  IBM: { name: 'International Business Machines Corp', primary_exchange: 'XNYS' },
  TRV: { name: 'Travelers Companies Inc.', primary_exchange: 'XNYS' },
  MMM: { name: '3M Co.', primary_exchange: 'XNYS' },
  NKE: { name: 'NIKE Inc.', primary_exchange: 'XNYS' },
  HON: { name: 'Honeywell International Inc.', primary_exchange: 'XNAS' },
  CRM: { name: 'Salesforce Inc.', primary_exchange: 'XNYS' },
  INTC: { name: 'Intel Corp', primary_exchange: 'XNAS' },
  VZ: { name: 'Verizon Communications Inc.', primary_exchange: 'XNYS' },
  KO: { name: 'Coca-Cola Co.', primary_exchange: 'XNYS' },
  DOW: { name: 'Dow Inc.', primary_exchange: 'XNYS' },
  WBA: { name: 'Walgreens Boots Alliance Inc.', primary_exchange: 'XNAS' },
  CSCO: { name: 'Cisco Systems Inc.', primary_exchange: 'XNAS' },
};

const MAX_FETCHES_PER_REQUEST = 4;

function dowStockFallback(symbol: string): TickerResult {
  const meta = DOW_STOCK_METADATA[symbol];

  return {
    ticker: symbol,
    name: meta?.name ?? symbol,
    market: 'stocks',
    locale: 'us',
    primary_exchange: meta?.primary_exchange ?? '',
    type: 'CS',
    active: true,
  };
}

function normalizeTickerResult(
  details: Record<string, unknown>,
): TickerResult {
  const ticker =
    typeof details.ticker === 'string' ? details.ticker.toUpperCase() : '';
  const fallback = DOW_STOCK_METADATA[ticker];
  const name =
    typeof details.name === 'string' && details.name.trim()
      ? details.name.trim()
      : (fallback?.name ?? ticker);

  return {
    ticker,
    name,
    market: typeof details.market === 'string' ? details.market : 'stocks',
    locale: typeof details.locale === 'string' ? details.locale : 'us',
    primary_exchange:
      typeof details.primary_exchange === 'string' &&
      details.primary_exchange.trim()
        ? details.primary_exchange
        : (fallback?.primary_exchange ?? ''),
    type: typeof details.type === 'string' ? details.type : 'CS',
    active: typeof details.active === 'boolean' ? details.active : true,
  };
}

function buildDowResults(): TickerResult[] {
  return DOW_TICKERS.map((symbol) => {
    const cached = getCachedTickerDetails(symbol);
    return cached
      ? normalizeTickerResult(cached as Record<string, unknown>)
      : dowStockFallback(symbol);
  });
}

function allDowTickersCached(): boolean {
  return DOW_TICKERS.every((symbol) => getCachedTickerDetails(symbol) !== null);
}

async function fetchMissingDowTickers(apiKey: string): Promise<boolean> {
  let fetchCount = 0;
  let rateLimited = false;

  for (const symbol of DOW_TICKERS) {
    if (getCachedTickerDetails(symbol)) {
      continue;
    }

    if (fetchCount >= MAX_FETCHES_PER_REQUEST) {
      break;
    }

    const detailUrl = new URL(
      `https://api.polygon.io/v3/reference/tickers/${encodeURIComponent(symbol)}`,
    );
    detailUrl.searchParams.set('apiKey', apiKey);

    const response = await fetch(detailUrl.toString());
    const payload = await response.json();
    fetchCount += 1;

    if (!response.ok) {
      if (isRateLimitStatus(response.status) || isRateLimitPayload(payload)) {
        rateLimited = true;
        break;
      }
      continue;
    }

    const details = payload.results as Record<string, unknown> | undefined;
    if (details && typeof details.ticker === 'string') {
      setCachedTickerDetails(symbol, {
        ...details,
        ticker: details.ticker,
        name:
          typeof details.name === 'string' ? details.name : String(details.ticker),
      });
    }
  }

  return rateLimited;
}

export async function GET(request: NextRequest) {
  const apiKey = process.env.MASSIVE_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        status: 'ERROR',
        message:
          'Massive API key is not set. Add MASSIVE_API_KEY in your environment settings.',
      },
      { status: 500 },
    );
  }

  const search = request.nextUrl.searchParams.get('search');
  const cursor = request.nextUrl.searchParams.get('cursor');

  if (!search) {
    try {
      if (!allDowTickersCached()) {
        const rateLimited = await fetchMissingDowTickers(apiKey);
        const results = buildDowResults();

        if (results.length === 0) {
          if (rateLimited) {
            return NextResponse.json(rateLimitJsonResponse(), { status: 429 });
          }

          return NextResponse.json(
            {
              status: 'ERROR',
              message: 'Failed to load Dow Jones stocks.',
            },
            { status: 502 },
          );
        }

        return NextResponse.json(
          {
            status: 'OK',
            count: results.length,
            results,
          },
          {
            headers: {
              'Cache-Control': allDowTickersCached()
                ? 'public, s-maxage=3600, stale-while-revalidate=86400'
                : 'public, s-maxage=60, stale-while-revalidate=300',
            },
          },
        );
      }

      const results = buildDowResults();

      return NextResponse.json(
        {
          status: 'OK',
          count: results.length,
          results,
        },
        {
          headers: {
            'Cache-Control':
              'public, s-maxage=3600, stale-while-revalidate=86400',
          },
        },
      );
    } catch (error) {
      const results = buildDowResults();

      if (results.length > 0) {
        return NextResponse.json({
          status: 'OK',
          count: results.length,
          results,
        });
      }

      return NextResponse.json(
        {
          status: 'ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 },
      );
    }
  }

  const url = new URL('https://api.polygon.io/v3/reference/tickers');
  url.searchParams.set('apiKey', apiKey);
  url.searchParams.set('market', 'stocks');
  url.searchParams.set('active', 'true');
  url.searchParams.set('search', search);
  url.searchParams.set('limit', '20');

  if (cursor) {
    url.searchParams.set('cursor', cursor);
  }

  try {
    const response = await fetch(url.toString());
    const data = await response.json();

    if (!response.ok) {
      if (isRateLimitStatus(response.status) || isRateLimitPayload(data)) {
        return NextResponse.json(rateLimitJsonResponse(), { status: 429 });
      }
      return NextResponse.json(data, { status: response.status });
    }

    const results = ((data.results ?? []) as Record<string, unknown>[]).map(
      (item) => normalizeTickerResult(item),
    );

    return NextResponse.json({ ...data, results });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
