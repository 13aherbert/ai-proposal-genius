import { createContext, useContext, useCallback, useRef, useState } from "react";

interface AnnouncerContextType {
  announce: (message: string, priority?: "polite" | "assertive") => void;
}

const AnnouncerContext = createContext<AnnouncerContextType>({
  announce: () => {},
});

export function useAnnounce() {
  return useContext(AnnouncerContext);
}

export function AriaLiveAnnouncer({ children }: { children: React.ReactNode }) {
  const [politeMessage, setPoliteMessage] = useState("");
  const [assertiveMessage, setAssertiveMessage] = useState("");
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const announce = useCallback((message: string, priority: "polite" | "assertive" = "polite") => {
    // Clear then set to force screen reader re-announcement
    if (priority === "assertive") {
      setAssertiveMessage("");
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setAssertiveMessage(message), 50);
    } else {
      setPoliteMessage("");
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setPoliteMessage(message), 50);
    }
  }, []);

  return (
    <AnnouncerContext.Provider value={{ announce }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        role="status"
        className="sr-only"
      >
        {politeMessage}
      </div>
      <div
        aria-live="assertive"
        aria-atomic="true"
        role="alert"
        className="sr-only"
      >
        {assertiveMessage}
      </div>
    </AnnouncerContext.Provider>
  );
}
