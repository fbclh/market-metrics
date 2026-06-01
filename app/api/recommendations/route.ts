import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { WATCHLIST_STATUS_LABELS, type WatchlistStatus } from '@/types/watchlist';

type RecommendationsBody = {
  session_id?: unknown;
};

type WatchlistRow = {
  ticker: string;
  company_name: string;
  sector: string | null;
  status: WatchlistStatus;
};

type Recommendation = {
  ticker: string;
  name: string;
  reason: string;
};

function formatStockLine(stock: WatchlistRow): string {
  const sector = stock.sector?.trim() || 'Unknown sector';
  const status = WATCHLIST_STATUS_LABELS[stock.status];
  return `${stock.ticker} - ${stock.company_name} (${sector}) - ${status}`;
}

function buildPrompt(stocks: WatchlistRow[]): string {
  const stockLines = stocks.map(formatStockLine).join('\n');

  return `The user has these stocks in their portfolio:
${stockLines}
Based on their investment interests and sectors, recommend 3 stocks they might want to research next.
For each recommendation provide: ticker, name, reason (2 sentences max).
Respond only with a JSON array, no markdown, no backticks:
[{ "ticker": string, "name": string, "reason": string }]`;
}

function parseRecommendations(text: string): Recommendation[] {
  const parsed = JSON.parse(text) as unknown;

  if (!Array.isArray(parsed)) {
    throw new Error('Cohere response was not a JSON array.');
  }

  return parsed.map((item) => {
    if (
      typeof item !== 'object' ||
      item === null ||
      typeof (item as Recommendation).ticker !== 'string' ||
      typeof (item as Recommendation).name !== 'string' ||
      typeof (item as Recommendation).reason !== 'string'
    ) {
      throw new Error('Cohere response contained invalid recommendation items.');
    }

    return {
      ticker: (item as Recommendation).ticker.trim(),
      name: (item as Recommendation).name.trim(),
      reason: (item as Recommendation).reason.trim(),
    };
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RecommendationsBody;
    const sessionId =
      typeof body.session_id === 'string' ? body.session_id.trim() : '';

    if (!sessionId) {
      return NextResponse.json(
        { recommendations: [], error: 'session_id is required.' },
        { status: 400 },
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    const { data: watchlist, error: dbError } = await supabase
      .from('watchlist')
      .select('ticker, company_name, sector, status')
      .eq('session_id', sessionId);

    if (dbError) {
      return NextResponse.json(
        { recommendations: [], error: dbError.message },
        { status: 500 },
      );
    }

    if (!watchlist || watchlist.length === 0) {
      return NextResponse.json({
        recommendations: [],
        message: 'Add some stocks to your portfolio first',
      });
    }

    const cohereApiKey = process.env.COHERE_API_KEY;
    if (!cohereApiKey) {
      return NextResponse.json(
        { recommendations: [], error: 'COHERE_API_KEY is not configured.' },
        { status: 500 },
      );
    }

    const prompt = buildPrompt(watchlist as WatchlistRow[]);
    const cohereResponse = await fetch('https://api.cohere.com/v2/chat', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cohereApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'command-r7b-12-2024',
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const cohereData = (await cohereResponse.json()) as {
      message?: { content?: { text?: string }[] };
      error?: { message?: string };
    };

    if (!cohereResponse.ok) {
      const message =
        cohereData.error?.message ?? 'Failed to generate recommendations.';
      return NextResponse.json(
        { recommendations: [], error: message },
        { status: 500 },
      );
    }

    const text = cohereData.message?.content?.[0]?.text;
    if (!text) {
      return NextResponse.json(
        { recommendations: [], error: 'Cohere returned an empty response.' },
        { status: 500 },
      );
    }

    const recommendations = parseRecommendations(text);

    return NextResponse.json({ recommendations });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to generate recommendations.';
    return NextResponse.json(
      { recommendations: [], error: message },
      { status: 500 },
    );
  }
}
