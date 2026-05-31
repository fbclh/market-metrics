import type { SupabaseClient } from '@supabase/supabase-js';
import { normalizeSearchQuery } from '@/lib/normalize-search-query';

type NameLookup = {
  tickerToName: Map<string, string>;
  keywordToName: Map<string, string>;
};

export async function buildSearchNameLookup(
  supabase: SupabaseClient,
): Promise<NameLookup> {
  const tickerToName = new Map<string, string>();
  const keywordToName = new Map<string, string>();

  const [{ data: views }, { data: watchlist }] = await Promise.all([
    supabase.from('asset_views').select('ticker, company_name'),
    supabase.from('watchlist').select('ticker, company_name'),
  ]);

  for (const row of [...(views ?? []), ...(watchlist ?? [])]) {
    const ticker = row.ticker.trim().toUpperCase();
    const companyName = row.company_name.trim();
    if (!ticker || !companyName) continue;

    tickerToName.set(ticker, companyName);

    const keyword = companyName.split(/[\s,.-]+/)[0]?.toLowerCase();
    if (keyword && !keywordToName.has(keyword)) {
      keywordToName.set(keyword, companyName);
    }
  }

  return { tickerToName, keywordToName };
}

export function resolveSearchDisplayName(
  query: string,
  lookup: NameLookup,
): string {
  const trimmed = query.trim();
  if (!trimmed) return trimmed;

  const ticker = trimmed.toUpperCase();
  const byTicker = lookup.tickerToName.get(ticker);
  if (byTicker) return byTicker;

  const keyword = trimmed.toLowerCase();
  const byKeyword = lookup.keywordToName.get(keyword);
  if (byKeyword) return byKeyword;

  for (const [word, name] of Array.from(lookup.keywordToName.entries())) {
    if (word.startsWith(keyword) || keyword.startsWith(word)) {
      return name;
    }
  }

  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

export function mergeCountsByDisplayName(
  rows: { query: string; count: number }[],
  lookup: NameLookup,
): { name: string; count: number }[] {
  const merged = new Map<string, { name: string; count: number }>();

  for (const row of rows) {
    const resolved = resolveSearchDisplayName(
      normalizeSearchQuery(row.query),
      lookup,
    );
    const name = resolved.trim().replace(/\.+$/, '').replace(/\s+/g, ' ');
    const key = name.toLowerCase();
    const existing = merged.get(key);

    if (existing) {
      existing.count += row.count;
    } else {
      merged.set(key, { name, count: row.count });
    }
  }

  return Array.from(merged.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

export function mergeTopAssetsByTicker(
  rows: { ticker: string; count: number }[],
): { ticker: string; count: number }[] {
  const merged = new Map<string, number>();

  for (const row of rows) {
    const ticker = row.ticker.trim().toUpperCase();
    if (!ticker) continue;
    merged.set(ticker, (merged.get(ticker) ?? 0) + Number(row.count));
  }

  return Array.from(merged.entries())
    .map(([ticker, count]) => ({ ticker, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}
