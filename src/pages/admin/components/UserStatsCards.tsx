
import React, { useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { UserProfile } from "@/services/admin/types";
import { Users, Activity, TestTube, Shield } from "lucide-react";

interface UserStatsCardsProps {
  users: UserProfile[];
}

export function UserStatsCards({ users }: UserStatsCardsProps) {
  const stats = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const totalUsers = users.length;
    
    const activeUsers = users.filter(user => {
      if (!user.lastActivityAt) return false;
      const lastActive = new Date(user.lastActivityAt);
      return lastActive >= thirtyDaysAgo;
    }).length;
    
    const betaTesters = users.filter(user => 
      user.roles.includes('beta_tester')
    ).length;
    
    const admins = users.filter(user => 
      user.roles.includes('admin') || user.roles.includes('system_admin')
    ).length;
    
    const activePercentage = totalUsers > 0 
      ? Math.round((activeUsers / totalUsers) * 100) 
      : 0;
    
    const betaPercentage = totalUsers > 0 
      ? Math.round((betaTesters / totalUsers) * 100) 
      : 0;
    
    return {
      totalUsers,
      activeUsers,
      activePercentage,
      betaTesters,
      betaPercentage,
      admins
    };
  }, [users]);

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Users</p>
              <p className="text-2xl font-bold">{stats.totalUsers}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Activity className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active (30d)</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold">{stats.activeUsers}</p>
                <span className="text-sm text-muted-foreground">{stats.activePercentage}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <TestTube className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Beta Testers</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold">{stats.betaTesters}</p>
                <span className="text-sm text-muted-foreground">{stats.betaPercentage}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <Shield className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Admins</p>
              <p className="text-2xl font-bold">{stats.admins}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
