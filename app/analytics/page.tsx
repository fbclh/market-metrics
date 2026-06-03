'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  CHART_COLORS,
  chartAxisStyle,
  chartTooltipStyle,
  defaultWatchlistStats,
  type SearchVolumeItem,
  type SearchVolumeResponse,
  type SectorBreakdownResponse,
  type SectorItem,
  type TopAssetItem,
  type TopAssetsResponse,
  type TopSearchItem,
  type TopSearchesResponse,
  type TrendingItem,
  type TrendingResponse,
  type WatchlistStats,
  type WatchlistStatsResponse,
} from '@/types/analytics';
import { SubpageHeader } from '@/src/components/layout/SubpageHeader';

function truncateLabel(value: string, max = 12): string {
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div
      className="animate-pulse rounded-lg bg-white/10"
      style={{ height }}
    />
  );
}

function EmptyState() {
  return (
    <div className="flex h-[300px] items-center justify-center text-sm text-gray-400">
      No data yet
    </div>
  );
}

function SectionCard({
  title,
  children,
  className = '',
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-white/10 bg-[#0d1b2a] p-5 shadow-[var(--shadow)] ${className}`}
    >
      <h2 className="mb-4 text-lg font-semibold text-white">{title}</h2>
      {children}
    </section>
  );
}

async function fetchAnalytics<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(path, { cache: 'no-store' });
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [searchVolume, setSearchVolume] = useState<SearchVolumeItem[]>([]);
  const [topSearches, setTopSearches] = useState<TopSearchItem[]>([]);
  const [topAssets, setTopAssets] = useState<TopAssetItem[]>([]);
  const [trending, setTrending] = useState<TrendingItem[]>([]);
  const [watchlistStats, setWatchlistStats] =
    useState<WatchlistStats>(defaultWatchlistStats);
  const [sectorBreakdown, setSectorBreakdown] = useState<SectorItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);

      const [
        volumeResult,
        searchesResult,
        assetsResult,
        trendingResult,
        statsResult,
        sectorResult,
      ] = await Promise.all([
        fetchAnalytics<SearchVolumeResponse>('/api/analytics/search-volume'),
        fetchAnalytics<TopSearchesResponse>('/api/analytics/top-searches'),
        fetchAnalytics<TopAssetsResponse>('/api/analytics/top-assets'),
        fetchAnalytics<TrendingResponse>('/api/analytics/trending'),
        fetchAnalytics<WatchlistStatsResponse>(
          '/api/analytics/watchlist-stats',
        ),
        fetchAnalytics<SectorBreakdownResponse>(
          '/api/analytics/sector-breakdown',
        ),
      ]);

      if (cancelled) return;

      setSearchVolume(volumeResult?.data ?? []);
      setTopSearches(searchesResult?.data ?? []);
      setTopAssets(assetsResult?.data ?? []);
      setTrending(trendingResult?.data ?? []);
      setWatchlistStats(statsResult?.data ?? defaultWatchlistStats);
      setSectorBreakdown(sectorResult?.data ?? []);
      setLoading(false);
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const pieData = [
    {
      name: 'Watching',
      value: watchlistStats.watching,
      color: CHART_COLORS.blue,
    },
    {
      name: 'Researching',
      value: watchlistStats.researching,
      color: CHART_COLORS.amber,
    },
    {
      name: 'Invested',
      value: watchlistStats.invested,
      color: CHART_COLORS.emerald,
    },
  ].filter((item) => item.value > 0);

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      <SubpageHeader />
      <div className="mx-auto max-w-7xl px-4 py-8 pb-12 md:px-6">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-gray-300 transition hover:text-white"
        >
          <span aria-hidden="true">←</span>
          Back to Market
        </Link>

        <header className="mb-8">
          <h1 className="text-2xl font-bold text-white md:text-3xl">
            Analytics Dashboard
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            Real usage data from searches, stock views, and portfolio activity.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SectionCard title="Trending This Week" className="lg:order-1">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="h-8 animate-pulse rounded bg-white/10" />
                ))}
              </div>
            ) : trending.length === 0 ? (
              <EmptyState />
            ) : (
              <ol className="space-y-3">
                {trending.map((item, index) => (
                  <li
                    key={`${item.query}-${index}`}
                    className="flex items-center justify-between rounded-lg border border-white/10 bg-[#12243a] px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-[var(--brand-accent-light)]">
                        {index + 1}
                      </span>
                      <span className="text-sm text-gray-300">{item.query}</span>
                    </div>
                    <span className="rounded-full bg-[#0d1b2a] px-2.5 py-0.5 text-xs font-medium text-gray-300 ring-1 ring-white/10">
                      {item.count}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </SectionCard>

          <SectionCard
            title="Portfolio Activity"
            className="lg:order-2 border-[var(--brand-accent-light)]/30 shadow-lg shadow-[var(--brand-accent-light)]/5"
          >
            {loading ? (
              <ChartSkeleton height={280} />
            ) : watchlistStats.total === 0 || pieData.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="flex w-full flex-col items-center">
                <div className="relative mx-auto size-[220px] sm:size-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius="60%"
                        outerRadius="82%"
                        paddingAngle={2}
                      >
                        {pieData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} stroke="transparent" />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div
                    className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"
                    aria-hidden="true"
                  >
                    <span className="text-4xl font-bold leading-none text-white">
                      {watchlistStats.total}
                    </span>
                    <span className="mt-1 text-sm text-gray-400">total</span>
                  </div>
                </div>
                <ul
                  className={`mt-5 grid w-full max-w-sm gap-x-6 gap-y-2 justify-items-center text-sm text-gray-300 ${
                    pieData.length === 1
                      ? 'grid-cols-1'
                      : pieData.length === 2
                        ? 'grid-cols-2'
                        : 'grid-cols-3'
                  }`}
                >
                  {pieData.map((entry) => (
                    <li
                      key={entry.name}
                      className="flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                      <span
                        className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: entry.color }}
                      />
                      {entry.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </SectionCard>

          <SectionCard title="Most Searched" className="lg:order-3">
            {loading ? (
              <ChartSkeleton />
            ) : topSearches.length === 0 ? (
              <EmptyState />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topSearches} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" />
                  <XAxis type="number" allowDecimals={false} {...chartAxisStyle} />
                  <YAxis
                    type="category"
                    dataKey="query"
                    width={120}
                    {...chartAxisStyle}
                  />
                  <Tooltip {...chartTooltipStyle} />
                  <Bar dataKey="count" fill={CHART_COLORS.blue} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </SectionCard>

          <SectionCard title="Most Viewed" className="lg:order-4">
            {loading ? (
              <ChartSkeleton />
            ) : topAssets.length === 0 ? (
              <EmptyState />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topAssets}>
                  <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="ticker"
                    tickFormatter={(value) =>
                      truncateLabel(String(value).toUpperCase())
                    }
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                    height={70}
                    {...chartAxisStyle}
                  />
                  <YAxis allowDecimals={false} {...chartAxisStyle} />
                  <Tooltip
                    {...chartTooltipStyle}
                    labelFormatter={(value) => String(value).toUpperCase()}
                  />
                  <Bar dataKey="count" fill={CHART_COLORS.emerald} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </SectionCard>

          <SectionCard title="Watchlist by Sector" className="lg:order-5 lg:col-span-2">
            {loading ? (
              <ChartSkeleton />
            ) : sectorBreakdown.length === 0 ? (
              <EmptyState />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={sectorBreakdown}
                  layout="vertical"
                  margin={{ left: 20 }}
                >
                  <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" />
                  <XAxis type="number" allowDecimals={false} {...chartAxisStyle} />
                  <YAxis
                    type="category"
                    dataKey="sector"
                    width={120}
                    {...chartAxisStyle}
                  />
                  <Tooltip {...chartTooltipStyle} />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </SectionCard>

          <SectionCard
            title="Search Activity — Last 30 Days"
            className="lg:order-6 lg:col-span-2"
          >
            {loading ? (
              <ChartSkeleton />
            ) : searchVolume.length === 0 ? (
              <EmptyState />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={searchVolume}>
                  <defs>
                    <linearGradient id="searchVolumeFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.blue} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={CHART_COLORS.blue} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" />
                  <XAxis dataKey="date" {...chartAxisStyle} />
                  <YAxis allowDecimals={false} {...chartAxisStyle} />
                  <Tooltip {...chartTooltipStyle} />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke={CHART_COLORS.blue}
                    fill="url(#searchVolumeFill)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
