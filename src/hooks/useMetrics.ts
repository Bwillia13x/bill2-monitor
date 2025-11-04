import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const DEFAULT_CAMPAIGN_KEY = "no_notwithstanding";
const CACHE_TIME = 10 * 60 * 1000; // 10 minutes

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

      // Calculate 7-day averages
      const last7 = series.slice(-7);
      const prev7 = series.slice(-14, -7);

      const last7Avg = last7.length
        ? last7.reduce((sum, d) => sum + d.count, 0) / last7.length
        : 0;
      const prev7Avg = prev7.length
        ? prev7.reduce((sum, d) => sum + d.count, 0) / prev7.length
        : 0;

      const delta =
        prev7Avg > 0 ? ((last7Avg - prev7Avg) / prev7Avg) * 100 : 0;

      return { series, last7Avg, prev7Avg, delta } as VelocityStats;
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
      if (!data || data.length === 0) return null;

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
      if (!pollId) return null;

      const { data, error } = await supabase.rpc("get_poll_distribution", {
        _poll_id: pollId,
      });

      if (error) throw error;
      if (!data || data.length === 0) return null;

      const distribution: PollDistribution[] = data.map((row) => ({
        score: row.score,
        count: row.count,
        total: row.total,
        percentage: row.total > 0 ? (row.count / row.total) * 100 : 0,
      }));

      return distribution;
    },
    enabled: !!pollId,
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
      if (!data || data.length === 0) return null;

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
