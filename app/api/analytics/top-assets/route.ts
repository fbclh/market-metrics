import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { mergeTopAssetsByTicker } from '@/lib/search-display-names';

function aggregateTopAssets(rows: { ticker: string }[]) {
  const counts = new Map<string, number>();

  for (const row of rows) {
    const ticker = row.ticker.trim().toUpperCase();
    if (!ticker) continue;
    counts.set(ticker, (counts.get(ticker) ?? 0) + 1);
  }

  return Array.from(counts.entries()).map(([ticker, count]) => ({ ticker, count }));
}

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const { data, error } = await supabase.rpc('analytics_top_assets');

  if (!error) {
    const rows = (data ?? []).map(
      (row: { ticker: string; count: number }) => ({
        ticker: row.ticker,
        count: Number(row.count),
      }),
    );
    return NextResponse.json({ data: mergeTopAssetsByTicker(rows) });
  }

  if (error.code !== 'PGRST202') {
    console.error('top-assets error:', JSON.stringify(error));
    return NextResponse.json({ data: null }, { status: 500 });
  }

  const { data: rows, error: queryError } = await supabase
    .from('asset_views')
    .select('ticker');

  if (queryError) {
    console.error('top-assets fallback error:', JSON.stringify(queryError));
    return NextResponse.json({ data: null }, { status: 500 });
  }

  return NextResponse.json({
    data: mergeTopAssetsByTicker(aggregateTopAssets(rows ?? [])),
  });
}
