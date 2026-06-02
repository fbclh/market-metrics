import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { normalizeSearchQuery, formatSearchQueryDisplay } from '@/lib/normalize-search-query';

type SearchTelemetryBody = {
  query?: unknown;
  session_id?: unknown;
};

export async function POST(request: Request) {
  let body: SearchTelemetryBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Invalid JSON body.' },
      { status: 400 },
    );
  }

  const query = typeof body.query === 'string' ? normalizeSearchQuery(body.query) : '';
  const sessionId =
    typeof body.session_id === 'string' ? body.session_id.trim() : '';

  if (!query) {
    return NextResponse.json(
      { ok: false, error: 'query must be a non-empty string.' },
      { status: 400 },
    );
  }

  if (!sessionId) {
    return NextResponse.json(
      { ok: false, error: 'session_id is required.' },
      { status: 400 },
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const normalizedQuery = formatSearchQueryDisplay(query);

  const { error } = await supabase.from('search_events').insert({
    session_id: sessionId,
    query: normalizedQuery,
  });

  if (error) {
    console.error('Supabase insert error:', JSON.stringify(error));
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
