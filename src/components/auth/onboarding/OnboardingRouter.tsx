
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight, Calendar, Mail } from "lucide-react";
import type { OrganizationSize } from "./OrganizationSizeSelector";

interface UserProfile {
  organization_size: OrganizationSize | null;
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

  const handleScheduleDemo = () => {
    // For white label prospects, we could integrate with a scheduling tool
    toast.success("Demo request received! Our team will contact you within 24 hours.");
    navigate('/dashboard');
  };

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

  // White label prospects get a special demo request flow
  if (profile.organization_size === 'white_label') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-2xl">Welcome to Our White Label Program!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-2">
              <p className="text-muted-foreground">
                Thank you for your interest in our white label solution, {profile.first_name}!
              </p>
              <p className="text-sm text-muted-foreground">
                Our enterprise team will contact you within 24 hours to discuss your custom integration needs.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">Personalized Demo</p>
                  <p className="text-sm text-blue-700">Custom solution walkthrough</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                <Mail className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">Technical Consultation</p>
                  <p className="text-sm text-green-700">Integration planning & requirements</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button onClick={handleScheduleDemo} className="w-full" size="lg">
                Schedule Demo Call
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              
              <Button onClick={handleContinueToDashboard} variant="outline" className="w-full">
                Continue to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Enterprise users get a specialized onboarding flow
  if (profile.organization_size === 'enterprise') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-2xl">Welcome to Enterprise!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-2">
              <p className="text-muted-foreground">
                Welcome, {profile.first_name}! Your enterprise account is ready.
              </p>
              <p className="text-sm text-muted-foreground">
                Choose how you'd like to get started with our enterprise platform.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                <Calendar className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="font-medium text-purple-900">Schedule Demo</p>
                  <p className="text-sm text-purple-700">See all enterprise features</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                <Mail className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">Custom Pricing</p>
                  <p className="text-sm text-blue-700">Get a tailored enterprise quote</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button onClick={handleScheduleDemo} className="w-full" size="lg">
                Schedule Enterprise Demo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              
              <Button onClick={() => navigate('/subscription?enterprise=true')} variant="outline" className="w-full">
                View Enterprise Plans
              </Button>
              
              <Button onClick={handleContinueToDashboard} variant="ghost" className="w-full">
                Continue to Dashboard
              </Button>
            </div>
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
      case 'enterprise':
        return "Welcome! Your enterprise solution is being prepared.";
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
              <li>• Up to 3 projects</li>
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
