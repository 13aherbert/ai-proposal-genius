import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CalendarClock, CheckCircle, Clock, Settings2, RotateCcw } from "lucide-react";
import { ReviewCycle } from "./useKBGovernance";
import { enhancedKnowledgeCategories } from "../data/categories";
import { relativeTime } from "@/utils/relativeTime";

interface ReviewCycleManagerProps {
  reviewCycles: ReviewCycle[];
  onUpsertCycle: (category: string, frequencyDays: number, assignedTo?: string | null) => Promise<void>;
  onMarkReviewed: (category: string, notes?: string) => Promise<void>;
}

export function ReviewCycleManager({ reviewCycles, onUpsertCycle, onMarkReviewed }: ReviewCycleManagerProps) {
  const [configOpen, setConfigOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [frequency, setFrequency] = useState("90");
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewingCategory, setReviewingCategory] = useState<string | null>(null);

  const allCategories = enhancedKnowledgeCategories.map(c => ({
    name: c.name,
    slug: c.name.toLowerCase().replace(/\s+/g, "-"),
  }));

  const getCycleForCategory = (slug: string) => reviewCycles.find(c => c.category === slug);

  const isDueForReview = (cycle: ReviewCycle) => {
    if (!cycle.next_review_at) return true;
    return new Date(cycle.next_review_at) <= new Date();
  };

  const handleSaveCycle = async () => {
    if (!selectedCategory) return;
    await onUpsertCycle(selectedCategory, parseInt(frequency));
    setConfigOpen(false);
    setSelectedCategory("");
  };

  const handleMarkReviewed = async (category: string) => {
    await onMarkReviewed(category, reviewNotes || undefined);
    setReviewingCategory(null);
    setReviewNotes("");
  };

  const dueCount = reviewCycles.filter(isDueForReview).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-primary" />
            Review Cycles
            {dueCount > 0 && (
              <Badge variant="destructive" className="ml-1">{dueCount} due</Badge>
            )}
          </CardTitle>
          <Dialog open={configOpen} onOpenChange={setConfigOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings2 className="h-4 w-4 mr-1" />
                Configure
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Configure Review Cycle</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {allCategories.map(cat => (
                        <SelectItem key={cat.slug} value={cat.slug}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Review Frequency</Label>
                  <Select value={frequency} onValueChange={setFrequency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">Every 30 days</SelectItem>
                      <SelectItem value="60">Every 60 days</SelectItem>
                      <SelectItem value="90">Every 90 days</SelectItem>
                      <SelectItem value="180">Every 180 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleSaveCycle} className="w-full" disabled={!selectedCategory}>
                  Save Review Cycle
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {reviewCycles.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <CalendarClock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No review cycles configured yet.</p>
            <p className="text-xs">Click "Configure" to set up review schedules for your categories.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {reviewCycles.map(cycle => {
              const due = isDueForReview(cycle);
              const lastReviewed = cycle.last_reviewed_at
                ? relativeTime(cycle.last_reviewed_at)
                : null;

              return (
                <div
                  key={cycle.id}
                  className={`flex items-center justify-between p-2.5 rounded-md border ${
                    due ? "border-amber-300 bg-amber-50 dark:bg-amber-950/20" : "border-border"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate flex items-center gap-1.5">
                      {due ? (
                        <Clock className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
                      ) : (
                        <CheckCircle className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                      )}
                      {cycle.category}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Every {cycle.review_frequency_days} days
                      {lastReviewed && ` · Last reviewed ${lastReviewed.prefix} ${lastReviewed.label}`}
                    </div>
                  </div>
                  {due && (
                    <Dialog open={reviewingCategory === cycle.category} onOpenChange={(o) => !o && setReviewingCategory(null)}>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-shrink-0 text-xs"
                          onClick={() => setReviewingCategory(cycle.category)}
                        >
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Review
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Mark "{cycle.category}" as Reviewed</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Review Notes (optional)</Label>
                            <Textarea
                              value={reviewNotes}
                              onChange={(e) => setReviewNotes(e.target.value)}
                              placeholder="What was updated or confirmed..."
                              className="min-h-[80px]"
                            />
                          </div>
                          <Button onClick={() => handleMarkReviewed(cycle.category)} className="w-full">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Mark as Reviewed
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
