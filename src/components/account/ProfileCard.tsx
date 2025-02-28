
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "lucide-react";
import { Label } from "@/components/ui/label";

interface ProfileCardProps {
  username: string;
  setUsername: (username: string) => void;
  firstName?: string;
  setFirstName?: (firstName: string) => void;
  lastName?: string;
  setLastName?: (lastName: string) => void;
  businessName?: string;
  setBusinessName?: (businessName: string) => void;
  birthday?: string;
  setBirthday?: (birthday: string) => void;
}

/**
 * ProfileCard component - Allows users to update their profile information
 */
export function ProfileCard({ 
  username, 
  setUsername,
  firstName = "",
  setFirstName = () => {},
  lastName = "",
  setLastName = () => {},
  businessName = "",
  setBusinessName = () => {},
  birthday = "",
  setBirthday = () => {}
}: ProfileCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Profile Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Enter your first name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Enter your last name"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="businessName">Business Name</Label>
          <Input
            id="businessName"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="Enter your business name"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="birthday">Birthday</Label>
          <Input
            id="birthday"
            type="date"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
