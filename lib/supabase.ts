/*
  Run the following SQL in the Supabase dashboard SQL editor:

  -- search_events (same as before)
  create table search_events (
    id          uuid primary key default gen_random_uuid(),
    session_id  text not null,
    query       text not null,
    created_at  timestamptz default now()
  );

  -- asset_views (replaces game_views)
  create table asset_views (
    id           uuid primary key default gen_random_uuid(),
    session_id   text not null,
    ticker       text not null,
    company_name text not null,
    created_at   timestamptz default now()
  );

  -- watchlist (replaces play_list)
  create table watchlist (
    id           uuid primary key default gen_random_uuid(),
    session_id   text not null,
    ticker       text not null,
    company_name text not null,
    logo_url     text,
    sector       text,
    status       text not null check (status in
                 ('watchlist','researching','invested')),
    created_at   timestamptz default now(),
    constraint watchlist_session_ticker_unique unique (session_id, ticker)
  );
*/
/*
  Analytics RPC functions — run supabase/analytics_functions.sql in the SQL editor.
*/
