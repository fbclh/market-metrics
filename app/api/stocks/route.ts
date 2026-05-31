import { NextRequest, NextResponse } from 'next/server';

const FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3';

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
  exchangeShortName?: string;
};

function fmpLogoUrl(symbol: string): string {
  return `https://financialmodelingprep.com/image-stock/${encodeURIComponent(symbol)}.png`;
}

function fmpErrorMessage(data: unknown, fallback: string): string {
  if (
    typeof data === 'object' &&
    data &&
    'Error Message' in data &&
    typeof (data as { 'Error Message': unknown })['Error Message'] === 'string'
  ) {
    return (data as { 'Error Message': string })['Error Message'];
  }

  if (
    typeof data === 'object' &&
    data &&
    'message' in data &&
    typeof (data as { message: unknown }).message === 'string'
  ) {
    return (data as { message: string }).message;
  }

  return fallback;
}

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
    exchange: item.exchangeShortName?.trim() || '',
    logo_url: fmpLogoUrl(ticker),
  };
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
      const url = new URL(`${FMP_BASE_URL}/search`);
      url.searchParams.set('query', search);
      url.searchParams.set('limit', '20');
      url.searchParams.set('apikey', apiKey);

      const response = await fetch(url.toString());
      const data = (await response.json()) as SearchItem[] | { message?: string };

      if (!response.ok) {
        return NextResponse.json(data, { status: response.status });
      }

      if (!Array.isArray(data)) {
        const message = fmpErrorMessage(data, 'Failed to search stocks.');
        return NextResponse.json(
          { status: 'ERROR', message },
          { status: 502 },
        );
      }

      const results = data
        .map(mapSearchItem)
        .filter((item): item is StockResult => item !== null);

      return NextResponse.json({
        results,
        total: results.length,
      });
    }

    const url = new URL(`${FMP_BASE_URL}/dowjones_constituent`);
    url.searchParams.set('apikey', apiKey);

    const response = await fetch(url.toString());
    const data = (await response.json()) as DowJonesItem[] | { message?: string };

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    if (!Array.isArray(data)) {
      const message = fmpErrorMessage(data, 'Failed to load Dow Jones stocks.');
      return NextResponse.json(
        { status: 'ERROR', message },
        { status: 502 },
      );
    }

    const results = data
      .map(mapDowJonesItem)
      .filter((item): item is StockResult => item !== null);

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
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
