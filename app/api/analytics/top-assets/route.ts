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

  const { data, error } = await supabase.rpc('analytics_top_assets');

  if (error) {
    console.error('top-assets error:', JSON.stringify(error));
    return NextResponse.json(
      { data: null },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const rows = (data ?? []).map((row: { ticker: string; company_name: string; count: number | string }) => ({
    ticker: row.ticker,
    company_name: row.company_name,
    count: Number(row.count),
  }));

  return NextResponse.json(
    { data: rows },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}