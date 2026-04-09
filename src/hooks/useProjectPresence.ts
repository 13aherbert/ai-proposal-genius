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
const PRESENCE_DEBOUNCE_MS = 2_000;

export function useProjectPresence(projectId: string) {
  const { session } = useAuth();
  const [presenceUsers, setPresenceUsers] = useState<PresenceUser[]>([]);
  const currentSectionRef = useRef<string | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval>>();
  const lastUpsertRef = useRef<number>(0);
  const pendingUpsertRef = useRef<ReturnType<typeof setTimeout>>();
  const isVisibleRef = useRef(!document.hidden);

  const userId = session?.user?.id;

  // Debounced upsert to avoid rapid presence updates
  const upsertPresence = useCallback(
    async (sectionId: string | null, action: string) => {
      if (!userId || !isVisibleRef.current) return;

      const now = Date.now();
      const elapsed = now - lastUpsertRef.current;

      const doUpsert = async () => {
        lastUpsertRef.current = Date.now();
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
      };

      if (elapsed >= PRESENCE_DEBOUNCE_MS) {
        clearTimeout(pendingUpsertRef.current);
        await doUpsert();
      } else {
        // Debounce: schedule for later
        clearTimeout(pendingUpsertRef.current);
        pendingUpsertRef.current = setTimeout(doUpsert, PRESENCE_DEBOUNCE_MS - elapsed);
      }
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

  const fetchPresence = useCallback(async () => {
    if (!isVisibleRef.current) return;
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

    // Visibility change: pause/resume presence
    const handleVisibility = () => {
      isVisibleRef.current = !document.hidden;
      if (document.hidden) {
        // Tab hidden — stop heartbeat and remove presence
        clearInterval(heartbeatRef.current);
        clearTimeout(pendingUpsertRef.current);
        removePresence();
      } else {
        // Tab visible — re-establish presence and heartbeat
        upsertPresence(currentSectionRef.current, currentSectionRef.current ? "editing" : "viewing");
        fetchPresence();
        heartbeatRef.current = setInterval(() => {
          upsertPresence(currentSectionRef.current, currentSectionRef.current ? "editing" : "viewing");
          fetchPresence();
        }, HEARTBEAT_INTERVAL);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

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
      clearTimeout(pendingUpsertRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
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
