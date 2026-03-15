import React from "react";
import { Link } from "react-router-dom";
import { TrustBadges } from "@/components/blocks/TrustBadges";
import { useAuth } from "@/components/AuthProvider";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const { session } = useAuth();
  
  return (
    <footer className="bg-background border-t mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <TrustBadges />
        <div className="flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
          <div className="mb-2 md:mb-0">
            &copy; {currentYear} OptiRFP. All rights reserved.
          </div>
          
          <div className="flex space-x-4">
            <Link to="/docs" className="hover:text-foreground">
              Documentation
            </Link>
            <Link to="/blog" className="hover:text-foreground">
              Blog
            </Link>
            <Link to="/compare/loopio" className="hover:text-foreground">
              Compare
            </Link>
            {session && (
              <Link to="/knowledge-base" className="hover:text-foreground">
                Knowledge Base
              </Link>
            )}
            {session ? (
              <Link to="/subscription" className="hover:text-foreground">
                Pricing
              </Link>
            ) : (
              <a href="/#pricing" className="hover:text-foreground">
                Pricing
              </a>
            )}
            <a href="mailto:support@optirfp.ai" className="hover:text-foreground">
              Support
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
