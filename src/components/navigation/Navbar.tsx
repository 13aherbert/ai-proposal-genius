
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { useProfile } from "@/hooks/use-profile";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { session, signOut } = useAuth();
  const { profileData } = useProfile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const handleSignOut = async () => {
    setMobileMenuOpen(false);
    await signOut();
  };
  
  return (
    <header className="bg-background border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center">
              <img src="/lovable-uploads/e3257c71-ec26-4f77-b50f-f3115dd1a320.png" alt="OptiRFP Logo" className="h-8 sm:h-9 w-auto" />
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
                <Link to="/opportunities" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                  Find Opportunities
                </Link>
                <Link to="/knowledge-base" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                  Knowledge Base
                </Link>
                {(profileData.organization_size === 'enterprise' || profileData.organization_size === 'white_label') && (
                  <Link to="/organization" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                    Organization
                  </Link>
                )}
              </nav>
            )}
          </div>
          
          {/* Desktop actions */}
          <div className="hidden md:flex items-center space-x-4">
            {session ? (
              <>
                <Link to="/account-settings" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                  Account
                </Link>
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </>
            ) : (
              <Link to="/">
                <Button size="sm">Sign In</Button>
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          {session && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {session && mobileMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <nav className="flex flex-col px-4 py-3 space-y-1">
            <Link
              to="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 px-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
            >
              Dashboard
            </Link>
            <Link
              to="/projects"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 px-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
            >
              Projects
            </Link>
            <Link
              to="/upload-rfp"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 px-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
            >
              Upload RFP
            </Link>
            <Link
              to="/opportunities"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 px-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
            >
              Find Opportunities
            </Link>
            <Link
              to="/knowledge-base"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 px-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
            >
              Knowledge Base
            </Link>
            {(profileData.organization_size === 'enterprise' || profileData.organization_size === 'white_label') && (
              <Link
                to="/organization"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 px-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
              >
                Organization
              </Link>
            )}
            <div className="border-t pt-2 mt-2 space-y-1">
              <Link
                to="/account-settings"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 px-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md block"
              >
                Account
              </Link>
              <button
                onClick={handleSignOut}
                className="py-2 px-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md w-full text-left"
              >
                Sign Out
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
