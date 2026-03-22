import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";

const footerSections = [
  {
    title: "Product",
    links: [
      { label: "Features", to: "/#features" },
      { label: "Pricing", to: "/pricing" },
      { label: "Integrations", to: "/integrations" },
      { label: "Security", to: "/security" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Blog", to: "/blog" },
      { label: "Documentation", to: "/docs" },
      { label: "FAQ", to: "/faq" },
      { label: "Compare", to: "/compare/loopio" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", to: "/about" },
      { label: "Contact", to: "/contact" },
      { label: "Book a Demo", to: "/demo" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Security & Privacy", to: "/security" },
      { label: "Support", href: "mailto:support@optirfp.ai" },
    ],
  },
];

export function Footer() {
  const currentYear = new Date().getFullYear();
  const { session } = useAuth();

  return (
    <footer className="bg-background border-t mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Footer columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="text-sm font-semibold text-foreground mb-3">{section.title}</h4>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    {"href" in link && link.href ? (
                      <a
                        href={link.href}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        to={link.to!}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
                {/* Add authenticated-only links */}
                {section.title === "Product" && session && (
                  <li>
                    <Link
                      to="/knowledge-base"
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Knowledge Base
                    </Link>
                  </li>
                )}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t pt-6 flex flex-col sm:flex-row justify-between items-center gap-2 text-sm text-muted-foreground">
          <p>&copy; {currentYear} OptiRFP. All rights reserved.</p>
          <a
            href="mailto:hello@optirfp.ai"
            className="hover:text-foreground transition-colors"
          >
            hello@optirfp.ai
          </a>
        </div>
      </div>
    </footer>
  );
}
