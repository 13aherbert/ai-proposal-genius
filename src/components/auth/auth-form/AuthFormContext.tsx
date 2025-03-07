
import { createContext, useContext, useState } from "react";
import { AuthError } from "@supabase/supabase-js";

type AuthFormContextType = {
  isSignUp: boolean;
  setIsSignUp: (value: boolean) => void;
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  firstName: string;
  setFirstName: (value: string) => void;
  lastName: string;
  setLastName: (value: string) => void;
  companyName: string;
  setCompanyName: (value: string) => void;
  birthday: string; 
  setBirthday: (value: string) => void;
  error: string;
  setError: (value: string) => void;
};

const AuthFormContext = createContext<AuthFormContextType | undefined>(undefined);

export const AuthFormProvider = ({ children, defaultView }: { 
  children: React.ReactNode;
  defaultView?: 'sign_in' | 'sign_up';
}) => {
  const [isSignUp, setIsSignUp] = useState(defaultView === 'sign_up');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [error, setError] = useState("");

  return (
    <AuthFormContext.Provider
      value={{
        isSignUp,
        setIsSignUp,
        email,
        setEmail,
        password,
        setPassword,
        firstName,
        setFirstName,
        lastName,
        setLastName,
        companyName,
        setCompanyName,
        birthday,
        setBirthday,
        error,
        setError
      }}
    >
      {children}
    </AuthFormContext.Provider>
  );
};

export const useAuthForm = () => {
  const context = useContext(AuthFormContext);
  if (context === undefined) {
    throw new Error("useAuthForm must be used within an AuthFormProvider");
  }
  return context;
};
