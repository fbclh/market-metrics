import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function aggregateSearchVolume(rows: { created_at: string }[]) {
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const counts = new Map<string, number>();

  for (const row of rows) {
    const createdAt = new Date(row.created_at).getTime();
    if (createdAt < cutoff) continue;

    const date = row.created_at.slice(0, 10);
    counts.set(date, (counts.get(date) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const { data, error } = await supabase.rpc('analytics_search_volume');

  if (!error) {
    return NextResponse.json({ data });
  }

  if (error.code !== 'PGRST202') {
    console.error('search-volume error:', JSON.stringify(error));
    return NextResponse.json({ data: null }, { status: 500 });
  }

  const { data: rows, error: queryError } = await supabase
    .from('search_events')
    .select('created_at');

  if (queryError) {
    console.error('search-volume fallback error:', JSON.stringify(queryError));
    return NextResponse.json({ data: null }, { status: 500 });
  }

  return NextResponse.json({ data: aggregateSearchVolume(rows ?? []) });
}
