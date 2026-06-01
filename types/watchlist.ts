export type WatchlistStatus = 'watching' | 'researching' | 'invested';

export interface WatchlistItem {
  id: string;
  session_id: string;
  ticker: string;
  company_name: string;
  logo_url: string | null;
  sector: string | null;
  status: WatchlistStatus;
  created_at: string;
}

const WATCHLIST_STATUSES: WatchlistStatus[] = [
  'watching',
  'researching',
  'invested',
];

export function isWatchlistStatus(value: unknown): value is WatchlistStatus {
  return (
    typeof value === 'string' &&
    WATCHLIST_STATUSES.includes(value as WatchlistStatus)
  );
}

export const WATCHLIST_STATUS_LABELS: Record<WatchlistStatus, string> = {
  watching: 'Watching',
  researching: 'Researching',
  invested: 'Invested',
};

export const WATCHLIST_TABS: { status: WatchlistStatus; label: string }[] = [
  { status: 'watching', label: 'Watching' },
  { status: 'researching', label: 'Researching' },
  { status: 'invested', label: 'Invested' },
];
