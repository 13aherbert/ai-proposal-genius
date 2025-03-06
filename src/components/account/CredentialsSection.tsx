
import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { EmailCard } from "@/components/account/EmailCard";
import { PasswordCard } from "@/components/account/PasswordCard";
import { useAuth } from "@/components/AuthProvider";

interface CredentialsSectionProps {
  hasProfileChanges: boolean;
  setHasCredentialChanges: (hasChanges: boolean) => void;
}

export interface CredentialsSectionRef {
  saveCredentials: () => Promise<boolean>;
}

export const CredentialsSection = forwardRef<CredentialsSectionRef, CredentialsSectionProps>(
  function CredentialsSection({ hasProfileChanges, setHasCredentialChanges }, ref) {
    const { session } = useAuth();
    const [email, setEmail] = useState(session?.user?.email || "");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [initialEmail, setInitialEmail] = useState(session?.user?.email || "");

    useEffect(() => {
      const hasChanges = 
        email !== initialEmail ||
        password.length > 0;
      
      setHasCredentialChanges(hasChanges);
    }, [email, password, confirmPassword, initialEmail, setHasCredentialChanges]);
    
    const saveCredentials = async (): Promise<boolean> => {
      try {
        let hasChanges = false;
        
        if (email !== session?.user?.email) {
          const { error: emailError } = await supabase.auth.updateUser({
            email: email,
          });
          if (emailError) throw emailError;
          hasChanges = true;
        }

        if (password && password === confirmPassword) {
          const { error: passwordError } = await supabase.auth.updateUser({
            password: password,
          });
          if (passwordError) throw passwordError;
          
          setPassword("");
          setConfirmPassword("");
          hasChanges = true;
        } else if (password && password !== confirmPassword) {
          throw new Error("Passwords do not match");
        }
        
        if (hasChanges) {
          setInitialEmail(email);
          return true;
        }
        
        return false;
      } catch (error: any) {
        console.error('Error updating credentials:', error);
        toast.error("Failed to update credentials", {
          description: error.message || "Please try again later.",
        });
        return false;
      }
    };

    useImperativeHandle(ref, () => ({
      saveCredentials
    }));
    
    return (
      <>
        <EmailCard 
          email={email} 
          setEmail={setEmail} 
        />

        <PasswordCard 
          password={password}
          setPassword={setPassword}
          confirmPassword={confirmPassword}
          setConfirmPassword={setConfirmPassword}
        />
      </>
    );
  }
);
