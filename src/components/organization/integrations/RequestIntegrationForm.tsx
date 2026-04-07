import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MessageSquarePlus } from 'lucide-react';
import { toast } from 'sonner';

export function RequestIntegrationForm() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error('Please enter an integration name');
      return;
    }
    // In production this would submit to a backend
    toast.success(`Request for "${name}" submitted! We'll review it soon.`);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <Card>
        <CardContent className="p-6 text-center space-y-2">
          <MessageSquarePlus className="h-8 w-8 mx-auto text-brand-green" />
          <p className="font-medium">Thank you!</p>
          <p className="text-sm text-muted-foreground">
            Your integration request has been submitted. We'll notify you when it's available.
          </p>
          <Button variant="outline" size="sm" onClick={() => { setSubmitted(false); setName(''); setDescription(''); }}>
            Submit Another
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageSquarePlus className="h-5 w-5" />
          Request an Integration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Integration Name</Label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Jira, Monday.com, Notion" />
        </div>
        <div className="space-y-2">
          <Label>How would you use it? (optional)</Label>
          <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe your use case..." rows={3} />
        </div>
        <Button onClick={handleSubmit} className="w-full">Submit Request</Button>
      </CardContent>
    </Card>
  );
}
