import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export async function GET() {
  const supabase = createClient(
.   process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data, error } = await supabase
    .from('search_events')
    .select('created_at')
    .gte('created_at', thirtyDaysAgo.toISOString());

  if (error) {
    console.error('search-volume error:', JSON.stringify(error));
    return NextResponse.json(
      { data: null },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const date = row.created_at.slice(0, 10);
    counts.set(date, (counts.get(date) ?? 0) + 1);
  }

  const result = Array.from(counts.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return NextResponse.json(
    { data: result },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}