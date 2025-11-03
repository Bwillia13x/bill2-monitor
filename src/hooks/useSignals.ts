import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useTodaySignal() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["todaySignal", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("signals")
        .select("*")
        .eq("user_id", user.id)
        .eq("signal_date", today)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useSubmitSignal() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (dissatisfactionLevel: number) => {
      if (!user) throw new Error("Must be logged in");

      const { data, error } = await supabase
        .from("signals")
        .insert({
          user_id: user.id,
          dissatisfaction_level: dissatisfactionLevel,
          signal_date: new Date().toISOString().split("T")[0],
        })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          throw new Error("You've already submitted a signal today");
        }
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todaySignal"] });
      queryClient.invalidateQueries({ queryKey: ["todayAggregate"] });
      toast.success("Signal submitted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useTodayAggregate() {
  return useQuery({
    queryKey: ["todayAggregate"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_today_aggregate");

      if (error) throw error;
      
      // Return null if no data (n<20) or empty result
      if (!data || data.length === 0) return null;
      
      return {
        avgDissatisfaction: Number(data[0].avg_dissatisfaction),
        totalSignals: data[0].total_signals,
      };
    },
    refetchInterval: 60000, // Refresh every minute
  });
}

export function useAggregateHistory() {
  return useQuery({
    queryKey: ["aggregateHistory"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_aggregate_dissatisfaction");

      if (error) throw error;
      
      return data.map((row) => ({
        date: row.signal_date,
        avgDissatisfaction: Number(row.avg_dissatisfaction),
        totalSignals: row.total_signals,
      }));
    },
    refetchInterval: 300000, // Refresh every 5 minutes
  });
}
