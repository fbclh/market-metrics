import { NextRequest, NextResponse } from 'next/server';
import {
  fetchFmpJson,
  fmpLogoUrl,
} from '@/lib/fmp';

type StockResult = {
  ticker: string;
  name: string;
  sector: string | null;
  exchange: string;
  logo_url: string;
};

type DowJonesItem = {
  symbol?: string;
  name?: string;
  sector?: string;
};

type SearchItem = {
  symbol?: string;
  name?: string;
  exchange?: string;
  currency?: string;
};

type ScreenerItem = {
  symbol?: string;
  companyName?: string;
  sector?: string;
  exchangeShortName?: string;
};

type MostActiveItem = {
  symbol?: string;
  name?: string;
  exchange?: string;
};

const DEFAULT_LIST_LIMIT = 30;
const FMP_V3_BASE_URL = 'https://financialmodelingprep.com/api/v3';

function mapDowJonesItem(item: DowJonesItem): StockResult | null {
  const ticker = item.symbol?.trim().toUpperCase();
  const name = item.name?.trim();

  if (!ticker || !name) {
    return null;
  }

  return {
    ticker,
    name,
    sector: item.sector?.trim() || null,
    exchange: 'NYSE/NASDAQ',
    logo_url: fmpLogoUrl(ticker),
  };
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
    logo_url: fmpLogoUrl(ticker),
  };
}

function mapScreenerItem(item: ScreenerItem): StockResult | null {
  const ticker = item.symbol?.trim().toUpperCase();
  const name = item.companyName?.trim();

  if (!ticker || !name) {
    return null;
  }

  return {
    ticker,
    name,
    sector: item.sector?.trim() || null,
    exchange: item.exchangeShortName?.trim() || 'NYSE/NASDAQ',
    logo_url: fmpLogoUrl(ticker),
  };
}

function mapMostActiveItem(item: MostActiveItem): StockResult | null {
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
    logo_url: fmpLogoUrl(ticker),
  };
}

function preferUsSearchResults(items: SearchItem[]): SearchItem[] {
  const usItems = items.filter((item) => item.currency === 'USD');
  return usItems.length > 0 ? usItems : items;
}

async function loadDefaultStocks(apiKey: string): Promise<StockResult[]> {
  const dowUrl = new URL(`${FMP_V3_BASE_URL}/dowjones_constituent`);
  dowUrl.searchParams.set('apikey', apiKey);

  const dowResponse = await fetch(dowUrl.toString());
  const dowData = (await dowResponse.json()) as DowJonesItem[] | { 'Error Message'?: string };

  console.log('FMP dowjones response status:', dowResponse.status);
  console.log(
    'FMP dowjones data sample:',
    JSON.stringify(dowData).slice(0, 200),
  );

  if (dowResponse.ok && Array.isArray(dowData) && dowData.length > 0) {
    const results = dowData
      .map(mapDowJonesItem)
      .filter((item): item is StockResult => item !== null);

    if (results.length > 0) {
      return results;
    }
  }

  const screenerUrl = new URL(`${FMP_V3_BASE_URL}/stock-screener`);
  screenerUrl.searchParams.set('marketCapMoreThan', '100000000000');
  screenerUrl.searchParams.set('exchange', 'NYSE,NASDAQ');
  screenerUrl.searchParams.set('limit', String(DEFAULT_LIST_LIMIT));
  screenerUrl.searchParams.set('apikey', apiKey);

  const screenerResponse = await fetch(screenerUrl.toString());
  const screenerData = (await screenerResponse.json()) as
    | ScreenerItem[]
    | { 'Error Message'?: string };

  console.log('FMP screener response status:', screenerResponse.status);
  console.log(
    'FMP screener data sample:',
    JSON.stringify(screenerData).slice(0, 200),
  );

  if (screenerResponse.ok && Array.isArray(screenerData) && screenerData.length > 0) {
    const screenerResults = screenerData
      .map(mapScreenerItem)
      .filter((item): item is StockResult => item !== null)
      .slice(0, DEFAULT_LIST_LIMIT);

    if (screenerResults.length > 0) {
      return screenerResults;
    }
  }

  const activesResult = await fetchFmpJson<MostActiveItem[]>(
    'most-actives',
    apiKey,
  );

  if (activesResult.ok && Array.isArray(activesResult.data)) {
    const activeResults = activesResult.data
      .map(mapMostActiveItem)
      .filter((item): item is StockResult => item !== null)
      .slice(0, DEFAULT_LIST_LIMIT);

    if (activeResults.length > 0) {
      return activeResults;
    }
  }

  throw new Error('Failed to load default stocks.');
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

      const results = preferUsSearchResults(searchResult.data)
        .map(mapSearchItem)
        .filter((item): item is StockResult => item !== null);

      return NextResponse.json({
        results,
        total: results.length,
      });
    }

    const results = await loadDefaultStocks(apiKey);

    if (results.length === 0) {
      return NextResponse.json(
        { status: 'ERROR', message: 'Failed to load stocks.' },
        { status: 502 },
      );
    }

    return NextResponse.json(
      {
        results,
        total: results.length,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      },
    );
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
