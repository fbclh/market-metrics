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
    .from('asset_views')
    .select('ticker, company_name');

  if (error) {
    console.error('top-assets error:', JSON.stringify(error));
    return NextResponse.json(
      { data: null },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const counts = new Map<string, { company_name: string; count: number }>();
  for (const row of data ?? []) {
    const existing = counts.get(row.ticker);
    if (existing) {
      existing.count += 1;
    } else {
      counts.set(row.ticker, { company_name: row.company_name, count: 1 });
    }
  }

  const result = Array.from(counts.entries())
    .map(([ticker, { company_name, count }]) => ({ ticker, company_name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return NextResponse.json(
    { data: result },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}