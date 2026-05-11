
import React from 'react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface UserSubscriptionManagerProps {
  userId: string;
  currentPlan: string | null;
  currentStatus: string | null;
  selectedPlan: string | null;
  setSelectedPlan: (plan: string | null) => void;
  selectedStatus: string | null;
  setSelectedStatus: (status: string | null) => void;
  handleUpdateSubscription: (userId: string, plan: string, status: string) => Promise<void>;
  isEditing: boolean;
}

/**
 * Component for managing user subscription plans and status
 */
export function UserSubscriptionManager({
  userId,
  currentPlan,
  currentStatus,
  selectedPlan,
  setSelectedPlan,
  selectedStatus,
  setSelectedStatus,
  handleUpdateSubscription,
  isEditing
}: UserSubscriptionManagerProps) {
  const plans = ['starter', 'growth', 'business', 'enterprise'];
  const statuses = ['trialing', 'active', 'canceled', 'past_due'];

  const isPaid = currentPlan === 'business' || currentPlan === 'enterprise' || currentPlan === 'growth';

  return (
    <div className="space-y-3">
      <div>
        {currentPlan ? (
          <Badge variant={isPaid ? 'default' : 'secondary'} className="px-2 py-1 capitalize">
            {currentPlan}
          </Badge>
        ) : (
          <Badge variant="outline" className="px-2 py-1">
            No plan
          </Badge>
        )}
        {' '}
        {currentStatus && (
          <Badge 
            variant={
              currentStatus === 'active' ? 'success' : 
              currentStatus === 'trialing' ? 'secondary' : 
              'outline'
            } 
            className="px-2 py-1"
          >
            {currentStatus}
          </Badge>
        )}
      </div>
      
      {isEditing && (
        <div className="flex flex-col space-y-2">
          <div className="flex space-x-2">
            <Select
              value={selectedPlan || ""}
              onValueChange={(value) => setSelectedPlan(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select plan" />
              </SelectTrigger>
              <SelectContent>
                {plans.map(plan => (
                  <SelectItem key={plan} value={plan}>
                    {plan}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select
              value={selectedStatus || ""}
              onValueChange={(value) => setSelectedStatus(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {statuses.map(status => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            disabled={!selectedPlan || !selectedStatus}
            onClick={() => {
              if (selectedPlan && selectedStatus) {
                handleUpdateSubscription(userId, selectedPlan, selectedStatus);
              }
            }}
          >
            Update Subscription
          </Button>
        </div>
      )}
    </div>
  );
}
