import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const CAMPAIGN_KEY = "no_notwithstanding";

export function useCampaignSummary() {
  return useQuery({
    queryKey: ["campaignSummary", CAMPAIGN_KEY],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_campaign_summary", {
        c_key: CAMPAIGN_KEY,
      });

      if (error) throw error;
      
      if (!data || data.length === 0) return null;
      
      return {
        total: data[0].total || 0,
        today: data[0].today || 0,
        minShowN: data[0].min_show_n || 20,
        statement: data[0].statement || "",
      };
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useHasUserSigned() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["hasUserSigned", CAMPAIGN_KEY, user?.id],
    queryFn: async () => {
      if (!user) return false;
      
      const { data, error } = await supabase.rpc("has_user_signed", {
        c_key: CAMPAIGN_KEY,
      });

      if (error) throw error;
      return !!data;
    },
    enabled: !!user,
  });
}

export function useSignPledge() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ district, oneLiner }: { district?: string; oneLiner?: string }) => {
      if (!user) throw new Error("Must be logged in");

      // First get campaign ID
      const { data: campaigns, error: campaignError } = await supabase
        .from("campaigns")
        .select("id")
        .eq("key", CAMPAIGN_KEY)
        .eq("active", true)
        .single();

      if (campaignError || !campaigns) throw new Error("Campaign not found");

      // Insert signature
      const { data, error } = await supabase
        .from("pledge_signatures")
        .insert({
          campaign_id: campaigns.id,
          user_id: user.id,
          district: district || null,
          one_liner: oneLiner || null,
        })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          throw new Error("You've already signed this pledge");
        }
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaignSummary"] });
      queryClient.invalidateQueries({ queryKey: ["hasUserSigned"] });
      toast.success("Signature added successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useCampaignDistricts() {
  return useQuery({
    queryKey: ["campaignDistricts", CAMPAIGN_KEY],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_campaign_districts", {
        c_key: CAMPAIGN_KEY,
      });

      if (error) throw error;
      return data || [];
    },
  });
}
