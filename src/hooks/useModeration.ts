import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { scanStory, type StoryScanResult } from "@/lib/moderation";

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
  scan_result: StoryScanResult;
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
      const { data, error } = await supabase
        .from('moderation_queue')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ModerationQueueItem[];
    },
  });
}

export function useScanContent() {
  return useMutation({
    mutationFn: async (text: string) => {
      return scanStory(text);
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
      // First scan the content
      const scanResult = await scanStory(contentText);
      
      // Determine status based on scan result
      let status: 'pending' | 'approved' | 'rejected' = 'pending';
      if (scanResult.moderationAction === 'auto_approve') {
        status = 'approved';
      } else if (scanResult.moderationAction === 'auto_reject') {
        status = 'rejected';
      }

      // Insert into moderation queue
      const { data, error } = await supabase
        .from('moderation_queue')
        .insert({
          content_type: contentType,
          content_id: contentId,
          content_text: contentText,
          user_id: userId,
          risk_score: scanResult.riskScore,
          flags: scanResult.flags,
          status,
          scan_result: scanResult,
          content_metadata: metadata,
        })
        .select()
        .single();

      if (error) throw error;

      // If auto-approved, update the original content
      if (status === 'approved') {
        await autoApproveContent(contentType, contentId);
      }

      return data;
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
      const { data: queueItem, error: fetchError } = await supabase
        .from('moderation_queue')
        .select('*')
        .eq('id', queueItemId)
        .single();

      if (fetchError) throw fetchError;
      if (!queueItem) throw new Error('Queue item not found');

      // Update moderation queue status
      const { error: updateError } = await supabase
        .from('moderation_queue')
        .update({
          status: action === 'approve' ? 'approved' : 'rejected',
          reviewed_at: new Date().toISOString(),
          review_reason: reason,
        })
        .eq('id', queueItemId);

      if (updateError) throw updateError;

      // Update the actual content based on action
      if (action === 'approve') {
        await autoApproveContent(queueItem.content_type, queueItem.content_id);
      } else {
        await autoRejectContent(queueItem.content_type, queueItem.content_id, reason);
      }

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

async function autoApproveContent(contentType: string, contentId: string) {
  let tableName = '';
  switch (contentType) {
    case 'story':
      tableName = 'stories';
      break;
    case 'story_video':
      tableName = 'story_videos';
      break;
    case 'one_liner':
      tableName = 'one_liners';
      break;
    default:
      throw new Error(`Unknown content type: ${contentType}`);
  }

  const { error } = await supabase
    .from(tableName)
    .update({ approved: true })
    .eq('id', contentId);

  if (error) throw error;
}

async function autoRejectContent(contentType: string, contentId: string, reason?: string) {
  // For rejected content, we could either delete it or mark it as rejected
  // For now, we'll just leave it unapproved (approved = false or null)
  console.log(`Content ${contentId} of type ${contentType} rejected${reason ? `: ${reason}` : ''}`);
}

export function useModerationStats() {
  return useQuery({
    queryKey: ["moderationStats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_moderation_stats');
      if (error) throw error;
      return data;
    },
  });
}