
import React from 'react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { UserRole } from "@/services/admin/types";

interface UserRoleManagerProps {
  userId: string;
  userRoles: UserRole[];
  selectedRole: UserRole | null;
  setSelectedRole: (role: UserRole | null) => void;
  handleAssignRole: (userId: string, role: UserRole) => Promise<boolean>;
  handleRemoveRole: (userId: string, role: UserRole) => Promise<boolean>;
  isEditing: boolean;
}

/**
 * Component for managing user roles (adding/removing)
 */
export function UserRoleManager({
  userId,
  userRoles,
  selectedRole,
  setSelectedRole,
  handleAssignRole,
  handleRemoveRole,
  isEditing
}: UserRoleManagerProps) {
  const availableRoles: UserRole[] = ['admin', 'beta_tester', 'user'];
  const unassignedRoles = availableRoles.filter(role => !userRoles.includes(role));

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 mb-2">
        {userRoles.map(role => (
          <Badge key={role} className="px-2 py-1">
            {role}
            {isEditing && role !== 'user' && (
              <button
                onClick={() => handleRemoveRole(userId, role)}
                className="ml-2 text-xs hover:text-red-300"
              >
                ×
              </button>
            )}
          </Badge>
        ))}
      </div>
      
      {isEditing && unassignedRoles.length > 0 && (
        <div className="flex space-x-2 items-center">
          <Select
            value={selectedRole || ""}
            onValueChange={(value) => setSelectedRole(value as UserRole)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              {unassignedRoles.map(role => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            disabled={!selectedRole}
            onClick={() => {
              if (selectedRole) {
                handleAssignRole(userId, selectedRole);
                setSelectedRole(null);
              }
            }}
          >
            Assign Role
          </Button>
        </div>
      )}
    </div>
  );
}
