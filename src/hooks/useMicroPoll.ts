import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useTodayPoll() {
  return useQuery({
    queryKey: ["todayPoll"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("micro_polls")
        .select("*")
        .eq("poll_date", today)
        .eq("active", true)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });
}

export function useMyPollResponse(pollId: string | undefined) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["myPollResponse", pollId, user?.id],
    queryFn: async () => {
      if (!pollId || !user) return null;
      
      const { data, error } = await supabase
        .from("micro_poll_responses")
        .select("*")
        .eq("poll_id", pollId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!pollId && !!user,
  });
}

export function useSubmitPollResponse() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ pollId, response }: { pollId: string; response: number }) => {
      if (!user) throw new Error("Must be logged in");

      const { data, error } = await supabase
        .from("micro_poll_responses")
        .insert({
          poll_id: pollId,
          user_id: user.id,
          response,
        })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          throw new Error("You've already responded to this poll");
        }
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myPollResponse"] });
      queryClient.invalidateQueries({ queryKey: ["pollAggregate"] });
      toast.success("Response recorded. Aggregate only.");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function usePollAggregate(pollId: string | undefined) {
  return useQuery({
    queryKey: ["pollAggregate", pollId],
    queryFn: async () => {
      if (!pollId) return null;
      
      const { data, error } = await supabase.rpc("get_poll_aggregate", {
        poll_id_param: pollId,
      });

      if (error) throw error;
      
      if (!data || data.length === 0) return null;
      
      return {
        avgResponse: Number(data[0].avg_response),
        totalResponses: data[0].total_responses,
      };
    },
    enabled: !!pollId,
    refetchInterval: 60000,
  });
}
