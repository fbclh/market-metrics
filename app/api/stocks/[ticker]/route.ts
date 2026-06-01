import { NextRequest, NextResponse } from 'next/server';
import { fetchFmpJson, fmpLogoUrl } from '@/lib/fmp';

type RouteContext = {
  params: { ticker: string };
};

type FmpProfile = {
  symbol?: string;
  companyName?: string;
  price?: number;
  marketCap?: number;
  sector?: string;
  industry?: string;
  description?: string;
  exchange?: string;
  image?: string;
  website?: string;
  change?: number;
  changePercentage?: number;
};

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

  try {
    const profileResult = await fetchFmpJson<FmpProfile[]>('profile', apiKey, {
      symbol: ticker,
    });

    if (!profileResult.ok) {
      return NextResponse.json(
        { status: 'ERROR', message: profileResult.message },
        { status: profileResult.status >= 400 ? profileResult.status : 502 },
      );
    }

    if (!Array.isArray(profileResult.data) || profileResult.data.length === 0) {
      return NextResponse.json(
        { status: 'ERROR', message: `No profile found for ${ticker}.` },
        { status: 404 },
      );
    }

    const item = profileResult.data[0];

    return NextResponse.json({
      ticker: item.symbol ?? ticker,
      name: item.companyName ?? ticker,
      sector: item.sector ?? null,
      industry: item.industry ?? null,
      description: item.description ?? null,
      exchange: item.exchange ?? null,
      market_cap: item.marketCap ?? null,
      price: item.price ?? null,
      changes: item.change ?? null,
      logo_url: item.image ?? fmpLogoUrl(ticker),
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
