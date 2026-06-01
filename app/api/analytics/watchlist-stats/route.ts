import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { data, error } = await supabase
    .from('watchlist')
    .select('status');

  if (error) {
    console.error('watchlist-stats error:', JSON.stringify(error));
    return NextResponse.json({ data: null }, { status: 500 });
  }

  const rows = data ?? [];
  const watching = rows.filter(r => r.status === 'watching').length;
  const researching = rows.filter(r => r.status === 'researching').length;
  const invested = rows.filter(r => r.status === 'invested').length;

  return NextResponse.json({
    data: {
      watching,
      researching,
      invested,
      total: watching + researching + invested,
    }
  });
}