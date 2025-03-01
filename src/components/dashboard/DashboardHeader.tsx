
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, Settings, Book, User } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function DashboardHeader() {
  const { signOut } = useAuth();
  
  return (
    <header className="border-b">
      <div className="flex h-16 items-center px-4">
        <Link to="/dashboard" className="flex items-center gap-2">
          <img src="/favicon-32x32.png" alt="Logo" className="w-8 h-8" />
          <span className="font-semibold">RFP Generator</span>
        </Link>
        <nav className="mx-6 flex items-center space-x-4 lg:space-x-6 hidden md:block">
          <Button asChild variant="ghost">
            <Link to="/dashboard">Dashboard</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link to="/projects">Projects</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link to="/knowledge-base">Knowledge Base</Link>
          </Button>
        </nav>
        <div className="ml-auto flex items-center space-x-4">
          <Button asChild variant="ghost" size="icon">
            <Link to="/docs">
              <Book className="h-5 w-5" />
              <span className="sr-only">Documentation</span>
            </Link>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
                <span className="sr-only">User menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/account-settings" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
