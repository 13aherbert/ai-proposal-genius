
import { motion } from "framer-motion";
import { Check, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import NumberFlow from "@number-flow/react";
import { usePricingContext } from "./PricingContext";
import { useAuth } from "@/components/AuthProvider";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { AuthForm } from "@/components/AuthForm";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PricingPlan {
  name: string;
  price: string;
  yearlyPrice: string;
  period: string;
  features: string[];
  description: string;
  buttonText: string;
  href: string;
  isPopular: boolean;
  priceId?: {
    monthly: string;
    annual: string;
  };
}

interface PricingCardProps {
  plan: PricingPlan;
  index: number;
  isDesktop: boolean;
}

export function PricingCard({ plan, index, isDesktop }: PricingCardProps) {
  const navigate = useNavigate();
  const { isMonthly } = usePricingContext();
  const { session } = useAuth();

  const handleSubscribe = async () => {
    if (!session) {
      toast.error("Please sign in to subscribe");
      return;
    }

    try {
      // Refresh the session first
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        console.error('Session refresh error:', refreshError);
        toast.error("Session expired. Please sign in again.");
        return;
      }

      // Get the current session after refresh
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !currentSession) {
        console.error('Session retrieval error:', sessionError);
        toast.error("Unable to verify your session. Please sign in again.");
        return;
      }

      console.log("Creating checkout session for user:", currentSession.user.id);
      
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { 
          priceId: isMonthly ? plan.priceId?.monthly : plan.priceId?.annual 
        },
        headers: {
          Authorization: `Bearer ${currentSession.access_token}`
        }
      });

      if (error) {
        console.error('Checkout session error:', error);
        throw error;
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast.error("Failed to start subscription process. Please try again.");
    }
  };

  return (
    <motion.div
      initial={{ y: 50, opacity: 1 }}
      whileInView={
        isDesktop
          ? {
              y: plan.isPopular ? -20 : 0,
              opacity: 1,
              x: index === 2 ? -30 : index === 0 ? 30 : 0,
              scale: index === 0 || index === 2 ? 0.94 : 1.0,
            }
          : {}
      }
      viewport={{ once: true }}
      transition={{
        duration: 1.6,
        type: "spring",
        stiffness: 100,
        damping: 30,
        delay: 0.4,
        opacity: { duration: 0.5 },
      }}
      className={cn(
        `rounded-2xl border-[1px] p-6 bg-background text-center lg:flex lg:flex-col lg:justify-center relative`,
        plan.isPopular ? "border-[#34D399] border-2" : "border-border",
        "flex flex-col",
        !plan.isPopular && "mt-5",
        index === 0 || index === 2
          ? "z-0 transform translate-x-0 translate-y-0 -translate-z-[50px] rotate-y-[10deg]"
          : "z-10",
        index === 0 && "origin-right",
        index === 2 && "origin-left"
      )}
    >
      {plan.isPopular && (
        <div className="absolute top-0 right-0 bg-[#34D399] py-0.5 px-2 rounded-bl-xl rounded-tr-xl flex items-center">
          <Star className="text-white h-4 w-4 fill-current" />
          <span className="text-white ml-1 font-sans font-semibold">
            Popular
          </span>
        </div>
      )}
      <div className="flex-1 flex flex-col">
        <p className="text-base font-semibold text-[#F1F0FB]">
          {plan.name}
        </p>
        <div className="mt-6 flex items-center justify-center gap-x-2">
          <span className="text-5xl font-bold tracking-tight text-[#F1F1F1]">
            <NumberFlow
              value={isMonthly ? Number(plan.price) : Number(plan.yearlyPrice)}
              format={{
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }}
              transformTiming={{
                duration: 500,
                easing: "ease-out",
              }}
              willChange
              className="font-variant-numeric: tabular-nums"
            />
          </span>
          {plan.period !== "Next 3 months" && (
            <span className="text-sm font-semibold leading-6 tracking-wide text-[#C8C8C9]">
              / {isMonthly ? "month" : "year"}
            </span>
          )}
        </div>

        <p className="text-xs leading-5 text-[#C8C8C9]">
          {isMonthly ? "billed monthly" : "billed annually"}
        </p>

        <ul className="mt-5 gap-2 flex flex-col">
          {plan.features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <Check className="h-4 w-4 text-[#34D399] mt-1 flex-shrink-0" />
              <span className="text-[#F1F1F1] text-left">{feature}</span>
            </li>
          ))}
        </ul>

        <hr className="w-full my-4 border-[#4B4F54]" />

        {session ? (
          <button
            onClick={handleSubscribe}
            className={cn(
              buttonVariants({
                variant: "outline",
              }),
              "group relative w-full gap-2 overflow-hidden text-lg font-semibold tracking-tighter",
              "transform-gpu ring-offset-current transition-all duration-300 ease-out hover:ring-2 hover:ring-[#34D399] hover:ring-offset-1 hover:bg-[#34D399] hover:text-white",
              plan.isPopular
                ? "bg-[#34D399] text-white"
                : "bg-[#f3f3f3] text-[#4B4F54]"
            )}
          >
            {plan.buttonText}
          </button>
        ) : (
          <Dialog>
            <DialogTrigger asChild>
              <button
                className={cn(
                  buttonVariants({
                    variant: "outline",
                  }),
                  "group relative w-full gap-2 overflow-hidden text-lg font-semibold tracking-tighter",
                  "transform-gpu ring-offset-current transition-all duration-300 ease-out hover:ring-2 hover:ring-[#34D399] hover:ring-offset-1 hover:bg-[#34D399] hover:text-white",
                  plan.isPopular
                    ? "bg-[#34D399] text-white"
                    : "bg-[#f3f3f3] text-[#4B4F54]"
                )}
              >
                Sign Up
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <AuthForm defaultView="sign_up" />
            </DialogContent>
          </Dialog>
        )}
        <p className="mt-6 text-xs leading-5 text-[#C8C8C9]">
          {plan.description}
        </p>
      </div>
    </motion.div>
  );
}
