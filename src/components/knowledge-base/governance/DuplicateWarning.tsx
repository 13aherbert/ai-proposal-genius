import { useState, useEffect, useCallback } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X } from "lucide-react";
import { debounce } from "lodash";

interface DuplicateWarningProps {
  title: string;
  content: string;
  category: string;
  checkDuplicates: (title: string, content: string, category: string) => Promise<string[]>;
}

export function DuplicateWarning({ title, content, category, checkDuplicates }: DuplicateWarningProps) {
  const [duplicates, setDuplicates] = useState<string[]>([]);
  const [dismissed, setDismissed] = useState(false);

  const debouncedCheck = useCallback(
    debounce(async (t: string, c: string, cat: string) => {
      if (t.trim().length < 3) {
        setDuplicates([]);
        return;
      }
      const results = await checkDuplicates(t, c, cat);
      setDuplicates(results);
      setDismissed(false);
    }, 500),
    [checkDuplicates]
  );

  useEffect(() => {
    debouncedCheck(title, content, category);
    return () => debouncedCheck.cancel();
  }, [title, content, category, debouncedCheck]);

  if (duplicates.length === 0 || dismissed) return null;

  return (
    <Alert className="border-amber-300 bg-amber-50 dark:bg-amber-950/20">
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-sm font-medium text-amber-800 dark:text-amber-200 flex items-center justify-between">
        Similar entries found
        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setDismissed(true)}>
          <X className="h-3 w-3" />
        </Button>
      </AlertTitle>
      <AlertDescription className="text-xs text-amber-700 dark:text-amber-300">
        <ul className="list-disc pl-4 mt-1 space-y-0.5">
          {duplicates.map((d, i) => (
            <li key={i}>{d}</li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}
