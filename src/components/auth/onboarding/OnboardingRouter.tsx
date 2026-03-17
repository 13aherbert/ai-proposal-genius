
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight } from "lucide-react";

interface UserProfile {
  organization_size: string | null;
  onboarding_segment: string | null;
  first_name: string | null;
  industry: string | null;
  use_case: string | null;
}

export function OnboardingRouter() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (session?.user) {
      fetchUserProfile();
    }
  }, [session]);

  const fetchUserProfile = async () => {
    if (!session?.user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('organization_size, onboarding_segment, first_name, industry, use_case')
        .eq('profile_id', session.user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      toast.error("Failed to load profile information");
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueToDashboard = () => {
    navigate('/dashboard', { replace: true });
  };

  // For all user types, redirect to dashboard where the progressive onboarding wizard triggers
  useEffect(() => {
    if (!isLoading && profile) {
      navigate('/dashboard', { replace: true });
    }
  }, [isLoading, profile, navigate]);


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Setting up your experience...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Profile Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              We couldn't find your profile information. Please try signing up again.
            </p>
            <Button onClick={() => navigate('/auth')} className="w-full">
              Back to Sign Up
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Regular users get a welcome message and go to dashboard
  const getWelcomeMessage = () => {
    switch (profile.organization_size) {
      case 'solo':
        return "Welcome! Your personal proposal workspace is ready.";
      case 'small_team':
        return "Welcome! Let's get your team set up for collaboration.";
      case 'medium_business':
        return "Welcome! Your organization workspace is ready.";
      default:
        return "Welcome to your proposal management platform!";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <CardTitle className="text-xl">Account Created Successfully!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-muted-foreground">
              {getWelcomeMessage()}
            </p>
          </div>

          <div className="space-y-2 text-sm bg-green-50 p-3 rounded-lg">
            <p className="font-medium text-green-800">✨ Your Free Starter Plan includes:</p>
            <ul className="text-green-700 space-y-1">
              <li>• 6 projects per year</li>
              <li>• AI RFP Summary & Proposal Outline</li>
              <li>• Basic AI Proposal Draft</li>
              <li>• Community support</li>
            </ul>
          </div>

          <Button onClick={handleContinueToDashboard} className="w-full" size="lg">
            Start Creating Projects
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
