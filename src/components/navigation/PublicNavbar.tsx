import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AuthForm } from "@/components/auth/AuthForm";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";
import { Sheet, SheetTrigger, SheetContent, SheetClose } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
  Menu,
  LogIn,
  Zap,
  DollarSign,
  Puzzle,
  ShieldCheck,
  BookOpen,
  HelpCircle,
  FileText,
  Building2,
  Mail,
  CalendarCheck,
  ChevronDown,
  Wrench,
} from "lucide-react";

const ListItem = React.forwardRef<
  React.ElementRef<typeof Link>,
  React.ComponentPropsWithoutRef<typeof Link> & { title: string; icon?: React.ReactNode }
>(({ className, title, children, icon, ...props }, ref) => (
  <li>
    <NavigationMenuLink asChild>
      <Link
        ref={ref}
        className={cn(
          "flex items-start gap-3 select-none rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
          className
        )}
        {...props}
      >
        {icon && <span className="mt-0.5 text-muted-foreground">{icon}</span>}
        <div className="space-y-1">
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">{children}</p>
        </div>
      </Link>
    </NavigationMenuLink>
  </li>
));
ListItem.displayName = "ListItem";

export function PublicNavbar() {
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();
  const isHomePage = location.pathname === "/";
  const [loginOpen, setLoginOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const openAuth = (which: "login" | "signup") => {
    // On mobile, route to the standalone /auth page for a more reliable flow.
    if (isMobile) {
      setSheetOpen(false);
      navigate(which === "signup" ? "/auth?mode=signup" : "/auth");
      return;
    }
    setSheetOpen(false);
    window.setTimeout(() => {
      if (which === "login") setLoginOpen(true);
      else setSignupOpen(true);
    }, 350);
  };


  return (
    <>
      <header className={cn(
        "backdrop-blur sticky top-0 z-50",
        isHomePage
          ? "bg-[#1a1a1a]/80 border-b border-white/10 text-white"
          : "bg-background/95 supports-[backdrop-filter]:bg-background/60 border-b"
      )}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <img
                src="/lovable-uploads/e3257c71-ec26-4f77-b50f-f3115dd1a320.png"
                alt="OptiRFP - AI-powered RFP Response Platform"
                className="h-8 sm:h-9 w-auto"
              />
            </Link>

            {/* Desktop Navigation */}
            <NavigationMenu className="hidden md:flex">
              <NavigationMenuList>
                {/* Product */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Product</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[420px] gap-2 p-4">
                      <ListItem to="/#features" title="Features" icon={<Zap className="h-4 w-4" />}>
                        AI-powered RFP analysis and proposal generation
                      </ListItem>
                      <ListItem to="/pricing" title="Pricing" icon={<DollarSign className="h-4 w-4" />}>
                        Plans for teams of every size
                      </ListItem>
                      <ListItem to="/integrations" title="Integrations" icon={<Puzzle className="h-4 w-4" />}>
                        Connect with your favorite tools
                      </ListItem>
                      <ListItem to="/security" title="Security" icon={<ShieldCheck className="h-4 w-4" />}>
                        Enterprise-grade data protection
                      </ListItem>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* Resources */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Resources</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[380px] gap-2 p-4">
                      <ListItem to="/blog" title="Blog" icon={<BookOpen className="h-4 w-4" />}>
                        Insights, tips, and product updates
                      </ListItem>
                      <ListItem to="/faq" title="FAQ" icon={<HelpCircle className="h-4 w-4" />}>
                        Frequently asked questions
                      </ListItem>
                      <ListItem to="/docs" title="Documentation" icon={<FileText className="h-4 w-4" />}>
                        Guides and API reference
                      </ListItem>
                      <ListItem to="/tools" title="Free Tools" icon={<Wrench className="h-4 w-4" />}>
                        Word counter, deadline planner, compliance matrix and more
                      </ListItem>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* Company */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Company</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[380px] gap-2 p-4">
                      <ListItem to="/about" title="About" icon={<Building2 className="h-4 w-4" />}>
                        Our story and mission
                      </ListItem>
                      <ListItem to="/contact" title="Contact" icon={<Mail className="h-4 w-4" />}>
                        Get in touch with our team
                      </ListItem>
                      <ListItem to="/demo" title="Book a Demo" icon={<CalendarCheck className="h-4 w-4" />}>
                        See OptiRFP in action
                      </ListItem>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>

            {/* Desktop Right Side */}
            <div className="hidden md:flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setLoginOpen(true)}>
                <LogIn className="h-4 w-4 mr-2" />
                Login
              </Button>
              <Button size="sm" onClick={() => setSignupOpen(true)}>
                Get Started
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/demo">Book Demo</Link>
              </Button>
            </div>

            {/* Mobile right-side: Login + hamburger */}
            <div className="md:hidden flex items-center gap-1">
              <Button
                variant={isHomePage ? "outline" : "ghost"}
                size="sm"
                onClick={() => openAuth("login")}
                className={cn(
                  "h-9 px-3",
                  isHomePage && "border-white/30 text-white hover:bg-white/10 hover:text-white"
                )}
              >
                <LogIn className="h-4 w-4 mr-1.5" />
                Login
              </Button>

              <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" className="h-10 w-10 p-0" aria-label="Open menu">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="w-[88%] sm:w-[360px] p-0 flex flex-col h-[100dvh]"
                >
                  <div className="flex items-center justify-between px-4 pt-5 pb-3 border-b">
                    <Link to="/" className="flex items-center" onClick={() => setSheetOpen(false)}>
                      <img
                        src="/lovable-uploads/e3257c71-ec26-4f77-b50f-f3115dd1a320.png"
                        alt="OptiRFP"
                        className="h-8 w-auto"
                      />
                    </Link>
                  </div>

                  <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-[env(safe-area-inset-bottom)]">
                    {/* Primary CTAs at the top */}
                    <div className="flex flex-col gap-2 py-4">
                      <Button className="w-full h-11" onClick={() => openAuth("signup")}>
                        Get Started — Free
                      </Button>
                      <Button variant="outline" className="w-full h-11" onClick={() => openAuth("login")}>
                        <LogIn className="h-4 w-4 mr-2" />
                        Login
                      </Button>
                      <Button variant="ghost" className="w-full h-11" asChild>
                        <Link to="/demo" onClick={() => setSheetOpen(false)}>
                          <CalendarCheck className="h-4 w-4 mr-2" />
                          Book a Demo
                        </Link>
                      </Button>
                    </div>

                    <Separator />

                    <nav className="flex flex-col gap-1 py-2">
                      <MobileSection title="Product">
                        <MobileLink to="/#features" icon={<Zap className="h-4 w-4" />}>Features</MobileLink>
                        <MobileLink to="/pricing" icon={<DollarSign className="h-4 w-4" />}>Pricing</MobileLink>
                        <MobileLink to="/integrations" icon={<Puzzle className="h-4 w-4" />}>Integrations</MobileLink>
                        <MobileLink to="/security" icon={<ShieldCheck className="h-4 w-4" />}>Security</MobileLink>
                      </MobileSection>

                      <Separator />

                      <MobileSection title="Resources">
                        <MobileLink to="/blog" icon={<BookOpen className="h-4 w-4" />}>Blog</MobileLink>
                        <MobileLink to="/faq" icon={<HelpCircle className="h-4 w-4" />}>FAQ</MobileLink>
                        <MobileLink to="/docs" icon={<FileText className="h-4 w-4" />}>Documentation</MobileLink>
                        <MobileLink to="/tools" icon={<Wrench className="h-4 w-4" />}>Free Tools</MobileLink>
                      </MobileSection>

                      <Separator />

                      <MobileSection title="Company">
                        <MobileLink to="/about" icon={<Building2 className="h-4 w-4" />}>About</MobileLink>
                        <MobileLink to="/contact" icon={<Mail className="h-4 w-4" />}>Contact</MobileLink>
                      </MobileSection>

                      {/* Bottom spacer so last items aren't hidden behind browser chrome */}
                      <div className="h-8" />
                    </nav>
                  </div>
                </SheetContent>
              </Sheet>
            </div>

          </div>
        </div>
      </header>

      {/* Login Dialog */}
      <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
        <DialogContent className="sm:max-w-md">
          <ErrorBoundary name="LoginModal">
            <AuthForm defaultView="sign_in" variant="dialog" />
          </ErrorBoundary>
        </DialogContent>
      </Dialog>


      {/* Signup Dialog */}
      <Dialog open={signupOpen} onOpenChange={setSignupOpen}>
        <DialogContent className="sm:max-w-md">
          <ErrorBoundary name="SignupModal">
            <AuthForm defaultView="sign_up" variant="dialog" />
          </ErrorBoundary>
        </DialogContent>
      </Dialog>
    </>
  );
}

function MobileSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-2 py-3">
      <h3 className="mb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {title}
      </h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function MobileLink({
  to,
  icon,
  children,
}: {
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <SheetClose asChild>
      <Link
        to={to}
        className="flex items-center gap-3 min-h-[48px] py-3 px-3 text-sm rounded-lg hover:bg-muted active:bg-muted/70 transition-colors"
      >
        <span className="text-muted-foreground">{icon}</span>
        {children}
      </Link>
    </SheetClose>
  );
}
