import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  buildSearchNameLookup,
  mergeCountsByDisplayName,
} from '@/lib/search-display-names';
import { normalizeSearchQuery } from '@/lib/normalize-search-query';

function aggregateTopSearches(rows: { query: string }[]) {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const query = normalizeSearchQuery(row.query);
    counts.set(query, (counts.get(query) ?? 0) + 1);
  }

  return Array.from(counts.entries()).map(([query, count]) => ({ query, count }));
}

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const lookup = await buildSearchNameLookup(supabase);

  const { data, error } = await supabase.rpc('analytics_top_searches');

  if (!error) {
    const rows = (data ?? []).map((row: { query: string; count: number }) => ({
      query: row.query,
      count: Number(row.count),
    }));
    return NextResponse.json({ data: mergeCountsByDisplayName(rows, lookup) });
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

  return NextResponse.json({
    data: mergeCountsByDisplayName(aggregateTopSearches(rows ?? []), lookup),
  });
}
