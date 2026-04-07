import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Shield, Smartphone, Key, Copy, Check, Loader2, AlertTriangle, ShieldCheck, ShieldOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';

type MFAStep = 'overview' | 'enroll' | 'verify' | 'recovery' | 'complete';

export function MFASetupWizard() {
  const { session } = useAuth();
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [step, setStep] = useState<MFAStep>('overview');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [factorId, setFactorId] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [disableCode, setDisableCode] = useState('');
  const [isDisabling, setIsDisabling] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  useEffect(() => {
    checkMFAStatus();
  }, []);

  const checkMFAStatus = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      const verifiedTOTP = data?.totp?.find(f => f.status === 'verified');
      setMfaEnabled(!!verifiedTOTP);
      if (verifiedTOTP) setFactorId(verifiedTOTP.id);
    } catch (err) {
      console.error('MFA status check failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const startEnrollment = async () => {
    try {
      // Unenroll any unverified factors first
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const unverified = factors?.totp?.filter(f => f.status === 'unverified') || [];
      for (const f of unverified) {
        await supabase.auth.mfa.unenroll({ factorId: f.id });
      }

      const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'Authenticator App' });
      if (error) throw error;
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setFactorId(data.id);
      setStep('enroll');
    } catch (err: any) {
      toast.error('Failed to start MFA enrollment', { description: err.message });
    }
  };

  const verifyEnrollment = async () => {
    if (verifyCode.length !== 6) return;
    setIsVerifying(true);
    try {
      const { data: challenge, error: challengeErr } = await supabase.auth.mfa.challenge({ factorId });
      if (challengeErr) throw challengeErr;

      const { error: verifyErr } = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.id, code: verifyCode });
      if (verifyErr) throw verifyErr;

      setMfaEnabled(true);
      setStep('complete');
      toast.success('MFA enabled successfully');
    } catch (err: any) {
      toast.error('Verification failed', { description: err.message || 'Invalid code. Please try again.' });
    } finally {
      setIsVerifying(false);
      setVerifyCode('');
    }
  };

  const disableMFA = async () => {
    setIsDisabling(true);
    try {
      // Verify current code before disabling
      const { data: challenge, error: challengeErr } = await supabase.auth.mfa.challenge({ factorId });
      if (challengeErr) throw challengeErr;

      const { error: verifyErr } = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.id, code: disableCode });
      if (verifyErr) throw verifyErr;

      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      if (error) throw error;

      setMfaEnabled(false);
      setShowDisableDialog(false);
      setDisableCode('');
      setStep('overview');
      toast.success('MFA has been disabled');
    } catch (err: any) {
      toast.error('Failed to disable MFA', { description: err.message || 'Invalid code' });
    } finally {
      setIsDisabling(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-lg">Multi-Factor Authentication</CardTitle>
                <CardDescription>Add an extra layer of security to your account</CardDescription>
              </div>
            </div>
            <Badge variant={mfaEnabled ? 'default' : 'secondary'} className="gap-1">
              {mfaEnabled ? <><ShieldCheck className="h-3 w-3" /> Enabled</> : <><ShieldOff className="h-3 w-3" /> Disabled</>}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {step === 'overview' && !mfaEnabled && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Protect your account with time-based one-time passwords (TOTP). 
                Use an authenticator app like Google Authenticator, Authy, or 1Password.
              </p>
              <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                <Smartphone className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium">Before you begin</p>
                  <p className="text-muted-foreground">Install an authenticator app on your phone</p>
                </div>
              </div>
              <Button onClick={startEnrollment} className="w-full">
                <Shield className="h-4 w-4 mr-2" /> Enable MFA
              </Button>
            </div>
          )}

          {step === 'overview' && mfaEnabled && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 border rounded-lg bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
                <ShieldCheck className="h-5 w-5 text-green-600 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-green-800 dark:text-green-200">MFA is active</p>
                  <p className="text-green-600 dark:text-green-400">Your account is protected with two-factor authentication</p>
                </div>
              </div>
              <Button variant="destructive" onClick={() => setShowDisableDialog(true)} className="w-full">
                <ShieldOff className="h-4 w-4 mr-2" /> Disable MFA
              </Button>
            </div>
          )}

          {step === 'enroll' && (
            <div className="space-y-6">
              <div className="text-center space-y-3">
                <p className="text-sm font-medium">Scan this QR code with your authenticator app</p>
                {qrCode && (
                  <div className="inline-block p-4 bg-white rounded-lg border">
                    <img src={qrCode} alt="MFA QR Code" className="w-48 h-48" />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground text-center">Or enter this secret manually:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-2 bg-muted rounded text-xs font-mono break-all text-center">{secret}</code>
                  <Button size="icon" variant="outline" onClick={copySecret}>
                    {copiedSecret ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Enter the 6-digit code from your app</label>
                <Input
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="text-center text-2xl tracking-[0.5em] font-mono"
                  maxLength={6}
                  onKeyDown={(e) => e.key === 'Enter' && verifyEnrollment()}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('overview')} className="flex-1">Cancel</Button>
                <Button onClick={verifyEnrollment} disabled={verifyCode.length !== 6 || isVerifying} className="flex-1">
                  {isVerifying ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Key className="h-4 w-4 mr-2" />}
                  Verify & Enable
                </Button>
              </div>
            </div>
          )}

          {step === 'complete' && (
            <div className="space-y-4 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-950">
                <ShieldCheck className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">MFA Enabled Successfully!</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Your account is now protected with two-factor authentication.
                  You'll need your authenticator app each time you sign in.
                </p>
              </div>
              <Button onClick={() => setStep('overview')} className="w-full">Done</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Disable MFA Dialog */}
      <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Disable Multi-Factor Authentication
            </DialogTitle>
            <DialogDescription>
              This will reduce your account security. Enter your current authenticator code to confirm.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              value={disableCode}
              onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className="text-center text-2xl tracking-[0.5em] font-mono"
              maxLength={6}
              onKeyDown={(e) => e.key === 'Enter' && disableMFA()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDisableDialog(false); setDisableCode(''); }}>Cancel</Button>
            <Button variant="destructive" onClick={disableMFA} disabled={disableCode.length !== 6 || isDisabling}>
              {isDisabling ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Disable MFA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
