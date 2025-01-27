import { AuthForm } from "@/components/AuthForm";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-[#1a1a1a] text-white">
      <div className="absolute inset-0 gradient-bg" />
      <div className="relative z-10">
        {/* Login Button */}
        <div className="absolute top-4 right-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="secondary"
                className="flex items-center gap-2 bg-secondary/50 backdrop-blur-sm hover:bg-secondary/70"
              >
                <LogIn className="h-4 w-4" />
                Login
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <AuthForm defaultView="sign_in" />
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Main Content */}
        <div className="container mx-auto px-4 py-16 min-h-screen flex flex-col items-center justify-center">
          <div className="text-center mb-12 animate-fade-up bg-[#181818]/90 rounded-lg p-8 backdrop-blur-sm shadow-2xl w-full max-w-2xl">
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-[#34D399] to-[#059669] bg-clip-text text-transparent">
              OptiRFP
            </h1>
            <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed mb-8">
              Transform your RFP responses with AI-driven insights and automated content generation.
              Upload your RFPs and let our AI assist you in crafting winning proposals.
            </p>
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  size="lg"
                  className="bg-brand-green hover:bg-brand-green-dark text-white font-semibold"
                >
                  Get Started
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <AuthForm defaultView="sign_up" />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;