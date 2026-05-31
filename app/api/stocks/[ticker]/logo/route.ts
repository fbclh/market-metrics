import { NextRequest, NextResponse } from 'next/server';
import {
  getCachedTickerDetails,
  setCachedTickerDetails,
} from '@/lib/ticker-details-cache';
import { getCachedLogo, setCachedLogo } from '@/lib/logo-cache';

type RouteContext = {
  params: { ticker: string };
};

function logoNotFound(ticker: string, reason: string): NextResponse {
  console.log(`[logo] ${ticker}: ${reason}`);
  setCachedLogo(ticker, { kind: 'miss', status: 404 });
  return new NextResponse('Logo not found.', { status: 404 });
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const apiKey = process.env.MASSIVE_API_KEY;
  const ticker = params.ticker?.trim().toUpperCase();

  if (!apiKey) {
    return new NextResponse('Massive API key is not configured.', { status: 500 });
  }

  if (!ticker) {
    return new NextResponse('Ticker is required.', { status: 400 });
  }

  const cached = getCachedLogo(ticker);
  if (cached?.kind === 'hit') {
    console.log(`[logo] ${ticker}: served from cache`);
    return new NextResponse(cached.buffer, {
      headers: {
        'Content-Type': cached.contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  }

  if (cached?.kind === 'miss') {
    console.log(`[logo] ${ticker}: cached miss`);
    return new NextResponse('Logo not found.', { status: 404 });
  }

  const tickerUrl = new URL(
    `https://api.polygon.io/v3/reference/tickers/${encodeURIComponent(ticker)}`,
  );
  tickerUrl.searchParams.set('apiKey', apiKey);

  try {
    const cachedDetails = getCachedTickerDetails(ticker);
    let branding = cachedDetails?.branding ?? null;

    if (!branding) {
      const tickerResponse = await fetch(tickerUrl.toString());
      const tickerData = await tickerResponse.json();

      if (!tickerResponse.ok) {
        console.log(
          `[logo] ${ticker}: ticker lookup failed (${tickerResponse.status})`,
        );
        setCachedLogo(ticker, { kind: 'miss', status: 404 });
        return new NextResponse('Logo not found.', { status: 404 });
      }

      const details = tickerData.results;
      if (details) {
        setCachedTickerDetails(ticker, details);
      }

      branding = details?.branding ?? null;
    }

    if (!branding) {
      return logoNotFound(ticker, 'no branding object');
    }

    const logoUrl = branding.logo_url ?? null;

    if (!logoUrl) {
      return logoNotFound(ticker, 'no logo_url in branding');
    }

    const imageUrl = new URL(logoUrl);
    imageUrl.searchParams.set('apiKey', apiKey);

    const imageResponse = await fetch(imageUrl.toString());

    if (!imageResponse.ok) {
      return logoNotFound(
        ticker,
        `logo image fetch failed (${imageResponse.status})`,
      );
    }

    const contentType =
      imageResponse.headers.get('content-type') ?? 'application/octet-stream';
    const buffer = await imageResponse.arrayBuffer();

    setCachedLogo(ticker, { kind: 'hit', buffer, contentType });
    console.log(`[logo] ${ticker}: logo loaded (${contentType})`);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    console.log(
      `[logo] ${ticker}: unexpected error`,
      error instanceof Error ? error.message : error,
    );
    setCachedLogo(ticker, { kind: 'miss', status: 404 });
    return new NextResponse('Logo not found.', { status: 404 });
  }
}
