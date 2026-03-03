
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { useProfile } from "@/hooks/use-profile";
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
} from "lucide-react";

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a"> & { title: string }
>(({ className, title, children, ...props }, ref) => (
  <li>
    <NavigationMenuLink asChild>
      <a
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
      </a>
    </NavigationMenuLink>
  </li>
));
ListItem.displayName = "ListItem";

export function Navbar() {
  const { session, signOut } = useAuth();
  const { profileData } = useProfile();
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
                        <ListItem href="/projects" title="New Project">
                          Start a new proposal project from scratch
                        </ListItem>
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>

                  {/* Manage */}
                  <NavigationMenuItem>
                    <NavigationMenuTrigger
                      className={cn(
                        isActiveGroup("/projects", "/knowledge-base", "/organization") &&
                          "font-semibold text-foreground"
                      )}
                    >
                      Manage
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid w-[400px] gap-3 p-4">
                        <ListItem href="/projects" title="Projects">
                          View and manage all your proposal projects
                        </ListItem>
                        <ListItem href="/knowledge-base" title="Knowledge Base">
                          Manage your content library and templates
                        </ListItem>
                        {showOrg && (
                          <ListItem href="/organization" title="Organization">
                            Manage team settings and members
                          </ListItem>
                        )}
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>

                  {/* Discover */}
                  <NavigationMenuItem>
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
          <div className="hidden md:flex items-center">
            {session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
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
                    <Link to="/account-settings" className="w-full cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Account Settings
                    </Link>
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
                <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[350px]">
                <nav className="flex flex-col gap-2 mt-6">
                  {/* Dashboard */}
                  <SheetClose asChild>
                    <Link
                      to="/dashboard"
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 text-sm rounded-md hover:bg-muted",
                        isActive("/dashboard") && "font-semibold text-foreground bg-muted"
                      )}
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                    </Link>
                  </SheetClose>

                  <Separator />

                  {/* Create */}
                  <div className="px-2 py-2">
                    <h3 className="mb-1 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Create
                    </h3>
                    <div className="space-y-1">
                      <SheetClose asChild>
                        <Link
                          to="/upload-rfp"
                          className={cn(
                            "flex items-center gap-3 px-4 py-3 text-sm rounded-md hover:bg-muted",
                            isActive("/upload-rfp") && "font-semibold text-foreground bg-muted"
                          )}
                        >
                          <Upload className="h-4 w-4" />
                          Upload RFP
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link
                          to="/projects"
                          className="flex items-center gap-3 px-4 py-3 text-sm rounded-md hover:bg-muted"
                        >
                          <Plus className="h-4 w-4" />
                          New Project
                        </Link>
                      </SheetClose>
                    </div>
                  </div>

                  <Separator />

                  {/* Manage */}
                  <div className="px-2 py-2">
                    <h3 className="mb-1 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Manage
                    </h3>
                    <div className="space-y-1">
                      <SheetClose asChild>
                        <Link
                          to="/projects"
                          className={cn(
                            "flex items-center gap-3 px-4 py-3 text-sm rounded-md hover:bg-muted",
                            isActive("/projects") && "font-semibold text-foreground bg-muted"
                          )}
                        >
                          <Folder className="h-4 w-4" />
                          Projects
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link
                          to="/knowledge-base"
                          className={cn(
                            "flex items-center gap-3 px-4 py-3 text-sm rounded-md hover:bg-muted",
                            isActive("/knowledge-base") && "font-semibold text-foreground bg-muted"
                          )}
                        >
                          <Database className="h-4 w-4" />
                          Knowledge Base
                        </Link>
                      </SheetClose>
                      {showOrg && (
                        <SheetClose asChild>
                          <Link
                            to="/organization"
                            className={cn(
                              "flex items-center gap-3 px-4 py-3 text-sm rounded-md hover:bg-muted",
                              isActive("/organization") && "font-semibold text-foreground bg-muted"
                            )}
                          >
                            <Building2 className="h-4 w-4" />
                            Organization
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
                        "flex items-center gap-3 px-4 py-3 text-sm rounded-md hover:bg-muted",
                        isActive("/opportunities") && "font-semibold text-foreground bg-muted"
                      )}
                    >
                      <Search className="h-4 w-4" />
                      Discover
                    </Link>
                  </SheetClose>

                  <Separator />

                  {/* Account */}
                  <div className="space-y-1">
                    <SheetClose asChild>
                      <Link
                        to="/account-settings"
                        className="flex items-center gap-3 px-4 py-3 text-sm rounded-md hover:bg-muted"
                      >
                        <User className="h-4 w-4" />
                        Account Settings
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 px-4 py-3 text-sm rounded-md hover:bg-muted w-full text-left"
                      >
                        <LogOut className="h-4 w-4" />
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
