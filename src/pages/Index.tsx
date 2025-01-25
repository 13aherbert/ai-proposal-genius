import { AuthForm } from "@/components/AuthForm";

const Index = () => {
  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <div className="absolute inset-0 gradient-bg opacity-90" />
      <div className="relative z-10 container mx-auto px-4 py-16 min-h-screen flex flex-col items-center justify-center">
        <div className="text-center mb-12 animate-fade-up bg-white/90 rounded-lg p-8 backdrop-blur-sm shadow-xl">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-gray-900">
            OptiRFP
          </h1>
          <p className="text-lg md:text-xl text-gray-700 max-w-2xl mx-auto leading-relaxed">
            Transform your RFP responses with AI-driven insights and automated content generation.
            Upload your RFPs and let our AI assist you in crafting winning proposals.
          </p>
        </div>
        <div className="w-full max-w-md animate-fade-up [animation-delay:200ms] bg-white/95 p-6 rounded-lg shadow-lg backdrop-blur-sm">
          <AuthForm />
        </div>
      </div>
    </div>
  );
};

export default Index;