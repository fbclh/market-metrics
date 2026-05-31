-- Run in Supabase SQL editor (market-metrics project)

create or replace function analytics_top_searches()
returns table(query text, count bigint)
language sql
security definer
as $$
  select query, count(*) as count
  from search_events
  group by query
  order by count desc
  limit 10;
$$;

create or replace function analytics_top_assets()
returns table(ticker text, company_name text, count bigint)
language sql
security definer
as $$
  select ticker, company_name, count(*) as count
  from asset_views
  group by ticker, company_name
  order by count desc
  limit 10;
$$;

create or replace function analytics_search_volume()
returns table(date text, count bigint)
language sql
security definer
as $$
  select date_trunc('day', created_at)::date::text as date,
         count(*) as count
  from search_events
  where created_at >= now() - interval '30 days'
  group by date_trunc('day', created_at)::date
  order by date asc;
$$;

create or replace function analytics_trending()
returns table(query text, count bigint)
language sql
security definer
as $$
  select query, count(*) as count
  from search_events
  where created_at >= now() - interval '7 days'
  group by query
  order by count desc
  limit 10;
$$;

create or replace function analytics_watchlist_stats()
returns table(status text, count bigint)
language sql
security definer
as $$
  select status, count(*) as count
  from watchlist
  group by status;
$$;

grant execute on function analytics_top_searches() to anon;
grant execute on function analytics_top_assets() to anon;
grant execute on function analytics_search_volume() to anon;
grant execute on function analytics_trending() to anon;
grant execute on function analytics_watchlist_stats() to anon;

create or replace function analytics_sector_breakdown()
returns table(sector text, count bigint)
language sql
security definer
as $$
  select sector, count(*) as count
  from watchlist
  where sector is not null and sector != ''
  group by sector
  order by count desc;
$$;

grant execute on function analytics_sector_breakdown() to anon;
