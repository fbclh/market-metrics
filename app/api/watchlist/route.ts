import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  isWatchlistStatus,
  type WatchlistItem,
  type WatchlistStatus,
} from '@/types/watchlist';

type WatchlistPostBody = {
  ticker?: unknown;
  company_name?: unknown;
  logo_url?: unknown;
  sector?: unknown;
  status?: unknown;
  session_id?: unknown;
};

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('session_id')?.trim();

  if (!sessionId) {
    return NextResponse.json(
      { ok: false, error: 'session_id is required.' },
      { status: 400 },
    );
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('watchlist')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Watchlist POST failed:', error.message);
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, data: (data ?? []) as WatchlistItem[] });
}

export async function POST(request: Request) {
  let body: WatchlistPostBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Invalid JSON body.' },
      { status: 400 },
    );
  }

  const ticker = typeof body.ticker === 'string' ? body.ticker.trim().toUpperCase() : '';
  const companyName =
    typeof body.company_name === 'string' ? body.company_name.trim() : '';
  const sessionId =
    typeof body.session_id === 'string' ? body.session_id.trim() : '';
  const status = body.status;
  const logoUrl =
    typeof body.logo_url === 'string' ? body.logo_url.trim() : null;
  const sector = typeof body.sector === 'string' ? body.sector.trim() : null;

  if (!ticker) {
    return NextResponse.json(
      { ok: false, error: 'ticker is required.' },
      { status: 400 },
    );
  }

  if (!companyName) {
    return NextResponse.json(
      { ok: false, error: 'company_name is required.' },
      { status: 400 },
    );
  }

  if (!sessionId) {
    return NextResponse.json(
      { ok: false, error: 'session_id is required.' },
      { status: 400 },
    );
  }

  if (!isWatchlistStatus(status)) {
    return NextResponse.json(
      { ok: false, error: 'status must be watchlist, researching, or invested.' },
      { status: 400 },
    );
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('watchlist')
    .upsert(
      {
        session_id: sessionId,
        ticker,
        company_name: companyName,
        logo_url: logoUrl,
        sector,
        status: status as WatchlistStatus,
      },
      { onConflict: 'session_id,ticker' },
    )
    .select('*')
    .single();

  if (error) {
    console.error('Watchlist POST failed:', error.message);
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, data: data as WatchlistItem });
}
