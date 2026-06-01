export interface TopSearchItem {
  query: string;
  count: number;
}

export interface TopAssetItem {
  ticker: string;
  count: number;
}

export interface SearchVolumeItem {
  date: string;
  count: number;
}

export interface TrendingItem {
  query: string;
  count: number;
}

export interface WatchlistStats {
  watching: number;
  researching: number;
  invested: number;
  total: number;
}

export interface SectorItem {
  sector: string;
  count: number;
}

export type TopSearchesResponse = { data: TopSearchItem[] };
export type TopAssetsResponse = { data: TopAssetItem[] };
export type SearchVolumeResponse = { data: SearchVolumeItem[] };
export type TrendingResponse = { data: TrendingItem[] };
export type WatchlistStatsResponse = { data: WatchlistStats };
export type SectorBreakdownResponse = { data: SectorItem[] };

export const CHART_COLORS = {
  blue: '#3b82f6',
  emerald: '#10b981',
  amber: '#f59e0b',
  label: '#9ca3af',
  grid: 'rgba(255, 255, 255, 0.08)',
  tooltipBg: '#1e293b',
  tooltipBorder: '#334155',
} as const;

export const chartTooltipStyle = {
  contentStyle: {
    backgroundColor: CHART_COLORS.tooltipBg,
    border: `1px solid ${CHART_COLORS.tooltipBorder}`,
    borderRadius: '8px',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.4)',
  },
  labelStyle: { color: '#e8eef4', fontWeight: 600 },
  itemStyle: { color: '#9ca3af' },
};

export const chartAxisStyle = {
  tick: { fill: CHART_COLORS.label, fontSize: 12 },
  axisLine: false,
  tickLine: false,
};

export const defaultWatchlistStats: WatchlistStats = {
  watching: 0,
  researching: 0,
  invested: 0,
  total: 0,
};
