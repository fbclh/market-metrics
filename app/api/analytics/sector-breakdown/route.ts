import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function aggregateSectorBreakdown(rows: { sector: string | null }[]) {
  const counts = new Map<string, number>();

  for (const row of rows) {
    const sector = row.sector?.trim();
    if (!sector) continue;
    counts.set(sector, (counts.get(sector) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([sector, count]) => ({ sector, count }))
    .sort((a, b) => b.count - a.count);
}

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const { data, error } = await supabase.rpc('analytics_sector_breakdown');

  if (!error) {
    const rows = (data ?? []).map((row: { sector: string; count: number | string }) => ({
      sector: row.sector,
      count: Number(row.count),
    }));
    return NextResponse.json({ data: rows });
  }

  if (error.code !== 'PGRST202') {
    console.error('sector-breakdown error:', JSON.stringify(error));
    return NextResponse.json({ data: null }, { status: 500 });
  }

  const { data: rows, error: queryError } = await supabase
    .from('watchlist')
    .select('sector');

  if (queryError) {
    console.error('sector-breakdown fallback error:', JSON.stringify(queryError));
    return NextResponse.json({ data: null }, { status: 500 });
  }

  return NextResponse.json({ data: aggregateSectorBreakdown(rows ?? []) });
}
