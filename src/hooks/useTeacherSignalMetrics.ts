import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const CACHE_TIME_MS = 15_000;

export interface TeacherSignalMilestone {
  percentage: number;
  label: string;
  hit: boolean;
  shareCopy: string;
}

export interface TeacherSignalDailyCount {
  date: string;
  count: number | null;
  weekTotal?: number | null;
}

export interface TeacherSignalStreak {
  currentDays: number;
  longestDays: number;
  lastBreak: string | null;
}

export interface TeacherSignalMetrics {
  total_stories: number;
  division_coverage_pct: number;
  goal_target: number;
  coverage_goal_pct: number;
  progress_pct: number;
  milestones: TeacherSignalMilestone[];
  daily_counts: TeacherSignalDailyCount[];
  streak_summary: TeacherSignalStreak;
  last_updated: string;
}

const DEFAULT_STREAK = {
  currentDays: 0,
  longestDays: 0,
  lastBreak: null,
};

function normalizeMilestones(raw: unknown): TeacherSignalMilestone[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;

      const asRecord = entry as Record<string, unknown>;
      return {
        percentage: Number(asRecord.percentage ?? 0),
        label: String(asRecord.label ?? `${asRecord.percentage ?? 0}% of goal`),
        hit: Boolean(asRecord.hit),
        shareCopy: String(asRecord.shareCopy ?? ""),
      };
    })
    .filter((item): item is TeacherSignalMilestone => item !== null);
}

function normalizeDailyCounts(raw: unknown): TeacherSignalDailyCount[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;

      const asRecord = entry as Record<string, unknown>;
      const rawCount = asRecord.count;

      return {
        date: String(asRecord.date ?? ""),
        count: rawCount === null || rawCount === undefined ? null : Number(rawCount),
        weekTotal:
          asRecord.weekTotal === null || asRecord.weekTotal === undefined
            ? null
            : Number(asRecord.weekTotal),
      };
    })
    .filter((item) => {
      return item !== null && item.date.length > 0;
    }) as TeacherSignalDailyCount[];
}

function normalizeStreak(raw: unknown): TeacherSignalStreak {
  if (!raw || typeof raw !== "object") {
    return DEFAULT_STREAK;
  }

  const asRecord = raw as Record<string, unknown>;
  return {
    currentDays: Number(asRecord.currentDays ?? 0),
    longestDays: Number(asRecord.longestDays ?? 0),
    lastBreak: asRecord.lastBreak ? String(asRecord.lastBreak) : null,
  };
}

function parseMetrics(raw: Record<string, unknown>): TeacherSignalMetrics {
  return {
    total_stories: Number(raw.total_stories ?? 0),
    division_coverage_pct: Number(raw.division_coverage_pct ?? 0),
    goal_target: Number(raw.goal_target ?? 0),
    coverage_goal_pct: Number(raw.coverage_goal_pct ?? 0),
    progress_pct: Number(raw.progress_pct ?? 0),
    milestones: normalizeMilestones(raw.milestones),
    daily_counts: normalizeDailyCounts(raw.daily_counts),
    streak_summary: normalizeStreak(raw.streak_summary),
    last_updated: String(raw.last_updated ?? new Date().toISOString()),
  };
}

export function useTeacherSignalMetrics() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: ["teacherSignalMetrics"] });
    };

    const channel = supabase
      .channel("teachers-signal-metrics")
      .on(
        "postgres_changes",
        {
          schema: "public",
          table: "stories",
          event: "INSERT",
          filter: "approved=eq.true",
        },
        invalidate
      )
      .on(
        "postgres_changes",
        {
          schema: "public",
          table: "stories",
          event: "UPDATE",
          filter: "approved=eq.true",
        },
        invalidate
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery<TeacherSignalMetrics | null>({
    queryKey: ["teacherSignalMetrics"],
    queryFn: async () => {
      const { data, error } = await (supabase.rpc as any)("get_teachers_signal_metrics");
      if (error) throw error;

      if (!data || (Array.isArray(data) && data.length === 0)) {
        return null;
      }

      const record = Array.isArray(data) ? data[0] : data;
      return parseMetrics(record as Record<string, unknown>);
    },
    staleTime: CACHE_TIME_MS,
    gcTime: CACHE_TIME_MS,
    refetchInterval: CACHE_TIME_MS,
  });
}
