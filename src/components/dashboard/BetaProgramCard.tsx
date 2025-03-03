
import { BugIcon, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

export function BetaProgramCard() {
  const navigate = useNavigate();
  
  return (
    <Card className="border-dashed border-primary/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center">
            <span className="bg-primary/10 p-1.5 rounded-full mr-2">
              <BugIcon className="h-4 w-4 text-primary" />
            </span>
            Beta Testing Program
          </CardTitle>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">New</Badge>
        </div>
        <CardDescription>Help shape the future of OptiRFP</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm">Join our beta testing program to get early access to new features and provide valuable feedback.</p>
        <div className="mt-3 space-y-2">
          <div className="flex items-center text-sm">
            <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
            <span>Early access to new features</span>
          </div>
          <div className="flex items-center text-sm">
            <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
            <span>Influence product development</span>
          </div>
          <div className="flex items-center text-sm">
            <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
            <span>Priority support during beta</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          onClick={() => navigate('/beta')}
        >
          Join Beta Program
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </CardFooter>
    </Card>
  );
}

// Add necessary imports at the top
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";
