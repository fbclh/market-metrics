import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  buildSearchNameLookup,
  mergeCountsByDisplayName,
} from '@/lib/search-display-names';
import { normalizeSearchQuery } from '@/lib/normalize-search-query';

function aggregateTrending(rows: { query: string; created_at: string }[]) {
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const counts = new Map<string, number>();

  for (const row of rows) {
    const createdAt = new Date(row.created_at).getTime();
    if (createdAt < cutoff) continue;
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

  const { data, error } = await supabase.rpc('analytics_trending');

  if (!error) {
    const rows = (data ?? []).map((row: { query: string; count: number }) => ({
      query: row.query,
      count: Number(row.count),
    }));
    return NextResponse.json({ data: mergeCountsByDisplayName(rows, lookup) });
  }

  if (error.code !== 'PGRST202') {
    console.error('trending error:', JSON.stringify(error));
    return NextResponse.json({ data: null }, { status: 500 });
  }

  const { data: rows, error: queryError } = await supabase
    .from('search_events')
    .select('query, created_at');

  if (queryError) {
    console.error('trending fallback error:', JSON.stringify(queryError));
    return NextResponse.json({ data: null }, { status: 500 });
  }

  return NextResponse.json({
    data: mergeCountsByDisplayName(aggregateTrending(rows ?? []), lookup),
  });
}
