
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const INDUSTRIES = [
  { id: "technology", name: "Technology & Software" },
  { id: "healthcare", name: "Healthcare & Medicine" },
  { id: "finance", name: "Finance & Banking" },
  { id: "education", name: "Education & Training" },
  { id: "retail", name: "Retail & E-Commerce" },
  { id: "manufacturing", name: "Manufacturing & Industrial" },
  { id: "consulting", name: "Consulting Services" },
  { id: "real_estate", name: "Real Estate" },
  { id: "construction", name: "Construction & Engineering" },
  { id: "government", name: "Government" },
  { id: "non_profit", name: "Non-Profit" },
  { id: "other", name: "Other Industry" }
];

interface IndustryProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

export function IndustryProfileDialog({ open, onOpenChange, onComplete }: IndustryProfileDialogProps) {
  const { session } = useAuth();
  const [industry, setIndustry] = useState("");
  const [customIndustry, setCustomIndustry] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const saveIndustryProfile = async () => {
    if ((!industry || (industry === "other" && !customIndustry)) || !session?.user?.id) {
      toast.error("Please select or enter an industry");
      return;
    }

    setIsSaving(true);
    try {
      // Update the user's profile with their industry
      const industryValue = industry === "other" ? customIndustry : industry;
      
      const { error } = await supabase
        .from('profiles')
        .update({ industry: industryValue as any })
        .eq('profile_id', session.user.id);

      if (error) throw error;

      toast.success("Industry profile saved successfully");
      onComplete();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving industry profile:", error);
      toast.error("Failed to save industry profile");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Set Your Industry Profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Setting your industry helps us provide more relevant AI-generated content for your knowledge base.
          </p>
          <div className="space-y-2">
            <Label htmlFor="industry">Your Industry</Label>
            <Select
              value={industry}
              onValueChange={setIndustry}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select your industry" />
              </SelectTrigger>
              <SelectContent position="popper" className="max-h-[240px]">
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
              />
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Skip for now
          </Button>
          <Button 
            onClick={saveIndustryProfile} 
            disabled={!industry || (industry === 'other' && !customIndustry) || isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              "Save Profile"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
