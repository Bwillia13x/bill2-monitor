import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { moderateContent } from "@/lib/moderation";
import { meetsThreshold } from "@/lib/gating";

export function useOneLinerCount() {
  return useQuery({
    queryKey: ["oneLinerCount"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_approved_one_liners_count");
      if (error) throw error;
      return data as number;
    },
  });
}

export function useOneLiners(limit = 100) {
  const { data: count } = useOneLinerCount();
  
  return useQuery({
    queryKey: ["oneLiners", limit],
    queryFn: async () => {
      // Check gating first
      if (!count || !meetsThreshold(count)) {
        return [];
      }
      
      const { data, error } = await supabase
        .from("one_liners")
        .select("*")
        .eq("approved", true)
        .order("created_at", { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!count && meetsThreshold(count),
  });
}

export function useSubmitOneLiner() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ text, tags }: { text: string; tags: string[] }) => {
      if (!user) throw new Error("Must be logged in");
      
      // Client-side moderation
      const modResult = moderateContent(text);
      if (modResult.blocked) {
        throw new Error(modResult.reason || "Content blocked");
      }
      
      const { data, error } = await supabase
        .from("one_liners")
        .insert({
          user_id: user.id,
          text: modResult.clean,
          tags,
        })
        .select()
        .single();

      if (error) {
        if (error.code === "23514") {
          throw new Error("Text must be 120 characters or less");
        }
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["oneLiners"] });
      queryClient.invalidateQueries({ queryKey: ["oneLinerCount"] });
      toast.success("Voice submitted for review");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useStories(limit = 50) {
  const { data: count } = useQuery({
    queryKey: ["storiesCount"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_approved_stories_count");
      if (error) throw error;
      return data as number;
    },
  });
  
  return useQuery({
    queryKey: ["stories", limit],
    queryFn: async () => {
      if (!count || !meetsThreshold(count)) {
        return [];
      }
      
      const { data, error } = await supabase
        .from("stories")
        .select("*")
        .eq("approved", true)
        .order("created_at", { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!count && meetsThreshold(count),
  });
}

export function useSubmitStory() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ text, tags }: { text: string; tags: string[] }) => {
      if (!user) throw new Error("Must be logged in");
      
      const modResult = moderateContent(text);
      if (modResult.blocked) {
        throw new Error(modResult.reason || "Content blocked");
      }
      
      const { data, error } = await supabase
        .from("stories")
        .insert({
          user_id: user.id,
          text: modResult.clean,
          tags,
        })
        .select()
        .single();

      if (error) {
        if (error.code === "23514") {
          throw new Error("Text must be 700 characters or less");
        }
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stories"] });
      queryClient.invalidateQueries({ queryKey: ["storiesCount"] });
      toast.success("Story submitted for review");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
