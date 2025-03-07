
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AuthFormProvider, useAuthForm } from "./auth-form/AuthFormContext";
import { EmailPasswordFields, SignUpFields } from "./auth-form/AuthFormFields";
import { useAuthFormSubmit } from "./auth-form/useAuthFormSubmit";
import { useAuthRedirects } from "./auth-form/useAuthRedirects";

interface AuthFormContentProps {}

const AuthFormContent = ({}: AuthFormContentProps) => {
  const { isSignUp, setIsSignUp, error } = useAuthForm();
  const { handleSubmit } = useAuthFormSubmit();
  
  // Initialize redirects
  useAuthRedirects();

  return (
    <div className="w-full max-w-md">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <EmailPasswordFields />

        {isSignUp && <SignUpFields />}

        <Button type="submit" className="w-full">
          {isSignUp ? "Sign Up" : "Sign In"}
        </Button>

        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={() => setIsSignUp(!isSignUp)}
        >
          {isSignUp ? "Already have an account? Sign In" : "Need an account? Sign Up"}
        </Button>
      </form>
    </div>
  );
};

interface AuthFormProps {
  defaultView?: 'sign_in' | 'sign_up';
}

export const AuthForm = ({ defaultView = 'sign_in' }: AuthFormProps) => {
  return (
    <AuthFormProvider defaultView={defaultView}>
      <AuthFormContent />
    </AuthFormProvider>
  );
};
