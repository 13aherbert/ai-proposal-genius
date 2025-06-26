
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const { session, signOut } = useAuth();
  
  const handleSignOut = async () => {
    await signOut();
  };
  
  return (
    <header className="bg-background border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Link to="/dashboard" className="text-xl font-semibold text-brand-green">
              ProposalPro
            </Link>
            
            {session && (
              <nav className="ml-8 space-x-4 hidden md:flex">
                <Link to="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                  Dashboard
                </Link>
                <Link to="/projects" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                  Projects
                </Link>
                <Link to="/upload-rfp" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                  Upload RFP
                </Link>
                <Link to="/knowledge-base" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                  Knowledge Base
                </Link>
                <Link to="/white-label" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                  White Label
                </Link>
              </nav>
            )}
          </div>
          
          {session ? (
            <div className="flex items-center space-x-4">
              <Link to="/account-settings" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                Account
              </Link>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          ) : (
            <Link to="/">
              <Button size="sm">Sign In</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
