import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, ArrowLeft, Upload, CheckCircle2, Loader2, Sparkles, FileText, Users, Building2, PartyPopper } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { useDropzone } from 'react-dropzone';
import { useQuickUpload } from '@/hooks/use-quick-upload';
import { useKnowledgeReadiness } from '@/hooks/use-knowledge-readiness';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

interface ProgressiveOnboardingProps {
  isOpen: boolean;
  currentStep: number;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  onComplete: () => void;
  goToStep: (step: number) => void;
  setIsOpen: (open: boolean) => void;
}

// Progress dots component
function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex justify-center gap-2 pt-4">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${
            i < current ? 'bg-primary scale-100' : i === current ? 'bg-primary/60 scale-110' : 'bg-muted-foreground/25'
          }`}
        />
      ))}
    </div>
  );
}

// Step 1: Welcome
function WelcomeStep({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  return (
    <div className="flex flex-col items-center text-center space-y-6 py-8">
      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
        <Sparkles className="h-8 w-8 text-primary" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Welcome to OptiRFP!</h2>
        <p className="text-muted-foreground max-w-sm">
          Let's get you ready to win your first government contract.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
        <Button onClick={onNext} className="flex-1" size="lg">
          Start Setup
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        <Button variant="outline" onClick={onSkip} className="flex-1">
          Skip for now
        </Button>
      </div>
      <button
        onClick={onSkip}
        className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
      >
        Explore Dashboard First
      </button>
    </div>
  );
}

// Step 2: Quick Profile
function QuickProfileStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { session } = useAuth();
  const [industry, setIndustry] = useState('');
  const [rfpFrequency, setRfpFrequency] = useState('');
  const [saving, setSaving] = useState(false);

  const handleContinue = async () => {
    if (!session?.user?.id) return;
    setSaving(true);
    try {
      const updates: Record<string, string> = {};
      if (industry) updates.industry = industry;
      
      if (Object.keys(updates).length > 0) {
        const { error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('profile_id', session.user.id);
        if (error) throw error;
      }
      onNext();
    } catch (err) {
      console.error('Profile update error:', err);
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 py-4">
      <div className="text-center space-y-1">
        <p className="text-sm text-muted-foreground">Step 2 of 6</p>
        <h2 className="text-xl font-bold text-foreground">Quick Profile</h2>
      </div>
      <div className="space-y-4 max-w-sm mx-auto">
        <div className="space-y-2">
          <Label>What industry?</Label>
          <Select value={industry} onValueChange={setIndustry}>
            <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="government">Government Contractor</SelectItem>
              <SelectItem value="construction">Construction</SelectItem>
              <SelectItem value="technology">Tech</SelectItem>
              <SelectItem value="healthcare">Healthcare</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>How many RFPs per month?</Label>
          <Select value={rfpFrequency} onValueChange={setRfpFrequency}>
            <SelectTrigger><SelectValue placeholder="Select frequency" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1-5">1–5</SelectItem>
              <SelectItem value="6-10">6–10</SelectItem>
              <SelectItem value="11-20">11–20</SelectItem>
              <SelectItem value="20+">20+</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex justify-between max-w-sm mx-auto">
        <Button variant="ghost" onClick={onBack}><ArrowLeft className="mr-1 h-4 w-4" /> Back</Button>
        <Button onClick={handleContinue} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Continue <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Step 3: Knowledge Base Tour
function KnowledgeBaseTourStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const readiness = useKnowledgeReadiness();
  const essentials = [
    { name: 'Company Overview', icon: Building2, desc: 'Your company info & capabilities' },
    { name: 'Past Performance', icon: FileText, desc: 'Previous project examples' },
    { name: 'Team Bios', icon: Users, desc: 'Key personnel & qualifications' },
  ];

  const completedCount = essentials.filter(e => 
    readiness.categoryCoverage.find(c => c.name === e.name)?.hasContent
  ).length;

  return (
    <div className="space-y-6 py-4">
      <div className="text-center space-y-1">
        <p className="text-sm text-muted-foreground">Step 3 of 6</p>
        <h2 className="text-xl font-bold text-foreground">Your Knowledge Base</h2>
        <p className="text-sm text-muted-foreground">Pre-loaded with templates to get you started</p>
      </div>
      <div className="space-y-3 max-w-sm mx-auto">
        {essentials.map((item) => {
          const covered = readiness.categoryCoverage.find(c => c.name === item.name)?.hasContent;
          return (
            <div key={item.name} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
              <div className={`h-9 w-9 rounded-full flex items-center justify-center ${covered ? 'bg-green-100 text-green-600' : 'bg-muted text-muted-foreground'}`}>
                {covered ? <CheckCircle2 className="h-5 w-5" /> : <item.icon className="h-5 w-5" />}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{item.name}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="text-center">
        <span className="inline-block text-xs font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
          {completedCount} of 3 essentials completed
        </span>
      </div>
      <div className="flex justify-between max-w-sm mx-auto">
        <Button variant="ghost" onClick={onBack}><ArrowLeft className="mr-1 h-4 w-4" /> Back</Button>
        <Button onClick={onNext}>Continue <ArrowRight className="ml-1 h-4 w-4" /></Button>
      </div>
    </div>
  );
}

// Step 4: First RFP Upload
function RFPUploadStep({ onNext, onBack, onFileUploaded }: { onNext: () => void; onBack: () => void; onFileUploaded: (file: File) => void }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    onDrop: (files) => {
      if (files[0]) onFileUploaded(files[0]);
    },
  });

  const sampleRfps = [
    'IT Infrastructure Modernization RFP',
    'Healthcare Data Management RFP',
    'Construction Services RFP',
  ];

  return (
    <div className="space-y-6 py-4">
      <div className="text-center space-y-1">
        <p className="text-sm text-muted-foreground">Step 4 of 6</p>
        <h2 className="text-xl font-bold text-foreground">Upload Your First RFP</h2>
      </div>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors max-w-sm mx-auto ${
          isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">Drop a PDF here or click to browse</p>
        <p className="text-xs text-muted-foreground mt-1">PDF up to 20MB</p>
      </div>
      <div className="max-w-sm mx-auto space-y-2">
        <p className="text-xs text-muted-foreground text-center">Or try a sample RFP:</p>
        <div className="grid gap-2">
          {sampleRfps.map((name) => (
            <button
              key={name}
              onClick={() => toast.info('Sample RFPs coming soon! Upload your own to get started.')}
              className="text-left text-sm px-3 py-2 rounded-md border hover:bg-muted/50 transition-colors text-foreground"
            >
              📄 {name}
            </button>
          ))}
        </div>
      </div>
      <div className="flex justify-between max-w-sm mx-auto">
        <Button variant="ghost" onClick={onBack}><ArrowLeft className="mr-1 h-4 w-4" /> Back</Button>
        <Button variant="ghost" onClick={onNext}>Skip this step <ArrowRight className="ml-1 h-4 w-4" /></Button>
      </div>
    </div>
  );
}

// Step 5: AI Generating
function AIGeneratingStep({ onNext, isUploading }: { onNext: () => void; isUploading: boolean }) {
  const [checklist, setChecklist] = useState([
    { label: 'Analyzing requirements...', done: false },
    { label: 'Matching Knowledge Base...', done: false },
    { label: 'Drafting proposal...', done: false },
  ]);

  useEffect(() => {
    // Simulate progress if not actually uploading
    const timers = [
      setTimeout(() => setChecklist(prev => prev.map((item, i) => i === 0 ? { ...item, done: true } : item)), 2000),
      setTimeout(() => setChecklist(prev => prev.map((item, i) => i === 1 ? { ...item, done: true } : item)), 4000),
      setTimeout(() => {
        setChecklist(prev => prev.map((item, i) => i === 2 ? { ...item, done: true } : item));
        if (!isUploading) setTimeout(onNext, 1000);
      }, 7000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="space-y-6 py-8">
      <div className="text-center space-y-1">
        <p className="text-sm text-muted-foreground">Step 5 of 6</p>
        <h2 className="text-xl font-bold text-foreground">AI is Working...</h2>
      </div>
      <div className="space-y-3 max-w-xs mx-auto">
        {checklist.map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            {item.done ? (
              <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
            ) : (
              <Loader2 className="h-5 w-5 text-primary animate-spin shrink-0" />
            )}
            <span className={`text-sm ${item.done ? 'text-foreground' : 'text-muted-foreground'}`}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground text-center">This takes 2–3 minutes</p>
    </div>
  );
}

// Step 6: Success
function SuccessStep({ onComplete, projectId }: { onComplete: () => void; projectId: string | null }) {
  const navigate = useNavigate();

  useEffect(() => {
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
  }, []);

  return (
    <div className="space-y-6 py-8">
      <div className="text-center space-y-1">
        <p className="text-sm text-muted-foreground">Step 6 of 6</p>
        <div className="flex items-center justify-center gap-2">
          <CheckCircle2 className="h-6 w-6 text-green-500" />
          <h2 className="text-xl font-bold text-foreground">You're All Set!</h2>
        </div>
      </div>
      <div className="flex justify-center gap-6 text-center">
        <div>
          <p className="text-2xl font-bold text-foreground">2:34</p>
          <p className="text-xs text-muted-foreground">Generated in</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-primary">29.5 hrs</p>
          <p className="text-xs text-muted-foreground">You saved</p>
        </div>
      </div>
      <div className="max-w-sm mx-auto space-y-2 rounded-lg border bg-card p-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Proposal Preview</p>
        {['Executive Summary', 'Technical Approach', 'Past Performance'].map((s) => (
          <div key={s} className="flex items-center gap-2 text-sm text-foreground">
            <FileText className="h-4 w-4 text-muted-foreground" />
            {s}
          </div>
        ))}
      </div>
      <div className="flex flex-col sm:flex-row gap-3 max-w-xs mx-auto">
        {projectId ? (
          <Button className="flex-1" onClick={() => { onComplete(); navigate(`/project/${projectId}`); }}>
            Edit & Export
          </Button>
        ) : (
          <Button className="flex-1" onClick={onComplete}>
            Go to Dashboard
          </Button>
        )}
        <Button variant="outline" className="flex-1" onClick={() => { onComplete(); navigate('/projects'); }}>
          Create Another
        </Button>
      </div>
    </div>
  );
}

// Main wizard component
export function ProgressiveOnboarding({
  isOpen,
  currentStep,
  onNext,
  onBack,
  onSkip,
  onComplete,
  goToStep,
  setIsOpen,
}: ProgressiveOnboardingProps) {
  const quickUpload = useQuickUpload();
  const [uploadedProjectId, setUploadedProjectId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUploaded = useCallback(async (file: File) => {
    setIsUploading(true);
    goToStep(5); // Jump to AI generating step
    const projectId = await quickUpload.uploadAndCreate(file);
    setUploadedProjectId(projectId || null);
    setIsUploading(false);
    if (projectId) {
      goToStep(6);
    }
  }, [quickUpload, goToStep]);

  const handleDialogChange = (open: boolean) => {
    if (!open) onSkip();
    else setIsOpen(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogChange}>
      <DialogContent className="sm:max-w-lg">
        {currentStep === 1 && <WelcomeStep onNext={onNext} onSkip={onSkip} />}
        {currentStep === 2 && <QuickProfileStep onNext={onNext} onBack={onBack} />}
        {currentStep === 3 && <KnowledgeBaseTourStep onNext={onNext} onBack={onBack} />}
        {currentStep === 4 && <RFPUploadStep onNext={() => { goToStep(5); setTimeout(() => goToStep(6), 7000); }} onBack={onBack} onFileUploaded={handleFileUploaded} />}
        {currentStep === 5 && <AIGeneratingStep onNext={() => goToStep(6)} isUploading={isUploading} />}
        {currentStep === 6 && <SuccessStep onComplete={onComplete} projectId={uploadedProjectId} />}
        <ProgressDots current={currentStep - 1} total={6} />
      </DialogContent>
    </Dialog>
  );
}
