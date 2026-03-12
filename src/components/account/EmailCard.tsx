
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

interface EmailCardProps {
  email: string;
  setEmail: (email: string) => void;
}

/**
 * EmailCard component - Allows users to update their email address and manage preferences
 */
export function EmailCard({ email, setEmail }: EmailCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [productUpdates, setProductUpdates] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [weeklyDigest, setWeeklyDigest] = useState(true);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-semibold border-b pb-3">
          <Mail className="h-5 w-5" />
          Email Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email Address
          </label>
          {isEditing ? (
            <div className="flex gap-2">
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
              />
              <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{email || "No email set"}</p>
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                Change Email
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-4 pt-2 border-t">
          <h4 className="text-sm font-medium">Email Preferences</h4>
          <div className="flex items-center justify-between">
            <Label htmlFor="product-updates" className="text-sm text-muted-foreground">
              Product Updates
            </Label>
            <Switch id="product-updates" checked={productUpdates} onCheckedChange={setProductUpdates} />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="marketing" className="text-sm text-muted-foreground">
              Marketing Emails
            </Label>
            <Switch id="marketing" checked={marketingEmails} onCheckedChange={setMarketingEmails} />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="weekly-digest" className="text-sm text-muted-foreground">
              Weekly Digest
            </Label>
            <Switch id="weekly-digest" checked={weeklyDigest} onCheckedChange={setWeeklyDigest} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
