import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { formatSearchQueryDisplay } from '@/lib/normalize-search-query';

export const dynamic = 'force-dynamic';

function mergeSearchCounts(
  rows: { query: string; count: number | string }[],
): { query: string; count: number }[] {
  const counts = new Map<string, number>();

  for (const row of rows) {
    const query = formatSearchQueryDisplay(row.query);
    counts.set(query, (counts.get(query) ?? 0) + Number(row.count));
  }

  return Array.from(counts.entries())
    .map(([query, count]) => ({ query, count }))
    .sort((a, b) => b.count - a.count);
}

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { data, error } = await supabase.rpc('analytics_top_searches');

  if (error) {
    console.error('top-searches error:', JSON.stringify(error));
    return NextResponse.json({ data: null }, { status: 500 });
  }

  return NextResponse.json({ data: mergeSearchCounts(data ?? []) });
}