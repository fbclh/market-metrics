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
  defaultListStats,
  type ListStats,
  type ListStatsResponse,
  type SearchVolumeItem,
  type SearchVolumeResponse,
  type TopGameItem,
  type TopGamesResponse,
  type TopSearchItem,
  type TopSearchesResponse,
  type TrendingItem,
  type TrendingResponse,
} from '@/types/analytics';
import { SubpageHeader } from '@/src/components/layout/SubpageHeader';

function truncateLabel(value: string, max = 12): string {
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div
      className="animate-pulse rounded-lg bg-[var(--surface-hover)]"
      style={{ height }}
    />
  );
}

function EmptyState() {
  return (
    <div className="flex h-[300px] items-center justify-center text-sm text-[var(--text-muted)]">
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
      className={`rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)] ${className}`}
    >
      <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">{title}</h2>
      {children}
    </section>
  );
}

async function fetchAnalytics<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(path);
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
  const [topGames, setTopGames] = useState<TopGameItem[]>([]);
  const [trending, setTrending] = useState<TrendingItem[]>([]);
  const [listStats, setListStats] = useState<ListStats>(defaultListStats);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);

      const [
        volumeResult,
        searchesResult,
        gamesResult,
        trendingResult,
        statsResult,
      ] = await Promise.all([
        fetchAnalytics<SearchVolumeResponse>('/api/analytics/search-volume'),
        fetchAnalytics<TopSearchesResponse>('/api/analytics/top-searches'),
        fetchAnalytics<TopGamesResponse>('/api/analytics/top-games'),
        fetchAnalytics<TrendingResponse>('/api/analytics/trending'),
        fetchAnalytics<ListStatsResponse>('/api/analytics/list-stats'),
      ]);

      if (cancelled) return;

      setSearchVolume(volumeResult?.data ?? []);
      setTopSearches(searchesResult?.data ?? []);
      setTopGames(gamesResult?.data ?? []);
      setTrending(trendingResult?.data ?? []);
      setListStats(statsResult?.data ?? defaultListStats);
      setLoading(false);
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const pieData = [
    {
      name: 'Want to Play',
      value: listStats.want_to_play,
      color: CHART_COLORS.indigo,
    },
    { name: 'Playing', value: listStats.playing, color: CHART_COLORS.amber },
    {
      name: 'Finished',
      value: listStats.finished,
      color: CHART_COLORS.emerald,
    },
  ].filter((item) => item.value > 0);

  return (
    <div className="min-h-screen bg-[var(--page-bg)] text-[var(--text-primary)]">
      <SubpageHeader />
      <div className="mx-auto max-w-7xl px-4 py-8 pb-12 md:px-6">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
        >
          <span aria-hidden="true">←</span>
          Back to Market
        </Link>

        <header className="mb-8">
          <h1 className="text-2xl font-bold text-[var(--text-primary)] md:text-3xl">
            Analytics Dashboard
          </h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Real usage data from searches, game views, and play lists.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SectionCard
            title="Search Activity — Last 30 Days"
            className="lg:col-span-2"
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
                      <stop offset="5%" stopColor={CHART_COLORS.indigo} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={CHART_COLORS.indigo} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" />
                  <XAxis dataKey="date" {...chartAxisStyle} />
                  <YAxis allowDecimals={false} {...chartAxisStyle} />
                  <Tooltip {...chartTooltipStyle} />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke={CHART_COLORS.indigo}
                    fill="url(#searchVolumeFill)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </SectionCard>

          <SectionCard title="Most Searched">
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
                    width={100}
                    {...chartAxisStyle}
                  />
                  <Tooltip {...chartTooltipStyle} />
                  <Bar dataKey="count" fill={CHART_COLORS.indigo} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </SectionCard>

          <SectionCard title="Most Viewed">
            {loading ? (
              <ChartSkeleton />
            ) : topGames.length === 0 ? (
              <EmptyState />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topGames}>
                  <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="game_name"
                    tickFormatter={(value) => truncateLabel(String(value))}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                    height={70}
                    {...chartAxisStyle}
                  />
                  <YAxis allowDecimals={false} {...chartAxisStyle} />
                  <Tooltip
                    {...chartTooltipStyle}
                    labelFormatter={(value) => String(value)}
                  />
                  <Bar dataKey="count" fill={CHART_COLORS.emerald} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </SectionCard>

          <SectionCard title="Trending This Week">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="h-8 animate-pulse rounded bg-[var(--surface-hover)]" />
                ))}
              </div>
            ) : trending.length === 0 ? (
              <EmptyState />
            ) : (
              <ol className="space-y-3">
                {trending.map((item, index) => (
                  <li
                    key={`${item.query}-${index}`}
                    className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-hover)] px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-[var(--brand-accent-light)]">
                        {index + 1}
                      </span>
                      <span className="text-sm text-[var(--text-secondary)]">{item.query}</span>
                    </div>
                    <span className="rounded-full bg-[var(--surface)] px-2.5 py-0.5 text-xs font-medium text-[var(--text-secondary)] ring-1 ring-[var(--border)]">
                      {item.count}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </SectionCard>

          <SectionCard title="My Library">
            {loading ? (
              <ChartSkeleton />
            ) : listStats.total === 0 || pieData.length === 0 ? (
              <EmptyState />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={2}
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip {...chartTooltipStyle} />
                  <text
                    x="50%"
                    y="50%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#e8eef4"
                    className="text-2xl font-bold"
                  >
                    {listStats.total}
                  </text>
                  <text
                    x="50%"
                    y="58%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={CHART_COLORS.label}
                    className="text-xs"
                  >
                    total
                  </text>
                </PieChart>
              </ResponsiveContainer>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
