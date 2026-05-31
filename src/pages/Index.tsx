import { useEffect, useState } from "react";
import { AuthForm } from "@/components/auth/AuthForm";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { PricingDemo } from "@/components/blocks/pricing-demo";
import { ComparisonCharts } from "@/components/blocks/comparison-charts";
import { FAQ } from "@/components/blocks/faq";

import { SocialProofBar } from "@/components/blocks/SocialProofBar";
import { Testimonial } from "@/components/blocks/Testimonial";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useExitIntent } from "@/hooks/use-exit-intent";
import { ExitIntentModal } from "@/components/blocks/ExitIntentModal";
import { useAuth } from "@/components/AuthProvider";
import { SEO } from "@/components/SEO";
import { SEO_CONFIG } from "@/config/seo-config";

const Index = () => {
  const { session } = useAuth();
  const { showModal: exitOpen, dismiss, close, signUp: exitSignUp } = useExitIntent({ isLoggedIn: !!session });
  const [exitSignupOpen, setExitSignupOpen] = useState(false);


  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isAutomated = !!(navigator as any).webdriver;
    if (prefersReducedMotion || isAutomated) {
      document.body.classList.add('reduce-motion');
    }
    return () => document.body.classList.remove('reduce-motion');
  }, []);

  useEffect(() => {
    if (window.location.hash === '#pricing') {
      setTimeout(() => {
        document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, []);
  
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth'
      });
    }
  };
  
  return (
    <div className="min-h-screen w-full bg-[#1a1a1a] text-white">
      <SEO {...SEO_CONFIG.home} />
      <div className="absolute inset-0 gradient-bg" />
      <div className="relative z-10">
        {/* Main Content */}
        <div className="container mx-auto px-4 py-16 min-h-screen">
          {/* Hero Section */}
          <div className="text-center mb-12 animate-fade-up bg-[#181818]/90 rounded-lg p-8 backdrop-blur-sm shadow-2xl w-full max-w-2xl mx-auto mt-12">
            <img src="/lovable-uploads/e3257c71-ec26-4f77-b50f-f3115dd1a320.png" alt="OptiRFP - AI-powered RFP Response Platform" className="h-16 md:h-20 mx-auto mb-4" />
            <h1 className="text-3xl md:text-5xl font-bold text-white max-w-3xl mx-auto leading-tight mb-4">
              Optimize Proposals. Win Opportunities.
            </p>
            <p className="text-base md:text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed mb-8">
              Streamline your RFP process, increase your win rate, and save hours with AI-powered tools designed for businesses like yours.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="lg" className="bg-brand-green hover:bg-brand-green-dark text-white font-semibold">Start Forever Free Today</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <ErrorBoundary name="SignupModal">
                    <AuthForm defaultView="sign_up" variant="dialog" />
                  </ErrorBoundary>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Social Proof Stats */}
          <SocialProofBar />

          {/* Key Benefits Section */}
          <div id="features" className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 animate-fade-up delay-200">
            <div className="bg-[#181818]/90 rounded-lg p-6 backdrop-blur-sm shadow-lg">
              <div className="h-12 w-12 bg-brand-green/10 rounded-lg flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-brand-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-100 mb-2">AI-Powered Analysis</h3>
              <p className="text-gray-400">Automatically analyze RFPs to identify key requirements, deadlines, and evaluation criteria.</p>
            </div>

            <div className="bg-[#181818]/90 rounded-lg p-6 backdrop-blur-sm shadow-lg">
              <div className="h-12 w-12 bg-brand-green/10 rounded-lg flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-brand-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-100 mb-2">Smart Responses</h3>
              <p className="text-gray-400">Draft responses tailored to your business with the precision of AI.</p>
            </div>

            <div className="bg-[#181818]/90 rounded-lg p-6 backdrop-blur-sm shadow-lg">
              <div className="h-12 w-12 bg-brand-green/10 rounded-lg flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-brand-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-100 mb-2">Time-Saving Automation</h3>
              <p className="text-gray-400">Reduce proposal creation time by 50% with automated content generation and formatting.</p>
            </div>
          </div>

          {/* Testimonial */}
          <Testimonial />

          {/* Pricing Section */}
          <div id="pricing">
            <PricingDemo />
          </div>

          {/* Comparison Charts */}
          <ComparisonCharts />

          {/* FAQ Section */}
          <div id="faq" className="bg-[#181818]/90 rounded-lg backdrop-blur-sm shadow-2xl mt-16">
            <FAQ />
          </div>
        </div>
      </div>

      {/* Exit Intent Modal */}
      <ExitIntentModal
        open={exitOpen}
        onDismiss={dismiss}
        onClose={close}
        onSignUp={() => {
          exitSignUp();
          setExitSignupOpen(true);
        }}
      />

      {/* Signup dialog triggered by exit intent CTA */}
      <Dialog open={exitSignupOpen} onOpenChange={setExitSignupOpen}>
        <DialogContent className="sm:max-w-md">
          <ErrorBoundary name="ExitIntentSignupModal">
            <AuthForm defaultView="sign_up" variant="dialog" />
          </ErrorBoundary>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
