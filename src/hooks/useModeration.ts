// Moderation hooks - temporarily stubbed (tables not yet created)
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface ModerationQueueItem {
  id: string;
  content_type: 'story' | 'story_video' | 'one_liner';
  content_id: string;
  content_text: string;
  user_id: string;
  created_at: string;
  risk_score: number;
  flags: string[];
  status: 'pending' | 'approved' | 'rejected';
  content_metadata?: {
    district?: string;
    role?: string;
    title?: string;
    duration_seconds?: number;
  };
}

export function useModerationQueue(status: 'pending' | 'approved' | 'rejected' = 'pending') {
  return useQuery({
    queryKey: ["moderationQueue", status],
    queryFn: async () => {
      // Stub: return empty array
      return [] as ModerationQueueItem[];
    },
  });
}

export function useScanContent() {
  return useMutation({
    mutationFn: async (text: string) => {
      // Stub: return safe result
      return {
        riskScore: 0,
        flags: [],
        moderationAction: 'auto_approve' as const,
      };
    },
  });
}

export function useSubmitForModeration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      contentType,
      contentId,
      contentText,
      userId,
      metadata = {},
    }: {
      contentType: 'story' | 'story_video' | 'one_liner';
      contentId: string;
      contentText: string;
      userId: string;
      metadata?: Record<string, any>;
    }) => {
      // Stub: just return success
      return { id: contentId, status: 'approved' };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["moderationQueue"] });
      toast.success("Content submitted for moderation");
    },
    onError: (error: Error) => {
      toast.error(`Failed to submit for moderation: ${error.message}`);
    },
  });
}

export function useModerationAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      queueItemId,
      action,
      reason,
    }: {
      queueItemId: string;
      action: 'approve' | 'reject';
      reason?: string;
    }) => {
      // Stub: just return success
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["moderationQueue"] });
      toast.success("Moderation action applied successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to apply moderation action: ${error.message}`);
    },
  });
}

export function useModerationStats() {
  return useQuery({
    queryKey: ["moderationStats"],
    queryFn: async () => {
      // Stub: return empty stats
      return {
        pending: 0,
        approved: 0,
        rejected: 0,
      };
    },
  });
}
