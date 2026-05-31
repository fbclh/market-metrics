import { NextRequest, NextResponse } from 'next/server';
import {
  isRateLimitStatus,
  rateLimitJsonResponse,
} from '@/lib/api-errors';

type RouteContext = {
  params: { ticker: string };
};

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const apiKey = process.env.MASSIVE_API_KEY;
  const ticker = params.ticker?.trim().toUpperCase();

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

  if (!ticker) {
    return NextResponse.json(
      { status: 'ERROR', message: 'Ticker is required.' },
      { status: 400 },
    );
  }

  const tickerUrl = new URL(
    `https://api.polygon.io/v3/reference/tickers/${encodeURIComponent(ticker)}`,
  );
  tickerUrl.searchParams.set('apiKey', apiKey);

  const prevUrl = new URL(
    `https://api.polygon.io/v2/aggs/ticker/${encodeURIComponent(ticker)}/prev`,
  );
  prevUrl.searchParams.set('apiKey', apiKey);

  try {
    const [tickerResponse, prevResponse] = await Promise.all([
      fetch(tickerUrl.toString()),
      fetch(prevUrl.toString()),
    ]);

    const tickerData = await tickerResponse.json();
    const prevData = await prevResponse.json();

    if (!tickerResponse.ok) {
      if (isRateLimitStatus(tickerResponse.status)) {
        return NextResponse.json(rateLimitJsonResponse(), { status: 429 });
      }
      return NextResponse.json(tickerData, { status: tickerResponse.status });
    }

    const tickerDetails = tickerData.results ?? {};
    const aggResults =
      prevResponse.ok && Array.isArray(prevData.results) ? prevData.results : [];
    const hasLogo =
      Boolean(tickerDetails.branding?.logo_url) ||
      Boolean(tickerDetails.branding?.icon_url);

    return NextResponse.json({
      ...tickerDetails,
      branding: tickerDetails.branding ?? null,
      logo_url: hasLogo
        ? `/api/stocks/${encodeURIComponent(ticker)}/logo`
        : null,
      previousClose: aggResults[0] ?? null,
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
