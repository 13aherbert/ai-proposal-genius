import { AuthForm } from "@/components/AuthForm";

const Index = () => {
  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <div className="absolute inset-0 gradient-bg" />
      <div className="relative z-10 container mx-auto px-4 py-16 min-h-screen flex flex-col items-center justify-center">
        <div className="text-center mb-12 animate-fade-up">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400">
            OptiRFP
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Transform your RFP responses with AI-driven insights and automated content generation.
            Upload your RFPs and let our AI assist you in crafting winning proposals.
          </p>
        </div>
        <div className="w-full max-w-md animate-fade-up [animation-delay:200ms]">
          <AuthForm />
        </div>
      </div>
    </div>
  );
};

export default Index;