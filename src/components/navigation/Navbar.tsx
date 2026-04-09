
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { useProfile } from "@/hooks/use-profile";
import { useCSMContact } from "@/hooks/use-csm-contact";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetTrigger, SheetContent, SheetClose } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import {
  Menu,
  Upload,
  Plus,
  LayoutDashboard,
  Folder,
  Database,
  Search,
  Building2,
  User,
  LogOut,
  Settings,
  Code2,
  RotateCcw,
  DollarSign,
  Crown,
  Mail,
  Calendar,
  Shield,
  BarChart3,
  Compass,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AccessibilitySettings } from "@/components/accessibility/AccessibilitySettings";

const ListItem = React.forwardRef<
  React.ElementRef<typeof Link>,
  React.ComponentPropsWithoutRef<typeof Link> & { title: string }
>(({ className, title, children, ...props }, ref) => (
  <li>
    <NavigationMenuLink asChild>
      <Link
        ref={ref}
        className={cn(
          "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
          className
        )}
        {...props}
      >
        <div className="text-sm font-medium leading-none">{title}</div>
        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
          {children}
        </p>
      </Link>
    </NavigationMenuLink>
  </li>
));
ListItem.displayName = "ListItem";

export function Navbar() {
  const { session, signOut } = useAuth();
  const { profileData } = useProfile();
  const { csm, isEnterprise } = useCSMContact();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
  };

  const initials =
    ((profileData.first_name?.[0] || "") + (profileData.last_name?.[0] || "")).toUpperCase() || "U";

  const isActive = (path: string) => location.pathname === path;
  const isActiveGroup = (...paths: string[]) =>
    paths.some((p) => location.pathname.startsWith(p));

  const showOrg =
    profileData.organization_size === "enterprise" ||
    profileData.organization_size === "white_label";

  return (
    <header className="bg-background border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="flex items-center">
              <img
                src="/lovable-uploads/e3257c71-ec26-4f77-b50f-f3115dd1a320.png"
                alt="OptiRFP Logo"
                className="h-8 sm:h-9 w-auto"
              />
            </Link>

            {/* Desktop Navigation */}
            {session && (
              <NavigationMenu className="hidden md:flex">
                <NavigationMenuList>
                  {/* Dashboard */}
                  <NavigationMenuItem>
                    <Link to="/dashboard">
                      <NavigationMenuLink
                        className={cn(
                          navigationMenuTriggerStyle(),
                          isActive("/dashboard") && "font-semibold text-foreground"
                        )}
                      >
                        Dashboard
                      </NavigationMenuLink>
                    </Link>
                  </NavigationMenuItem>

                  {/* Create */}
                  <NavigationMenuItem>
                    <NavigationMenuTrigger
                      className={cn(
                        isActiveGroup("/upload-rfp") && "font-semibold text-foreground"
                      )}
                    >
                      Create
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] md:grid-cols-[.75fr_1fr]">
                        <li className="row-span-2">
                          <NavigationMenuLink asChild>
                            <Link
                              to="/upload-rfp"
                              className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                            >
                              <Upload className="h-6 w-6 mb-2 text-primary" />
                              <div className="mb-1 text-lg font-medium">Upload RFP</div>
                              <p className="text-sm leading-tight text-muted-foreground">
                                Upload a document and let AI generate your proposal
                              </p>
                            </Link>
                          </NavigationMenuLink>
                        </li>
                        <ListItem to="/projects" title="New Project">
                          Start a new proposal project from scratch
                        </ListItem>
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>

                  {/* Manage */}
                  <NavigationMenuItem data-tour="nav-projects">
                    <NavigationMenuTrigger
                      className={cn(
                        isActiveGroup("/projects", "/knowledge-base", "/organization", "/analytics") &&
                          "font-semibold text-foreground"
                      )}
                    >
                      Manage
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid w-[400px] gap-3 p-4">
                        <ListItem to="/projects" title="Projects">
                          View and manage all your proposal projects
                        </ListItem>
                        <ListItem to="/knowledge-base" title="Knowledge Base" data-tour="nav-knowledge">
                          Manage your content library and templates
                        </ListItem>
                        {showOrg && (
                          <ListItem to="/organization" title="Organization">
                            Manage team settings and members
                          </ListItem>
                        )}
                        {showOrg && (
                          <ListItem to="/api-docs" title="API Documentation">
                            Programmatic access to your data
                          </ListItem>
                        )}
                        <ListItem to="/analytics" title="Analytics">
                          Proposal metrics, ROI, and team performance
                        </ListItem>
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>

                  {/* Discover */}
                  <NavigationMenuItem data-tour="nav-discover">
                    <Link to="/opportunities">
                      <NavigationMenuLink
                        className={cn(
                          navigationMenuTriggerStyle(),
                          isActive("/opportunities") && "font-semibold text-foreground"
                        )}
                      >
                        Discover
                      </NavigationMenuLink>
                    </Link>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
            )}
          </div>

          {/* Desktop profile dropdown */}
          <div className="hidden md:flex items-center gap-2">
            <ThemeToggle />
            {/* Enterprise Badge */}
            {session && isEnterprise && (
              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-semibold hover:bg-amber-500/20 transition-colors">
                    <Crown className="h-3.5 w-3.5" />
                    Enterprise
                  </button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-72 p-0">
                  <div className="p-4 border-b bg-amber-500/5">
                    <p className="text-sm font-semibold text-foreground">Your CSM: {csm.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{csm.email}</p>
                  </div>
                  <div className="p-2 space-y-1">
                    <a
                      href={`mailto:${csm.email}`}
                      className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
                    >
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      Email CSM
                    </a>
                    <a
                      href={csm.calendlyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
                    >
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      Book a Call
                    </a>
                    <Link
                      to="/enterprise-support"
                      className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
                    >
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      Priority Support
                    </Link>
                  </div>
                  <div className="px-4 py-2.5 border-t bg-muted/30">
                    <p className="text-xs text-muted-foreground">4-hour email SLA · Dedicated support</p>
                  </div>
                </PopoverContent>
              </Popover>
            )}
            {session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button data-tour="user-menu" variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {profileData.first_name || profileData.username || "User"}{" "}
                        {profileData.last_name || ""}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {session.user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/account" className="w-full cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Account Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/subscription" className="w-full cursor-pointer">
                      <DollarSign className="mr-2 h-4 w-4" />
                      Plans & Pricing
                    </Link>
                  </DropdownMenuItem>
                  {(localStorage.getItem('onboarding_skipped') === 'true' || localStorage.getItem('onboarding_completed') !== 'true') && (
                    <DropdownMenuItem
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent('reopen-onboarding'));
                      }}
                      className="cursor-pointer"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Restart Onboarding
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('restart-product-tour'));
                    }}
                    className="cursor-pointer"
                  >
                    <Compass className="mr-2 h-4 w-4" />
                    Restart Tour
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/">
                <Button size="sm">Sign In</Button>
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          {session && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" className="md:hidden h-11 w-11 p-0" aria-label="Open menu">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[350px]">
                {/* User profile header */}
                <div className="flex items-center gap-3 px-4 py-4 mt-4 mb-2">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="text-sm">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0">
                    <p className="text-sm font-medium leading-none truncate">
                      {profileData.first_name || profileData.username || "User"}{" "}
                      {profileData.last_name || ""}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground truncate mt-1">
                      {session.user.email}
                    </p>
                  </div>
                </div>

                <Separator />

                <nav className="flex flex-col gap-1 mt-2">
                  {/* Dashboard */}
                  <SheetClose asChild>
                    <Link
                      to="/dashboard"
                      className={cn(
                        "flex items-center gap-4 min-h-[56px] py-4 px-4 text-base rounded-lg active:bg-muted/70 transition-colors",
                        isActive("/dashboard") ? "font-semibold text-foreground bg-muted" : "hover:bg-muted"
                      )}
                    >
                      <LayoutDashboard className="h-5 w-5 text-muted-foreground" />
                      Dashboard
                    </Link>
                  </SheetClose>

                  <Separator />

                  {/* Create */}
                  <div className="px-2 py-3">
                    <h3 className="mb-2 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Create
                    </h3>
                    <div className="space-y-1">
                      <SheetClose asChild>
                        <Link
                          to="/upload-rfp"
                          className={cn(
                            "flex items-center gap-4 min-h-[56px] py-4 px-4 text-base rounded-lg active:bg-muted/70 transition-colors",
                            isActive("/upload-rfp") ? "font-semibold text-foreground bg-muted" : "hover:bg-muted"
                          )}
                        >
                          <Upload className="h-5 w-5 text-muted-foreground" />
                          Upload RFP
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link
                          to="/projects"
                          className="flex items-center gap-4 min-h-[56px] py-4 px-4 text-base rounded-lg hover:bg-muted active:bg-muted/70 transition-colors"
                        >
                          <Plus className="h-5 w-5 text-muted-foreground" />
                          New Project
                        </Link>
                      </SheetClose>
                    </div>
                  </div>

                  <Separator />

                  {/* Manage */}
                  <div className="px-2 py-3">
                    <h3 className="mb-2 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Manage
                    </h3>
                    <div className="space-y-1">
                      <SheetClose asChild>
                        <Link
                          to="/projects"
                          className={cn(
                            "flex items-center gap-4 min-h-[56px] py-4 px-4 text-base rounded-lg active:bg-muted/70 transition-colors",
                            isActive("/projects") ? "font-semibold text-foreground bg-muted" : "hover:bg-muted"
                          )}
                        >
                          <Folder className="h-5 w-5 text-muted-foreground" />
                          Projects
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link
                          to="/knowledge-base"
                          className={cn(
                            "flex items-center gap-4 min-h-[56px] py-4 px-4 text-base rounded-lg active:bg-muted/70 transition-colors",
                            isActive("/knowledge-base") ? "font-semibold text-foreground bg-muted" : "hover:bg-muted"
                          )}
                        >
                          <Database className="h-5 w-5 text-muted-foreground" />
                          Knowledge Base
                        </Link>
                      </SheetClose>
                      {showOrg && (
                        <SheetClose asChild>
                          <Link
                            to="/organization"
                            className={cn(
                              "flex items-center gap-4 min-h-[56px] py-4 px-4 text-base rounded-lg active:bg-muted/70 transition-colors",
                              isActive("/organization") ? "font-semibold text-foreground bg-muted" : "hover:bg-muted"
                            )}
                          >
                            <Building2 className="h-5 w-5 text-muted-foreground" />
                            Organization
                          </Link>
                        </SheetClose>
                      )}
                      {showOrg && (
                        <SheetClose asChild>
                          <Link
                            to="/api-docs"
                            className={cn(
                              "flex items-center gap-4 min-h-[56px] py-4 px-4 text-base rounded-lg active:bg-muted/70 transition-colors",
                              isActive("/api-docs") ? "font-semibold text-foreground bg-muted" : "hover:bg-muted"
                            )}
                          >
                            <Code2 className="h-5 w-5 text-muted-foreground" />
                            API Docs
                          </Link>
                        </SheetClose>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Discover */}
                  <SheetClose asChild>
                    <Link
                      to="/opportunities"
                      className={cn(
                        "flex items-center gap-4 min-h-[56px] py-4 px-4 text-base rounded-lg active:bg-muted/70 transition-colors",
                        isActive("/opportunities") ? "font-semibold text-foreground bg-muted" : "hover:bg-muted"
                      )}
                    >
                      <Search className="h-5 w-5 text-muted-foreground" />
                      Discover
                    </Link>
                  </SheetClose>

                  {/* Analytics */}
                  <SheetClose asChild>
                    <Link
                      to="/analytics"
                      className={cn(
                        "flex items-center gap-4 min-h-[56px] py-4 px-4 text-base rounded-lg active:bg-muted/70 transition-colors",
                        isActive("/analytics") ? "font-semibold text-foreground bg-muted" : "hover:bg-muted"
                      )}
                    >
                      <BarChart3 className="h-5 w-5 text-muted-foreground" />
                      Analytics
                    </Link>
                  </SheetClose>

                   <Separator />

                   {/* Enterprise Priority Support (mobile) */}
                   {isEnterprise && (
                     <SheetClose asChild>
                       <Link
                         to="/enterprise-support"
                         className={cn(
                           "flex items-center gap-4 min-h-[56px] py-4 px-4 text-base rounded-lg active:bg-muted/70 transition-colors",
                           isActive("/enterprise-support") ? "font-semibold text-foreground bg-muted" : "hover:bg-muted"
                         )}
                       >
                         <Crown className="h-5 w-5 text-amber-600" />
                         Priority Support
                       </Link>
                     </SheetClose>
                   )}

                   {isEnterprise && <Separator />}

                   {/* Theme Toggle (mobile) */}
                   <div className="flex items-center gap-4 min-h-[56px] py-2 px-4">
                     <span className="text-sm text-muted-foreground">Theme</span>
                     <ThemeToggle />
                   </div>

                   {/* Account */}
                   <div className="space-y-1 mt-1">
                     <SheetClose asChild>
                      <Link
                        to="/account"
                        className="flex items-center gap-4 min-h-[56px] py-4 px-4 text-base rounded-lg hover:bg-muted active:bg-muted/70 transition-colors"
                      >
                        <User className="h-5 w-5 text-muted-foreground" />
                        Account Settings
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link
                        to="/subscription"
                        className="flex items-center gap-4 min-h-[56px] py-4 px-4 text-base rounded-lg hover:bg-muted active:bg-muted/70 transition-colors"
                      >
                        <DollarSign className="h-5 w-5 text-muted-foreground" />
                        Plans & Pricing
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <button
                        onClick={() => window.dispatchEvent(new CustomEvent('restart-product-tour'))}
                        className="flex items-center gap-4 min-h-[56px] py-4 px-4 text-base rounded-lg hover:bg-muted active:bg-muted/70 transition-colors w-full text-left"
                      >
                        <Compass className="h-5 w-5 text-muted-foreground" />
                        Restart Tour
                      </button>
                    </SheetClose>
                    <SheetClose asChild>
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-4 min-h-[56px] py-4 px-4 text-base rounded-lg hover:bg-destructive/10 active:bg-destructive/20 transition-colors w-full text-left text-destructive"
                      >
                        <LogOut className="h-5 w-5" />
                        Sign Out
                      </button>
                    </SheetClose>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>
    </header>
  );
}
