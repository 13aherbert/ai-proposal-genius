
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  industry?: string;
  setIndustry?: (industry: string) => void;
}

const INDUSTRIES = [
  { id: "technology", name: "Technology & Software" },
  { id: "healthcare", name: "Healthcare & Medicine" },
  { id: "finance", name: "Finance & Banking" },
  { id: "education", name: "Education & Training" },
  { id: "retail", name: "Retail & E-Commerce" },
  { id: "manufacturing", name: "Manufacturing & Industrial" },
  { id: "legal", name: "Legal Services" },
  { id: "marketing", name: "Marketing & Advertising" },
  { id: "construction", name: "Construction & Engineering" },
  { id: "hospitality", name: "Hospitality & Tourism" },
  { id: "other", name: "Other Industry" }
];

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
  setBirthday = () => {},
  industry = "",
  setIndustry = () => {}
}: ProfileCardProps) {
  const [showCustomIndustry, setShowCustomIndustry] = useState(false);
  const [customIndustry, setCustomIndustry] = useState("");
  
  useEffect(() => {
    // Check if the industry is not in our predefined list
    const isStandardIndustry = INDUSTRIES.some(ind => ind.id === industry);
    
    if (!isStandardIndustry && industry) {
      setShowCustomIndustry(true);
      setCustomIndustry(industry);
    } else {
      setShowCustomIndustry(industry === 'other');
    }
  }, [industry]);
  
  const handleIndustryChange = (value: string) => {
    setIndustry(value);
    setShowCustomIndustry(value === 'other');
    
    if (value !== 'other') {
      setCustomIndustry("");
    }
  };
  
  const handleCustomIndustryChange = (value: string) => {
    setCustomIndustry(value);
    setIndustry(value);
  };

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
          <Label htmlFor="industry">Industry</Label>
          <Select 
            value={showCustomIndustry ? 'other' : industry} 
            onValueChange={handleIndustryChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select your industry" />
            </SelectTrigger>
            <SelectContent>
              {INDUSTRIES.map((ind) => (
                <SelectItem key={ind.id} value={ind.id}>
                  {ind.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {showCustomIndustry && (
          <div className="space-y-2">
            <Label htmlFor="custom-industry">Specify Your Industry</Label>
            <Input
              id="custom-industry"
              value={customIndustry}
              onChange={(e) => handleCustomIndustryChange(e.target.value)}
              placeholder="Enter your industry"
            />
          </div>
        )}
        
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
