import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function aggregateTopSearches(rows: { query: string }[]) {
  const counts = new Map<string, number>();
  for (const row of rows) {
    counts.set(row.query, (counts.get(row.query) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([query, count]) => ({ query, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const { data, error } = await supabase.rpc('analytics_top_searches');

  if (!error) {
    return NextResponse.json({ data });
  }

  if (error.code !== 'PGRST202') {
    console.error('top-searches error:', JSON.stringify(error));
    return NextResponse.json({ data: null }, { status: 500 });
  }

  const { data: rows, error: queryError } = await supabase
    .from('search_events')
    .select('query');

  if (queryError) {
    console.error('top-searches fallback error:', JSON.stringify(queryError));
    return NextResponse.json({ data: null }, { status: 500 });
  }

  return NextResponse.json({ data: aggregateTopSearches(rows ?? []) });
}
