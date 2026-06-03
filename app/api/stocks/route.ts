import { NextRequest, NextResponse } from 'next/server';
import { fetchFmpJson } from '@/lib/fmp';

type StockResult = {
  ticker: string;
  name: string;
  sector: string | null;
  exchange: string;
  logo_url: string;
  marketCap?: number;
};

type SearchItem = {
  symbol?: string;
  name?: string;
  exchange?: string;
  currency?: string;
};

type MostActiveItem = {
  symbol?: string;
  name?: string;
  sector?: string;
  exchange?: string;
  marketCap?: number;
};

type ProfileItem = {
  symbol?: string;
  companyName?: string;
  sector?: string;
  exchange?: string;
};

const DEFAULT_LIST_LIMIT = 30;

const US_EXCHANGES = new Set(['NYSE', 'NASDAQ', 'AMEX']);

function isUsMostActive(item: MostActiveItem): boolean {
  const exchange = item.exchange?.trim().toUpperCase() ?? '';
  return US_EXCHANGES.has(exchange);
}

async function fetchExactTickerMatch(
  query: string,
  apiKey: string,
): Promise<StockResult | null> {
  const normalizedQuery = query.trim().toUpperCase();
  const url = `https://financialmodelingprep.com/api/v3/profile/${encodeURIComponent(query.trim())}?apikey=${encodeURIComponent(apiKey)}`;

  try {
    const response = await fetch(url);
    const text = await response.text();
    let data: unknown = null;

    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      return null;
    }

    if (!response.ok || !Array.isArray(data) || data.length === 0) {
      return null;
    }

    const item = data[0] as ProfileItem;
    const symbol = item.symbol?.trim();

    if (!symbol || symbol.toUpperCase() !== normalizedQuery) {
      return null;
    }

    const name = item.companyName?.trim();
    const ticker = symbol.toUpperCase();

    if (!name) {
      return null;
    }

    return {
      ticker,
      name,
      sector: item.sector ?? null,
      exchange: item.exchange?.trim() || '',
      logo_url: `https://financialmodelingprep.com/image-stock/${ticker}.png`,
    };
  } catch {
    return null;
  }
}

function mapSearchItem(item: SearchItem): StockResult | null {
  const ticker = item.symbol?.trim().toUpperCase();
  const name = item.name?.trim();

  if (!ticker || !name) {
    return null;
  }

  return {
    ticker,
    name,
    sector: null,
    exchange: item.exchange?.trim() || '',
    logo_url: `https://financialmodelingprep.com/image-stock/${ticker}.png`,
  };
}

function mapMostActiveItem(item: MostActiveItem): StockResult | null {
  const symbol = item.symbol?.trim();
  const name = item.name?.trim();

  if (!symbol || !name) {
    return null;
  }

  return {
    ticker: symbol.toUpperCase(),
    name,
    sector: item.sector ?? null,
    exchange: item.exchange ?? '',
    logo_url: `https://financialmodelingprep.com/image-stock/${symbol}.png`,
    marketCap: item.marketCap ?? 0,
  };
}

function preferUsSearchResults(items: SearchItem[]): SearchItem[] {
  const usItems = items.filter((item) => item.currency === 'USD');
  return usItems.length > 0 ? usItems : items;
}

export async function GET(request: NextRequest) {
  const apiKey = process.env.FMP_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        status: 'ERROR',
        message:
          'FMP API key is not set. Add FMP_API_KEY in your environment settings.',
      },
      { status: 500 },
    );
  }

  const search = request.nextUrl.searchParams.get('search')?.trim();

  try {
    if (search) {
      const exactMatch = await fetchExactTickerMatch(search, apiKey);

      const searchResult = await fetchFmpJson<SearchItem[]>('search-name', apiKey, {
        query: search,
        limit: '20',
      });

      if (!searchResult.ok) {
        return NextResponse.json(
          { status: 'ERROR', message: searchResult.message },
          { status: searchResult.status >= 400 ? searchResult.status : 502 },
        );
      }

      let results = preferUsSearchResults(searchResult.data)
        .map(mapSearchItem)
        .filter((item): item is StockResult => item !== null);

      if (exactMatch) {
        results = [
          exactMatch,
          ...results.filter((item) => item.ticker !== exactMatch.ticker),
        ];
      }

      return NextResponse.json({
        results,
        total: results.length,
      });
    }

    const activesResult = await fetchFmpJson<MostActiveItem[]>(
      'most-actives',
      apiKey,
    );

    if (!activesResult.ok) {
      return NextResponse.json(
        { status: 'ERROR', message: activesResult.message },
        { status: activesResult.status >= 400 ? activesResult.status : 502 },
      );
    }

    if (!Array.isArray(activesResult.data)) {
      return NextResponse.json(
        { status: 'ERROR', message: 'Failed to load stocks.' },
        { status: 502 },
      );
    }

    const results = activesResult.data
      .filter(isUsMostActive)
      .map(mapMostActiveItem)
      .filter((item): item is StockResult => item !== null)
      .slice(0, DEFAULT_LIST_LIMIT);

    return NextResponse.json({
      results,
      total: results.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'ERROR',
        message:
          error instanceof Error ? error.message : 'Failed to load stocks.',
      },
      { status: 502 },
    );
  }
}
