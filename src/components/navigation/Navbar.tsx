import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { useProfile } from "@/hooks/use-profile";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
import {
  Menu,
  Plus,
  User,
  LogOut,
  DollarSign,
  Mail,
  BarChart3,
  Building2,
  Code2,
  Settings,
  Compass,
  RotateCcw,
  Shield,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AccessibilitySettings } from "@/components/accessibility/AccessibilitySettings";
import { HelpFeedbackLauncher } from "@/components/feedback/HelpFeedbackLauncher";
import useUserRoles from "@/hooks/user-roles";

type NavItem = { label: string; to: string; matches?: string[] };

const PRIMARY_NAV: NavItem[] = [
  { label: "Home", to: "/dashboard" },
  { label: "Proposals", to: "/projects", matches: ["/projects"] },
  { label: "Library", to: "/knowledge-base", matches: ["/knowledge-base"] },
  { label: "Find work", to: "/opportunities", matches: ["/opportunities"] },
];

export function Navbar() {
  const { session, signOut } = useAuth();
  const { profileData } = useProfile();
  const location = useLocation();
  const navigate = useNavigate();
  const { showAdminButton } = useUserRoles();

  const initials =
    ((profileData.first_name?.[0] || "") + (profileData.last_name?.[0] || "")).toUpperCase() || "U";

  const isActive = (item: NavItem) => {
    if (location.pathname === item.to) return true;
    return (item.matches || []).some((p) => location.pathname.startsWith(p));
  };

  const showOrg =
    profileData.organization_size === "enterprise" ||
    profileData.organization_size === "white_label";

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Left: logo + primary nav */}
        <div className="flex items-center gap-8">
          <Link to="/dashboard" className="flex items-center" aria-label="OptiRFP home">
            <img
              src="/lovable-uploads/e3257c71-ec26-4f77-b50f-f3115dd1a320.png"
              alt="OptiRFP"
              className="h-7 w-auto"
            />
          </Link>

          {session && (
            <nav className="hidden md:flex items-center gap-1">
              {PRIMARY_NAV.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "px-3 py-1.5 text-sm rounded-md transition-colors",
                    isActive(item)
                      ? "text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          )}
        </div>

        {/* Right: primary CTA + help + avatar */}
        <div className="flex items-center gap-1">
          {session && (
            <>
              <Button
                size="sm"
                onClick={() => navigate("/upload-rfp")}
                className="hidden sm:inline-flex h-9 rounded-full px-4 gap-1.5"
              >
                <Plus className="h-4 w-4" />
                New proposal
              </Button>

              <div className="hidden md:block">
                <HelpFeedbackLauncher variant="inline" />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button data-tour="user-menu" variant="ghost" className="hidden md:inline-flex relative h-9 w-9 rounded-full p-0">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-60" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {profileData.first_name || profileData.username || "User"}{" "}
                        {profileData.last_name || ""}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground truncate">
                        {session.user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/account" className="w-full cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Account
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/subscription" className="w-full cursor-pointer">
                      <DollarSign className="mr-2 h-4 w-4" />
                      Plan & billing
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/analytics" className="w-full cursor-pointer">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Analytics
                    </Link>
                  </DropdownMenuItem>
                  {showOrg && (
                    <DropdownMenuItem asChild>
                      <Link to="/organization" className="w-full cursor-pointer">
                        <Building2 className="mr-2 h-4 w-4" />
                        Organization
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {showOrg && (
                    <DropdownMenuItem asChild>
                      <Link to="/api-docs" className="w-full cursor-pointer">
                        <Code2 className="mr-2 h-4 w-4" />
                        API
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/help" className="w-full cursor-pointer">
                      <Mail className="mr-2 h-4 w-4" />
                      Help & support
                    </Link>
                  </DropdownMenuItem>
                  <div className="px-2 py-1.5 flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground flex items-center gap-2">
                      <Settings className="h-3.5 w-3.5" />
                      Display
                    </span>
                    <div className="flex items-center gap-1">
                      <AccessibilitySettings />
                      <ThemeToggle />
                    </div>
                  </div>
                  <DropdownMenuItem
                    onClick={() => window.dispatchEvent(new CustomEvent("restart-product-tour"))}
                    className="cursor-pointer"
                  >
                    <Compass className="mr-2 h-4 w-4" />
                    Restart tour
                  </DropdownMenuItem>
                  {(localStorage.getItem("onboarding_skipped") === "true" ||
                    localStorage.getItem("onboarding_completed") !== "true") && (
                    <DropdownMenuItem
                      onClick={() => window.dispatchEvent(new CustomEvent("reopen-onboarding"))}
                      className="cursor-pointer"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Restart setup
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}

          {/* Mobile hamburger */}
          {session && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" className="md:hidden h-10 w-10 p-0" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[340px]">
                <div className="flex items-center gap-3 px-2 py-4 mt-4">
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

                <Separator className="my-2" />

                <SheetClose asChild>
                  <Link
                    to="/upload-rfp"
                    className="flex items-center gap-3 min-h-[52px] px-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Plus className="h-5 w-5" />
                    New proposal
                  </Link>
                </SheetClose>

                <nav className="flex flex-col gap-0.5 mt-3">
                  {PRIMARY_NAV.map((item) => (
                    <SheetClose asChild key={item.to}>
                      <Link
                        to={item.to}
                        className={cn(
                          "flex items-center min-h-[52px] px-3 text-base rounded-lg",
                          isActive(item) ? "bg-muted font-medium" : "hover:bg-muted"
                        )}
                      >
                        {item.label}
                      </Link>
                    </SheetClose>
                  ))}

                  <Separator className="my-2" />

                  <SheetClose asChild>
                    <Link to="/account" className="flex items-center gap-3 min-h-[52px] px-3 rounded-lg hover:bg-muted text-sm">
                      <User className="h-4 w-4 text-muted-foreground" /> Account
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link to="/subscription" className="flex items-center gap-3 min-h-[52px] px-3 rounded-lg hover:bg-muted text-sm">
                      <DollarSign className="h-4 w-4 text-muted-foreground" /> Plan & billing
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link to="/help" className="flex items-center gap-3 min-h-[52px] px-3 rounded-lg hover:bg-muted text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" /> Help & support
                    </Link>
                  </SheetClose>

                  <div className="flex items-center justify-between px-3 py-3">
                    <span className="text-sm text-muted-foreground">Display</span>
                    <div className="flex items-center gap-1">
                      <AccessibilitySettings />
                      <ThemeToggle />
                    </div>
                  </div>

                  <Separator className="my-2" />

                  <SheetClose asChild>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-3 min-h-[52px] px-3 rounded-lg hover:bg-destructive/10 text-sm text-destructive w-full text-left"
                    >
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  </SheetClose>
                </nav>
              </SheetContent>
            </Sheet>
          )}

          {!session && (
            <Link to="/">
              <Button size="sm">Sign In</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
