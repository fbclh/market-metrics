import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function aggregateTrending(rows: { query: string; created_at: string }[]) {
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const counts = new Map<string, number>();

  for (const row of rows) {
    const createdAt = new Date(row.created_at).getTime();
    if (createdAt < cutoff) continue;
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
  const { data, error } = await supabase.rpc('analytics_trending');

  if (!error) {
    return NextResponse.json({ data });
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

  return NextResponse.json({ data: aggregateTrending(rows ?? []) });
}
