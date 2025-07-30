import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";
import { UpgradeBanner } from "@/components/subscription/UpgradeBanner";
import { TrialExpiredBanner } from "@/components/subscription/TrialExpiredBanner";
import { useSubscription } from "@/hooks/use-subscription";
import { AuthCheck } from "@/components/auth/AuthCheck";
import { OrganizationDashboard } from "@/components/organization/OrganizationDashboard";

export default function Organization() {
  const { loading } = useSubscription();

  return (
    <AuthCheck>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {!loading && (
            <>
              <TrialExpiredBanner />
              <UpgradeBanner />
            </>
          )}
          <OrganizationDashboard />
        </main>
        <Footer />
      </div>
    </AuthCheck>
  );
}