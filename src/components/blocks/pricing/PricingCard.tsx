
import { motion } from "framer-motion";
import { Check, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import NumberFlow from "@number-flow/react";
import { usePricingContext } from "./PricingContext";
import { useAuth } from "@/components/AuthProvider";
import { useSubscription } from "@/hooks/use-subscription";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { AuthForm } from "@/components/auth/AuthForm";
import { toast } from "sonner";
import { createCheckoutSession } from "@/hooks/subscription/use-subscription-actions";

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
  const { subscription } = useSubscription();

  const handleSubscribe = async () => {
    // Handle Contact Sales (Enterprise)
    if (plan.buttonText === "Contact Sales") {
      window.location.href = plan.href;
      return;
    }

    // Handle free trial selection
    if (plan.name === "Free Trial" || plan.price === "0") {
      if (session) {
        toast.success("You're all set with the free plan!", {
          description: "Continue exploring and upgrade when you're ready"
        });
        navigate('/dashboard');
      } else {
        // For non-authenticated users, store the selection and trigger signup
        localStorage.setItem('selected_plan', JSON.stringify({
          planType: 'free',
          isMonthly
        }));
      }
      return;
    }

    if (!session) {
      localStorage.setItem('selected_plan', JSON.stringify({
        priceId: isMonthly ? plan.priceId?.monthly : plan.priceId?.annual,
        isMonthly
      }));
      return;
    }

    try {
      if (subscription && subscription.status === 'active') {
        toast.error("You already have an active subscription. Please manage your subscription in the dashboard.");
        navigate('/dashboard');
        return;
      }

      const priceId = isMonthly ? plan.priceId?.monthly : plan.priceId?.annual;
      
      if (!priceId) {
        toast.error("Invalid subscription plan");
        return;
      }

      toast.loading("Processing your request...");
      
      const { url, error } = await createCheckoutSession(priceId);

      if (error) throw error;
      
      if (url) {
        toast.dismiss();
        toast.success("Redirecting to checkout...");
        setTimeout(() => {
          window.location.href = url;
        }, 1000);
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.dismiss();
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
      
      {plan.name === "Free Trial" && (
        <div className="absolute top-0 left-0 bg-blue-500 py-0.5 px-2 rounded-br-xl rounded-tl-xl">
          <span className="text-white text-xs font-semibold">
            No Credit Card
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
          {plan.period !== "Forever" && plan.period !== "Next 3 months" && (
            <span className="text-sm font-semibold leading-6 tracking-wide text-[#C8C8C9]">
              / {isMonthly ? "month" : "year"}
            </span>
          )}
        </div>

        <p className="text-xs leading-5 text-[#C8C8C9]">
          {plan.period === "Forever" ? "Always free" : 
           isMonthly ? "billed monthly" : "billed annually"}
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
                : plan.name === "Free Trial"
                ? "bg-blue-500 text-white hover:bg-blue-600"
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
                    : plan.name === "Free Trial"
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : "bg-[#f3f3f3] text-[#4B4F54]"
                )}
              >
                {plan.name === "Free Trial" ? "Start Free" : "Sign Up"}
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
