import React from 'react';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import type { UserRole } from "@/services/admin/types";

export type RoleFilter = 'all' | UserRole;
export type PlanFilter = 'all' | 'starter' | 'growth' | 'business' | 'enterprise' | 'none';
export type StatusFilter = 'all' | 'active' | 'inactive' | 'cancelled';

interface UserFiltersProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  roleFilter: RoleFilter;
  setRoleFilter: (v: RoleFilter) => void;
  planFilter: PlanFilter;
  setPlanFilter: (v: PlanFilter) => void;
  statusFilter: StatusFilter;
  setStatusFilter: (v: StatusFilter) => void;
  resultCount: number;
  totalCount: number;
}

export function UserFilters({
  searchQuery,
  setSearchQuery,
  roleFilter,
  setRoleFilter,
  planFilter,
  setPlanFilter,
  statusFilter,
  setStatusFilter,
  resultCount,
  totalCount,
}: UserFiltersProps) {
  const isFiltered =
    !!searchQuery || roleFilter !== 'all' || planFilter !== 'all' || statusFilter !== 'all';

  const clear = () => {
    setSearchQuery('');
    setRoleFilter('all');
    setPlanFilter('all');
    setStatusFilter('all');
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        placeholder="Search users..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="max-w-xs"
      />

      <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as RoleFilter)}>
        <SelectTrigger className="w-[140px]"><SelectValue placeholder="Role" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All roles</SelectItem>
          <SelectItem value="system_admin">System Admin</SelectItem>
          <SelectItem value="admin">Admin</SelectItem>
          <SelectItem value="user">User</SelectItem>
        </SelectContent>
      </Select>

      <Select value={planFilter} onValueChange={(v) => setPlanFilter(v as PlanFilter)}>
        <SelectTrigger className="w-[140px]"><SelectValue placeholder="Plan" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All plans</SelectItem>
          <SelectItem value="starter">Starter</SelectItem>
          <SelectItem value="growth">Growth</SelectItem>
          <SelectItem value="business">Business</SelectItem>
          <SelectItem value="enterprise">Enterprise</SelectItem>
          <SelectItem value="none">No subscription</SelectItem>
        </SelectContent>
      </Select>

      <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
        <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
          <SelectItem value="cancelled">Cancelled</SelectItem>
        </SelectContent>
      </Select>

      {isFiltered && (
        <Button variant="ghost" size="sm" onClick={clear}>
          <X className="h-3.5 w-3.5 mr-1" /> Clear
        </Button>
      )}

      <span className="ml-auto text-xs text-muted-foreground">
        Showing {resultCount} of {totalCount}
      </span>
    </div>
  );
}
