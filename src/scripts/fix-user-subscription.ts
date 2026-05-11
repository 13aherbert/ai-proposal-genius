
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Updates a user's subscription plan to a target tier (default: business)
 */
export async function updateUserPlan(email: string, plan: string = 'business') {
  try {
    console.log(`Updating subscription for ${email} to ${plan} plan...`);

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session) throw new Error("Not authenticated");

    const { data, error } = await supabase.functions.invoke('admin-update-subscription', {
      body: { email, plan },
      headers: { Authorization: `Bearer ${sessionData.session.access_token}` },
    });

    if (error) throw error;

    if (data?.success) {
      toast.success(`Successfully updated subscription for ${email} to ${plan} plan`);
      return true;
    }
    throw new Error(data?.error || "Unknown error");
  } catch (error: any) {
    console.error("Failed to update subscription:", error);
    toast.error(`Failed to update subscription: ${error.message}`);
    return false;
  }
}
