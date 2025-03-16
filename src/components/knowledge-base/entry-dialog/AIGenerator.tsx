
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2 } from "lucide-react";
import { AIProgress } from "@/components/shared/AIProgress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const INDUSTRIES = [
  { id: "technology", name: "Technology & Software" },
  { id: "healthcare", name: "Healthcare & Medicine" },
  { id: "finance", name: "Finance & Banking" },
  { id: "education", name: "Education & Training" },
  { id: "retail", name: "Retail & E-Commerce" },
  { id: "manufacturing", name: "Manufacturing & Industrial" },
  { id: "legal", name: "Legal Services" },
  { id: "marketing", name: "Marketing & Advertising" },
  { id: "construction", name: "Construction & Engineering" },
  { id: "hospitality", name: "Hospitality & Tourism" },
  { id: "other", name: "Other Industry" }
];

export interface AIGeneratorProps {
  onGeneratedContent: (title: string, content: string) => void;
  category: string;
}

export function AIGenerator({ onGeneratedContent, category }: AIGeneratorProps) {
  const [topic, setTopic] = useState("");
  const [industry, setIndustry] = useState("");
  const [customIndustry, setCustomIndustry] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const generateContent = async () => {
    if (!topic || (!industry && !customIndustry)) {
      toast.error("Please enter a topic and select or enter an industry");
      return;
    }

    setIsGenerating(true);
    setProgress(10);
    
    try {
      // Create a progressive timer to simulate progress
      const progressTimer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressTimer);
            return 90;
          }
          return prev + 5;
        });
      }, 1000);

      const { data, error } = await supabase.functions.invoke('generate-knowledge-content', {
        body: {
          topic,
          industry: industry === 'other' ? customIndustry : industry,
          category,
          customPrompt: customPrompt || undefined
        }
      });

      clearInterval(progressTimer);

      if (error) {
        throw new Error(error.message);
      }

      setProgress(100);

      // Short delay to show 100% before completing
      setTimeout(() => {
        onGeneratedContent(topic, data.content);
        setIsGenerating(false);
        toast.success("Content generated successfully!");
      }, 500);
    } catch (error) {
      console.error("Error generating content:", error);
      toast.error("Failed to generate content. Please try again.");
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="topic">Topic of Content</Label>
        <Input
          id="topic"
          placeholder="e.g., Client Onboarding Process, Standard Operating Procedures, etc."
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          disabled={isGenerating}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="industry">Select Your Industry</Label>
        <Select
          value={industry}
          onValueChange={setIndustry}
          disabled={isGenerating}
        >
          <SelectTrigger>
            <SelectValue placeholder="Choose your industry" />
          </SelectTrigger>
          <SelectContent>
            {INDUSTRIES.map((ind) => (
              <SelectItem key={ind.id} value={ind.id}>
                {ind.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {industry === 'other' && (
        <div className="space-y-2">
          <Label htmlFor="custom-industry">Specify Your Industry</Label>
          <Input
            id="custom-industry"
            placeholder="Enter your industry"
            value={customIndustry}
            onChange={(e) => setCustomIndustry(e.target.value)}
            disabled={isGenerating}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="custom-prompt">Additional Instructions (Optional)</Label>
        <Textarea
          id="custom-prompt"
          placeholder="Provide any specific details or requirements for the generated content..."
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          className="min-h-[100px]"
          disabled={isGenerating}
        />
      </div>

      {isGenerating ? (
        <div className="space-y-4">
          <AIProgress progress={progress} label="Generating knowledge base content" />
          <Button disabled className="w-full">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </Button>
        </div>
      ) : (
        <Button 
          onClick={generateContent} 
          className="w-full"
          disabled={!topic || (!industry || (industry === 'other' && !customIndustry))}
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Generate Content
        </Button>
      )}
    </div>
  );
}
