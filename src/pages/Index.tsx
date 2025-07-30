import { AuthForm } from "@/components/auth/AuthForm";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { LogIn, DollarSign, HelpCircle, Sparkles } from "lucide-react";
import { PricingDemo } from "@/components/blocks/pricing-demo";
import { ComparisonCharts } from "@/components/blocks/comparison-charts";
import { FAQ } from "@/components/blocks/faq";
import { useState } from "react";
import { BetaRequestDialog } from "@/components/beta/BetaRequestDialog";
import { useIsMobile } from "@/hooks/use-mobile";
const Index = () => {
  const [betaDialogOpen, setBetaDialogOpen] = useState(false);
  const isMobile = useIsMobile();
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth'
      });
    }
  };
  return <div className="min-h-screen w-full bg-[#1a1a1a] text-white">
      <div className="absolute inset-0 gradient-bg" />
      <div className="relative z-10">
        {/* Beta Program Button - Only show in this position on desktop */}
        {!isMobile && <div className="absolute top-4 left-4">
            <Button size="lg" variant="outline" className="border-brand-green text-brand-green hover:bg-brand-green hover:text-white" onClick={() => setBetaDialogOpen(true)}>
              <Sparkles className="mr-2 h-4 w-4" />
              Join the Beta Program
            </Button>
          </div>}
        
        {/* Navigation Buttons and Login */}
        <div className="absolute top-4 right-4 flex items-center gap-4">
          <Button variant="secondary" className="flex items-center gap-2 bg-secondary/50 backdrop-blur-sm hover:bg-secondary/70" onClick={() => scrollToSection('pricing')}>
            <DollarSign className="h-4 w-4" />
            {!isMobile && "Pricing"}
          </Button>
          <Button variant="secondary" className="flex items-center gap-2 bg-secondary/50 backdrop-blur-sm hover:bg-secondary/70" onClick={() => scrollToSection('faq')}>
            <HelpCircle className="h-4 w-4" />
            {!isMobile && "FAQ"}
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="secondary" className="flex items-center gap-2 bg-secondary/50 backdrop-blur-sm hover:bg-secondary/70">
                <LogIn className="h-4 w-4" />
                {!isMobile && "Login"}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <AuthForm defaultView="sign_in" variant="dialog" />
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Main Content */}
        <div className="container mx-auto px-4 py-16 min-h-screen">
          {/* Beta Button for Mobile - Centered below header */}
          {isMobile && <div className="flex justify-center mb-8 pt-12">
              <Button size="lg" variant="outline" className="border-brand-green text-brand-green hover:bg-brand-green hover:text-white" onClick={() => setBetaDialogOpen(true)}>
                <Sparkles className="mr-2 h-4 w-4" />
                Join the Beta Program
              </Button>
            </div>}
          
          {/* Hero Section */}
          <div className="text-center mb-12 animate-fade-up bg-[#181818]/90 rounded-lg p-8 backdrop-blur-sm shadow-2xl w-full max-w-2xl mx-auto">
            <img src="/lovable-uploads/e3257c71-ec26-4f77-b50f-f3115dd1a320.png" alt="OptiRFP Logo" className="h-16 md:h-20 mx-auto mb-4" />
            <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed mb-4">
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
                  <AuthForm defaultView="sign_up" variant="dialog" />
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Beta Request Dialog */}
          <BetaRequestDialog open={betaDialogOpen} onOpenChange={setBetaDialogOpen} />

          {/* Key Benefits Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 animate-fade-up delay-200">
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
    </div>;
};
export default Index;