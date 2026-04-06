import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";

export interface PresenceUser {
  user_id: string;
  section_id: string | null;
  action: string;
  last_seen: string;
}

const HEARTBEAT_INTERVAL = 30_000;
const STALE_THRESHOLD = 60_000;

export function useProjectPresence(projectId: string) {
  const { session } = useAuth();
  const [presenceUsers, setPresenceUsers] = useState<PresenceUser[]>([]);
  const currentSectionRef = useRef<string | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval>>();

  const userId = session?.user?.id;

  const upsertPresence = useCallback(
    async (sectionId: string | null, action: string) => {
      if (!userId) return;
      await supabase.from("project_presence").upsert(
        {
          project_id: projectId,
          user_id: userId,
          section_id: sectionId,
          action,
          last_seen: new Date().toISOString(),
        },
        { onConflict: "project_id,user_id" }
      );
    },
    [projectId, userId]
  );

  const setEditingSection = useCallback(
    (sectionId: string | null) => {
      currentSectionRef.current = sectionId;
      upsertPresence(sectionId, sectionId ? "editing" : "viewing");
    },
    [upsertPresence]
  );

  const removePresence = useCallback(async () => {
    if (!userId) return;
    await supabase
      .from("project_presence")
      .delete()
      .eq("project_id", projectId)
      .eq("user_id", userId);
  }, [projectId, userId]);

  // Fetch current presence
  const fetchPresence = useCallback(async () => {
    const cutoff = new Date(Date.now() - STALE_THRESHOLD).toISOString();
    const { data } = await supabase
      .from("project_presence")
      .select("user_id, section_id, action, last_seen")
      .eq("project_id", projectId)
      .gte("last_seen", cutoff);
    if (data) {
      setPresenceUsers(data.filter((p) => p.user_id !== userId));
    }
  }, [projectId, userId]);

  useEffect(() => {
    if (!userId) return;

    // Initial presence
    upsertPresence(null, "viewing");
    fetchPresence();

    // Heartbeat
    heartbeatRef.current = setInterval(() => {
      upsertPresence(currentSectionRef.current, currentSectionRef.current ? "editing" : "viewing");
      fetchPresence();
    }, HEARTBEAT_INTERVAL);

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`presence-${projectId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "project_presence", filter: `project_id=eq.${projectId}` },
        () => {
          fetchPresence();
        }
      )
      .subscribe();

    // Cleanup on unmount / page leave
    const handleBeforeUnload = () => {
      navigator.sendBeacon?.(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/project_presence?project_id=eq.${projectId}&user_id=eq.${userId}`,
        ""
      );
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearInterval(heartbeatRef.current);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      supabase.removeChannel(channel);
      removePresence();
    };
  }, [projectId, userId]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    presenceUsers,
    setEditingSection,
  };
}
