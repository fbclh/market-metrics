import { NextRequest, NextResponse } from 'next/server';

const FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3';

type RouteContext = {
  params: { ticker: string };
};

type FmpProfile = {
  symbol?: string;
  companyName?: string;
  price?: number;
  mktCap?: number;
  sector?: string;
  industry?: string;
  description?: string;
  exchange?: string;
  logo?: string;
  website?: string;
  beta?: number;
  volAvg?: number;
  changes?: number;
  currency?: string;
};

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

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const apiKey = process.env.FMP_API_KEY;
  const ticker = params.ticker?.trim().toUpperCase();

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

  if (!ticker) {
    return NextResponse.json(
      { status: 'ERROR', message: 'Ticker is required.' },
      { status: 400 },
    );
  }

  const url = new URL(`${FMP_BASE_URL}/profile/${encodeURIComponent(ticker)}`);
  url.searchParams.set('apikey', apiKey);

  try {
    const response = await fetch(url.toString());
    const data = (await response.json()) as FmpProfile[] | { message?: string };

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    if (!Array.isArray(data) || data.length === 0) {
      const message = fmpErrorMessage(data, `No profile found for ${ticker}.`);
      return NextResponse.json(
        { status: 'ERROR', message },
        { status: 404 },
      );
    }

    const item = data[0];

    return NextResponse.json({
      ticker: item.symbol ?? ticker,
      name: item.companyName ?? ticker,
      sector: item.sector ?? null,
      industry: item.industry ?? null,
      description: item.description ?? null,
      exchange: item.exchange ?? null,
      market_cap: item.mktCap ?? null,
      price: item.price ?? null,
      changes: item.changes ?? null,
      logo_url: item.logo ?? `https://financialmodelingprep.com/image-stock/${ticker}.png`,
      website: item.website ?? null,
    });
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
