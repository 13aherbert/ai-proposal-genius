import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "sonner";

export interface ProposalComment {
  id: string;
  project_id: string;
  section_id: string;
  parent_id: string | null;
  user_id: string;
  content: string;
  quoted_text: string | null;
  highlight_from: number | null;
  highlight_to: number | null;
  is_resolved: boolean;
  resolved_by: string | null;
  resolved_at: string | null;
  mentions: string[];
  created_at: string;
  updated_at: string;
  // Joined profile data
  author_name?: string;
  author_avatar?: string;
  replies?: ProposalComment[];
}

export function useProposalComments(projectId: string) {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  const queryKey = ["proposal-comments", projectId];

  const { data: rawComments = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("proposal_comments")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Fetch profiles for all unique user IDs
      const userIds = [...new Set((data || []).map((c: any) => c.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("profile_id, first_name, last_name, avatar_url, username")
        .in("profile_id", userIds);

      const profileMap = new Map(
        (profiles || []).map((p: any) => [
          p.profile_id,
          {
            name: [p.first_name, p.last_name].filter(Boolean).join(" ") || p.username || "Unknown",
            avatar: p.avatar_url,
          },
        ])
      );

      return (data || []).map((c: any) => ({
        ...c,
        mentions: c.mentions || [],
        author_name: profileMap.get(c.user_id)?.name || "Unknown",
        author_avatar: profileMap.get(c.user_id)?.avatar || null,
      })) as ProposalComment[];
    },
    enabled: !!projectId,
  });

  // Organize into threads
  const comments = rawComments.filter((c) => !c.parent_id);
  const repliesMap = new Map<string, ProposalComment[]>();
  rawComments
    .filter((c) => c.parent_id)
    .forEach((reply) => {
      const existing = repliesMap.get(reply.parent_id!) || [];
      existing.push(reply);
      repliesMap.set(reply.parent_id!, existing);
    });

  const threaded = comments.map((c) => ({
    ...c,
    replies: repliesMap.get(c.id) || [],
  }));

  const addComment = useMutation({
    mutationFn: async (params: {
      sectionId: string;
      content: string;
      quotedText?: string;
      highlightFrom?: number;
      highlightTo?: number;
      parentId?: string;
      mentions?: string[];
    }) => {
      if (!session?.user?.id) throw new Error("Not authenticated");
      const { error } = await supabase.from("proposal_comments").insert({
        project_id: projectId,
        section_id: params.sectionId,
        parent_id: params.parentId || null,
        user_id: session.user.id,
        content: params.content,
        quoted_text: params.quotedText || null,
        highlight_from: params.highlightFrom ?? null,
        highlight_to: params.highlightTo ?? null,
        mentions: params.mentions || [],
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to add comment");
    },
  });

  const resolveComment = useMutation({
    mutationFn: async (params: { commentId: string; resolve: boolean }) => {
      if (!session?.user?.id) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("proposal_comments")
        .update({
          is_resolved: params.resolve,
          resolved_by: params.resolve ? session.user.id : null,
          resolved_at: params.resolve ? new Date().toISOString() : null,
        })
        .eq("id", params.commentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update comment");
    },
  });

  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from("proposal_comments")
        .delete()
        .eq("id", commentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Comment deleted");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to delete comment");
    },
  });

  const editComment = useMutation({
    mutationFn: async (params: { commentId: string; content: string }) => {
      const { error } = await supabase
        .from("proposal_comments")
        .update({ content: params.content, updated_at: new Date().toISOString() })
        .eq("id", params.commentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to edit comment");
    },
  });

  return {
    comments: threaded,
    allComments: rawComments,
    isLoading,
    addComment: addComment.mutate,
    resolveComment: resolveComment.mutate,
    deleteComment: deleteComment.mutate,
    editComment: editComment.mutate,
    isAdding: addComment.isPending,
  };
}
