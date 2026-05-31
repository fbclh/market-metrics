import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function aggregateTopAssets(
  rows: { ticker: string; company_name: string }[],
) {
  const counts = new Map<string, { ticker: string; company_name: string; count: number }>();

  for (const row of rows) {
    const key = `${row.ticker}::${row.company_name}`;
    const existing = counts.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      counts.set(key, {
        ticker: row.ticker,
        company_name: row.company_name,
        count: 1,
      });
    }
  }

  return Array.from(counts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const { data, error } = await supabase.rpc('analytics_top_assets');

  if (!error) {
    return NextResponse.json({ data });
  }

  if (error.code !== 'PGRST202') {
    console.error('top-assets error:', JSON.stringify(error));
    return NextResponse.json({ data: null }, { status: 500 });
  }

  const { data: rows, error: queryError } = await supabase
    .from('asset_views')
    .select('ticker, company_name');

  if (queryError) {
    console.error('top-assets fallback error:', JSON.stringify(queryError));
    return NextResponse.json({ data: null }, { status: 500 });
  }

  return NextResponse.json({ data: aggregateTopAssets(rows ?? []) });
}
