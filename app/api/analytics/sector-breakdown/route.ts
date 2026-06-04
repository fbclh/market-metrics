import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { data, error } = await supabase
    .from('watchlist')
    .select('sector')
    .not('sector', 'is', null)
    .neq('sector', '');

  if (error) {
    console.error('sector-breakdown error:', JSON.stringify(error));
    return NextResponse.json(
      { data: null },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    counts.set(row.sector, (counts.get(row.sector) ?? 0) + 1);
  }

  const result = Array.from(counts.entries())
    .map(([sector, count]) => ({ sector, count }))
    .sort((a, b) => b.count - a.count);

  return NextResponse.json(
    { data: result },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}