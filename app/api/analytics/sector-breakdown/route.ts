import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { data, error } = await supabase.rpc('analytics_sector_breakdown');

  if (error) {
    console.error('sector-breakdown error:', JSON.stringify(error));
    return NextResponse.json(
      { data: null },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const rows = (data ?? []).map((row: { sector: string; count: number | string }) => ({
    sector: row.sector,
    count: Number(row.count),
  }));

  return NextResponse.json(
    { data: rows },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}