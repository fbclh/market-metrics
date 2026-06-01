import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isWatchlistStatus } from '@/types/watchlist';

type RouteContext = {
  params: { ticker: string };
};

type WatchlistPatchBody = {
  status?: unknown;
  session_id?: unknown;
};

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const sessionId = request.nextUrl.searchParams.get('session_id')?.trim();
  const ticker = params.ticker?.trim().toUpperCase();

  if (!sessionId) {
    return NextResponse.json(
      { ok: false, error: 'session_id is required.' },
      { status: 400 },
    );
  }

  if (!ticker) {
    return NextResponse.json(
      { ok: false, error: 'ticker is required.' },
      { status: 400 },
    );
  }

  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('watchlist')
    .delete()
    .eq('session_id', sessionId)
    .eq('ticker', ticker);

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  let body: WatchlistPatchBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Invalid JSON body.' },
      { status: 400 },
    );
  }

  const sessionId =
    typeof body.session_id === 'string' ? body.session_id.trim() : '';
  const status = body.status;
  const ticker = params.ticker?.trim().toUpperCase();

  if (!sessionId) {
    return NextResponse.json(
      { ok: false, error: 'session_id is required.' },
      { status: 400 },
    );
  }

  if (!ticker) {
    return NextResponse.json(
      { ok: false, error: 'ticker is required.' },
      { status: 400 },
    );
  }

  if (!isWatchlistStatus(status)) {
    return NextResponse.json(
      { ok: false, error: 'status must be watching, researching, or invested.' },
      { status: 400 },
    );
  }

  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('watchlist')
    .update({ status })
    .eq('session_id', sessionId)
    .eq('ticker', ticker);

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
