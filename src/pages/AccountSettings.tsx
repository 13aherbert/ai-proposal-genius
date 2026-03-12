
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useSubscription } from "@/hooks/use-subscription";
import { toast } from "sonner";
import { toSubscriptionPlan } from "@/types/subscription";

import { ProfileCard } from "@/components/account/ProfileCard";
import { DeleteAccountSection } from "@/components/account/DeleteAccountSection";
import { CredentialsSection } from "@/components/account/CredentialsSection";
import { SubscriptionCard } from "@/components/account/SubscriptionCard";
import { BillingHistory } from "@/components/account/BillingHistory";
import { ProfileLoading } from "@/components/account/ProfileLoading";
import { AccountActionButtons } from "@/components/account/AccountActionButtons";
import { BrandGuidelinesCard } from "@/components/account/BrandGuidelinesCard";
import { ReferralCard } from "@/components/account/ReferralCard";
import { useProfile } from "@/hooks/use-profile";

export default function AccountSettings() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { data: subscription } = useSubscription();
  const [hasCredentialChanges, setHasCredentialChanges] = useState(false);
  const credentialsSectionRef = useRef<{ saveCredentials: () => Promise<boolean> } | null>(null);
  
  const {
    profileData,
    isLoadingProfile,
    fetchError,
    updateProfileData,
    saveProfile,
    handleRetryFetch,
    hasChanges: hasProfileChanges,
    saveSuccess,
    isLoading,
    isFetching
  } = useProfile();

  const handleSave = async () => {
    try {
      // First save profile data
      const profileSaved = await saveProfile();
      
      // Then save credentials if there are changes
      let credentialsSaved = false;
      if (credentialsSectionRef.current) {
        credentialsSaved = await credentialsSectionRef.current.saveCredentials();
      }
      
      if (profileSaved || credentialsSaved) {
        toast.success("Account updated successfully", {
          description: "Your account information has been saved.",
          duration: 3000,
        });
      }
    } catch (error: any) {
      console.error('Error saving changes:', error);
      toast.error("Failed to save some changes", {
        description: error.message || "Please try again later.",
      });
    }
  };

  // Dev-only admin scripts removed for security

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto w-full py-8 px-4">
          {/* Breadcrumb */}
          <nav className="text-sm text-muted-foreground">
            <button onClick={() => navigate("/dashboard")} className="hover:text-foreground transition-colors">Dashboard</button>
            <span className="mx-2">/</span>
            <span className="text-foreground font-medium">Account</span>
          </nav>

          <header className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold">Account Settings</h1>
          </header>

          <div className="grid gap-6 w-full">
            <ProfileLoading 
              isLoading={isLoadingProfile && !profileData.username} 
              fetchError={fetchError}
              handleRetryFetch={handleRetryFetch}
              isFetching={isFetching}
            />

            {/* Render profile sections even if isLoadingProfile is true, as long as we have profile data */}
            {(profileData.username || !isLoadingProfile) && !fetchError && (
              <>
                <ProfileCard 
                  username={profileData.username} 
                  setUsername={(value) => updateProfileData("username", value)}
                  firstName={profileData.first_name}
                  setFirstName={(value) => updateProfileData("first_name", value)}
                  lastName={profileData.last_name}
                  setLastName={(value) => updateProfileData("last_name", value)}
                  businessName={profileData.business_name}
                  setBusinessName={(value) => updateProfileData("business_name", value)}
                  birthday={profileData.birthday}
                  setBirthday={(value) => updateProfileData("birthday", value)}
                />

                <CredentialsSection 
                  hasProfileChanges={hasProfileChanges}
                  setHasCredentialChanges={setHasCredentialChanges}
                  ref={credentialsSectionRef}
                />

                <SubscriptionCard subscription={subscription ? toSubscriptionPlan(subscription) : null} />
                
                <BillingHistory />

                <BrandGuidelinesCard />
                
                {(profileData.organization_size === 'enterprise' || profileData.organization_size === 'white_label') && (
                  <div className="p-6 border rounded-lg bg-card">
                    <h3 className="text-lg font-semibold mb-2">Organization Management</h3>
                    <p className="text-muted-foreground mb-4">
                      Manage your organization settings, team members, security, and billing.
                    </p>
                    <Button
                      onClick={() => navigate("/organization")}
                      variant="outline"
                      className="w-full"
                    >
                      Go to Organization Dashboard
                    </Button>
                  </div>
                )}

                <AccountActionButtons 
                  hasChanges={hasProfileChanges || hasCredentialChanges}
                  saveSuccess={saveSuccess}
                  isLoading={isLoading}
                  isLoadingProfile={isLoadingProfile && !profileData.username}
                  handleSave={handleSave}
                />
              </>
            )}
            
            <DeleteAccountSection />
          </div>
        </div>
  );
}
