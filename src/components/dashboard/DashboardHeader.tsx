
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, Settings, Book, User, AlertCircle } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { UserFeedbackDialog } from "@/components/feedback/UserFeedbackDialog";

export function DashboardHeader() {
  const { signOut } = useAuth();
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  
  return (
    <header className="">
      <div className="flex h-16 items-center px-4">
        <div className="ml-0 mr-auto">
          <h1 className="text-lg font-medium">Welcome to OptiRFP</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setFeedbackOpen(true)}
            title="Report an issue"
          >
            <AlertCircle className="h-5 w-5" />
            <span className="sr-only">Report an issue</span>
          </Button>
          
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
      
      {/* User feedback dialog */}
      <UserFeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </header>
  );
}
