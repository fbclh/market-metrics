import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  defaultWatchlistStats,
  type WatchlistStats,
} from '@/types/analytics';

type RpcRow = {
  status: string;
  count: number | string;
};

function aggregateWatchlistStats(rows: { status: string }[]): WatchlistStats {
  const result: WatchlistStats = { ...defaultWatchlistStats };

  for (const row of rows) {
    if (row.status === 'watchlist') result.watchlist += 1;
    if (row.status === 'researching') result.researching += 1;
    if (row.status === 'invested') result.invested += 1;
  }

  result.total = result.watchlist + result.researching + result.invested;
  return result;
}

function rowsToStats(rows: RpcRow[]): WatchlistStats {
  const result: WatchlistStats = { ...defaultWatchlistStats };

  for (const row of rows) {
    const count = Number(row.count);
    if (row.status === 'watchlist') result.watchlist = count;
    if (row.status === 'researching') result.researching = count;
    if (row.status === 'invested') result.invested = count;
  }

  result.total = result.watchlist + result.researching + result.invested;
  return result;
}

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const { data, error } = await supabase.rpc('analytics_watchlist_stats');

  if (!error) {
    return NextResponse.json({
      data: rowsToStats((data as RpcRow[] | null) ?? []),
    });
  }

  if (error.code !== 'PGRST202') {
    console.error('watchlist-stats error:', JSON.stringify(error));
    return NextResponse.json({ data: null }, { status: 500 });
  }

  const { data: rows, error: queryError } = await supabase
    .from('watchlist')
    .select('status');

  if (queryError) {
    console.error('watchlist-stats fallback error:', JSON.stringify(queryError));
    return NextResponse.json({ data: null }, { status: 500 });
  }

  return NextResponse.json({ data: aggregateWatchlistStats(rows ?? []) });
}
