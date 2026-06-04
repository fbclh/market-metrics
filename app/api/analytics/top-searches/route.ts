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
    .from('search_events')
    .select('query');

  if (error) {
    console.error('top-searches error:', JSON.stringify(error));
    return NextResponse.json(
      { data: null },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const key = row.query.trim().toLowerCase();
    const display = row.query.trim();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const result = Array.from(counts.entries())
    .map(([key, count]) => ({ query: key, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return NextResponse.json(
    { data: result },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}