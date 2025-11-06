import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const DEFAULT_CAMPAIGN_KEY = "no_notwithstanding";
const CACHE_TIME = 10 * 60 * 1000; // 10 minutes

// Mock data for demo/development
const MOCK_VELOCITY: DailyCount[] = Array.from({ length: 14 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (13 - i));
  return {
    day: date.toISOString().split("T")[0],
    count: Math.floor(Math.random() * 30) + 15 + (i > 7 ? 10 : 0),
  };
});

const MOCK_COVERAGE = { covered: 18, observed: 25, ratio: 0.72, threshold: 20 };
const MOCK_POLL_DISTRIBUTION = [
  { score: 1, count: 45, total: 250, percentage: 18 },
  { score: 2, count: 62, total: 250, percentage: 24.8 },
  { score: 3, count: 53, total: 250, percentage: 21.2 },
  { score: 4, count: 58, total: 250, percentage: 23.2 },
  { score: 5, count: 32, total: 250, percentage: 12.8 },
];
const MOCK_SAFEGUARD = { suppressed: 12, visible: 18, share_suppressed: 0.4, threshold: 20 };

// Mock CCI data (diffusion index 0-100, 50 = neutral)
const MOCK_CCI = {
  cci: 47.6,
  p_better: 0.18,
  p_same: 0.41,
  p_worse: 0.41,
  total_n: 1284,
  sat_mean: 4.9,
  exh_mean: 7.1,
  cci_change_1d: -0.9,
  last_updated: new Date().toISOString(),
};

const MOCK_CCI_SPARKLINE = Array.from({ length: 7 }, (_, i) => ({
  day: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  cci: 48 + Math.random() * 4 - 2,
  n: 180 + Math.floor(Math.random() * 40),
}));

interface DailyCount {
  day: string;
  count: number;
}

interface VelocityStats {
  series: DailyCount[];
  last7Avg: number;
  prev7Avg: number;
  delta: number;
}

export function useDailyVelocity(cKey = DEFAULT_CAMPAIGN_KEY, days = 14) {
  return useQuery({
    queryKey: ["dailyVelocity", cKey, days],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_campaign_daily_counts", {
        c_key: cKey,
        days,
      });

      if (error) throw error;

      const series: DailyCount[] = (data || []).map((row) => ({
        day: row.day,
        count: row.count,
      }));

      // Use mock data if no real data
      const actualSeries = series.length > 0 ? series : MOCK_VELOCITY;

      // Calculate 7-day averages
      const last7 = actualSeries.slice(-7);
      const prev7 = actualSeries.slice(-14, -7);

      const last7Avg = last7.length
        ? last7.reduce((sum, d) => sum + d.count, 0) / last7.length
        : 0;
      const prev7Avg = prev7.length
        ? prev7.reduce((sum, d) => sum + d.count, 0) / prev7.length
        : 0;

      const delta =
        prev7Avg > 0 ? ((last7Avg - prev7Avg) / prev7Avg) * 100 : 0;

      return { series: actualSeries, last7Avg, prev7Avg, delta } as VelocityStats;
    },
    staleTime: CACHE_TIME,
    gcTime: CACHE_TIME,
    refetchInterval: CACHE_TIME,
  });
}

interface CoverageData {
  covered: number;
  observed: number;
  ratio: number;
  threshold: number;
}

export function useCoverage(cKey = DEFAULT_CAMPAIGN_KEY) {
  return useQuery({
    queryKey: ["coverage", cKey],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_campaign_coverage", {
        c_key: cKey,
      });

      if (error) throw error;
      if (!data || data.length === 0) return MOCK_COVERAGE;

      return {
        covered: data[0].covered,
        observed: data[0].observed,
        ratio: Number(data[0].ratio),
        threshold: data[0].threshold,
      } as CoverageData;
    },
    staleTime: CACHE_TIME,
    gcTime: CACHE_TIME,
    refetchInterval: CACHE_TIME,
  });
}

interface PollDistribution {
  score: number;
  count: number;
  total: number;
  percentage: number;
}

export function usePollDistribution(pollId: string | undefined) {
  return useQuery({
    queryKey: ["pollDistribution", pollId],
    queryFn: async () => {
      // Return mock data if no poll ID
      if (!pollId) return MOCK_POLL_DISTRIBUTION;

      const { data, error } = await supabase.rpc("get_poll_distribution", {
        _poll_id: pollId,
      });

      if (error) throw error;
      if (!data || data.length === 0) return MOCK_POLL_DISTRIBUTION;

      const distribution: PollDistribution[] = data.map((row) => ({
        score: row.score,
        count: row.count,
        total: row.total,
        percentage: row.total > 0 ? (row.count / row.total) * 100 : 0,
      }));

      return distribution;
    },
    staleTime: CACHE_TIME,
    gcTime: CACHE_TIME,
    refetchInterval: CACHE_TIME,
  });
}

interface SafeguardData {
  suppressed: number;
  visible: number;
  share_suppressed: number;
  threshold: number;
}

export function useSafeguardRatio(cKey = DEFAULT_CAMPAIGN_KEY) {
  return useQuery({
    queryKey: ["safeguardRatio", cKey],
    queryFn: async () => {
      const { data, error } = await supabase.rpc(
        "get_privacy_safeguard_ratio",
        {
          c_key: cKey,
        }
      );

      if (error) throw error;
      if (!data || data.length === 0) return MOCK_SAFEGUARD;

      return {
        suppressed: data[0].suppressed,
        visible: data[0].visible,
        share_suppressed: Number(data[0].share_suppressed),
        threshold: data[0].threshold,
      } as SafeguardData;
    },
    staleTime: CACHE_TIME,
    gcTime: CACHE_TIME,
    refetchInterval: CACHE_TIME,
  });
}

// CCI (Diffusion Index) Types
interface CCIData {
  cci: number;
  p_better: number;
  p_same: number;
  p_worse: number;
  total_n: number;
  sat_mean: number;
  exh_mean: number;
  cci_change_1d: number | null;
  last_updated: string;
}

interface CCISparklinePoint {
  day: string;
  cci: number;
  n: number;
}

// Get CCI aggregate (diffusion index 0-100, 50 = neutral)
export function useCCI(daysBack = 7) {
  return useQuery({
    queryKey: ["cci", daysBack],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_cci_aggregate", {
        days_back: daysBack,
      });

      if (error) throw error;
      if (!data || data.length === 0) return MOCK_CCI;

      return {
        cci: Number(data[0].cci),
        p_better: Number(data[0].p_better),
        p_same: Number(data[0].p_same),
        p_worse: Number(data[0].p_worse),
        total_n: data[0].total_n,
        sat_mean: Number(data[0].sat_mean),
        exh_mean: Number(data[0].exh_mean),
        cci_change_1d: data[0].cci_change_1d ? Number(data[0].cci_change_1d) : null,
        last_updated: data[0].last_updated,
      } as CCIData;
    },
    staleTime: CACHE_TIME,
    gcTime: CACHE_TIME,
    refetchInterval: CACHE_TIME,
  });
}

// Get CCI daily trend for sparkline
export function useCCISparkline(days = 14) {
  return useQuery({
    queryKey: ["cciSparkline", days],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_cci_daily_trend", {
        days,
      });

      if (error) throw error;
      if (!data || data.length === 0) return MOCK_CCI_SPARKLINE;

      return data.map((row) => ({
        day: row.day,
        cci: Number(row.cci),
        n: row.n,
      })) as CCISparklinePoint[];
    },
    staleTime: CACHE_TIME,
    gcTime: CACHE_TIME,
    refetchInterval: CACHE_TIME,
  });
}
