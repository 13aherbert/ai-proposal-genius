import { AuthForm } from "@/components/AuthForm";
import { Music4 } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen w-full bg-[#121212] text-white">
      <div className="absolute inset-0 gradient-bg" />
      <div className="relative z-10 container mx-auto px-4 py-16 min-h-screen flex flex-col items-center justify-center">
        <div className="text-center mb-12 animate-fade-up bg-[#181818]/90 rounded-lg p-8 backdrop-blur-sm shadow-2xl w-full max-w-2xl">
          <div className="flex items-center justify-center mb-6 space-x-3">
            <Music4 className="h-12 w-12 text-[#1DB954]" />
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-[#1DB954] to-[#169C46] bg-clip-text text-transparent">
              OptiRFP
            </h1>
          </div>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Transform your RFP responses with AI-driven insights and automated content generation.
            Upload your RFPs and let our AI assist you in crafting winning proposals.
          </p>
        </div>
        <div className="w-full max-w-md animate-fade-up [animation-delay:200ms] bg-[#181818]/95 p-8 rounded-lg shadow-2xl backdrop-blur-sm border border-[#282828]">
          <AuthForm />
        </div>
      </div>
    </div>
  );
};

export default Index;