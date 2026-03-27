import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Globe, Loader2, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface UrlInputProps {
  onSubmit: (url: string) => Promise<void>;
  isProcessing: boolean;
  uploadProgress: number;
  disabled?: boolean;
}

export const UrlInput = ({ onSubmit, isProcessing, uploadProgress, disabled }: UrlInputProps) => {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  const validateUrl = (value: string): boolean => {
    if (!value.trim()) {
      setError("Please enter a URL");
      return false;
    }
    try {
      const formatted = value.startsWith("http") ? value : `https://${value}`;
      new URL(formatted);
      setError("");
      return true;
    } catch {
      setError("Please enter a valid URL");
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateUrl(url) || disabled) return;
    await onSubmit(url.trim());
  };

  const getStatusText = () => {
    if (uploadProgress >= 100) return "Project created!";
    if (uploadProgress >= 70) return "Creating project...";
    if (uploadProgress >= 30) return "Scraping page content...";
    if (isProcessing) return "Starting...";
    return "";
  };

  const isDone = uploadProgress >= 100;

  return (
    <Card className={`border-2 border-dashed ${disabled ? "opacity-50" : "border-muted-foreground/25"}`}>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="rounded-full bg-muted p-3">
              {isDone ? (
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              ) : (
                <Globe className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium">Paste RFP URL</p>
              <p className="text-xs text-muted-foreground mt-1">
                Enter the URL of an RFP web page to scrape its content
              </p>
            </div>
          </div>

          <Input
            type="url"
            placeholder="https://example.gov/rfp/12345"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (error) setError("");
            }}
            disabled={isProcessing || disabled}
          />
          {error && <p className="text-xs text-destructive">{error}</p>}

          {isProcessing && (
            <div className="space-y-2">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">{getStatusText()}</p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isProcessing || disabled || !url.trim()}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {getStatusText()}
              </>
            ) : (
              <>
                <Globe className="h-4 w-4 mr-2" />
                Fetch & Create Project
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
