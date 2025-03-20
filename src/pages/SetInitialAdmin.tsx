import React, { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function SetInitialAdmin() {
  const [email, setEmail] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const navigate = useNavigate();
  
  const handleSetAdmin = async () => {
    if (!email || !secretKey) {
      toast.error('Please fill in all fields');
      return;
    }
    
    try {
      setLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('You must be logged in to perform this action');
        return;
      }
      
      const { data, error } = await supabase.functions.invoke('set-initial-admin', {
        body: { adminEmail: email, secretKey },
      });
      
      if (error) {
        throw new Error(`Function error: ${error.message}`);
      }
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setResult(data.message);
      toast.success('Admin user set successfully');
    } catch (error) {
      console.error('Error setting admin:', error);
      toast.error('Failed to set admin: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Set Initial Admin</h1>
      </div>
      <p className="text-muted-foreground mb-6">
        Use this utility to set up the first admin user in the system. This should only be used once during initial setup.
      </p>
      
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle>Admin Setup</CardTitle>
          <CardDescription>
            Provide the email of the user you want to make an admin and the secret key configured in your environment variables.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Admin Email</Label>
            <Input
              id="email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="secretKey">Secret Key</Label>
            <Input
              id="secretKey"
              type="password"
              placeholder="Secret key from environment variables"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
            />
          </div>
          
          {result && (
            <Alert className="mt-4">
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>{result}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={handleSetAdmin} disabled={loading} className="w-full">
            {loading ? 'Processing...' : 'Set Admin User'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
