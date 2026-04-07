import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { HelpCircle, Plus, Trash2, Tag, Search } from "lucide-react";
import { QAPair } from "./useKBGovernance";
import { enhancedKnowledgeCategories } from "../data/categories";

interface QAPairManagerProps {
  qaPairs: QAPair[];
  onAdd: (category: string, question: string, answer: string, tags?: string[]) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  selectedCategory?: string | null;
}

export function QAPairManager({ qaPairs, onAdd, onDelete, selectedCategory }: QAPairManagerProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [category, setCategory] = useState(selectedCategory || "");
  const [tagsInput, setTagsInput] = useState("");
  const [searchFilter, setSearchFilter] = useState("");

  const allCategories = enhancedKnowledgeCategories.map(c => ({
    name: c.name,
    slug: c.name.toLowerCase().replace(/\s+/g, "-"),
  }));

  const filteredPairs = qaPairs.filter(qa => {
    const matchesCategory = !selectedCategory || qa.category === selectedCategory.toLowerCase().replace(/\s+/g, "-");
    const matchesSearch = !searchFilter || 
      qa.question.toLowerCase().includes(searchFilter.toLowerCase()) ||
      qa.answer.toLowerCase().includes(searchFilter.toLowerCase()) ||
      qa.tags.some(t => t.toLowerCase().includes(searchFilter.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleAdd = async () => {
    if (!category || !question.trim() || !answer.trim()) return;
    const tags = tagsInput.split(",").map(t => t.trim()).filter(Boolean);
    await onAdd(category, question.trim(), answer.trim(), tags);
    setQuestion("");
    setAnswer("");
    setTagsInput("");
    setAddOpen(false);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            Q&A Pairs
            <Badge variant="secondary" className="text-xs">{filteredPairs.length}</Badge>
          </CardTitle>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Q&A
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add Q&A Pair</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={setCategory}>
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
                  <Label>Question</Label>
                  <Input
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="e.g., What is your company's founding year?"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Answer</Label>
                  <Textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="The full answer to be used in proposals..."
                    className="min-h-[100px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tags (comma-separated)</Label>
                  <Input
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="e.g., founding, history, company"
                  />
                </div>
                <Button
                  onClick={handleAdd}
                  className="w-full"
                  disabled={!category || !question.trim() || !answer.trim()}
                >
                  Add Q&A Pair
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {qaPairs.length > 3 && (
          <div className="relative mb-3">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Filter Q&A pairs..."
              className="pl-8 h-9 text-sm"
            />
          </div>
        )}

        {filteredPairs.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <HelpCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No Q&A pairs yet.</p>
            <p className="text-xs">Add structured question-answer pairs for better AI matching.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {filteredPairs.map(qa => (
              <div key={qa.id} className="border rounded-md p-3 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="text-sm font-medium flex items-start gap-1">
                      <span className="text-primary font-bold flex-shrink-0">Q:</span>
                      {qa.question}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1 flex items-start gap-1">
                      <span className="text-green-600 font-bold flex-shrink-0">A:</span>
                      <span className="line-clamp-3">{qa.answer}</span>
                    </div>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0">
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Q&A Pair?</AlertDialogTitle>
                        <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete(qa.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
                {qa.tags.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap">
                    <Tag className="h-3 w-3 text-muted-foreground" />
                    {qa.tags.map((tag, i) => (
                      <Badge key={i} variant="outline" className="text-[10px] px-1.5 py-0">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
