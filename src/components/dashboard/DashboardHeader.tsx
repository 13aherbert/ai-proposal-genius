
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PlusCircle, Database, CalendarDays, Milestone, ClipboardEdit, Lock, PanelLeft, Users } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useSubscriptionFeatures } from '@/hooks/use-subscription-features';
import { adminService } from '@/services/AdminService';

export default function DashboardHeader() {
  const navigate = useNavigate();
  const { hasFeature } = useSubscriptionFeatures();
  const [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(() => {
    const checkAdminStatus = async () => {
      const adminStatus = await adminService.isAdmin();
      setIsAdmin(adminStatus);
    };
    
    checkAdminStatus();
  }, []);

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center py-6 gap-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back to your project workspace.</p>
      </div>
      <div className="flex flex-col md:flex-row items-center gap-2">
        {isAdmin && (
          <Button 
            variant="outline" 
            className="w-full md:w-auto"
            onClick={() => navigate('/admin')}
          >
            <Users className="mr-2 h-4 w-4" />
            Admin Dashboard
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="w-full md:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create New
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => navigate('/upload-rfp')}>
              <Database className="mr-2 h-4 w-4" />
              <span>New Project from RFP</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigate('/knowledge-base')}
              disabled={!hasFeature('data_export')}
            >
              <ClipboardEdit className="mr-2 h-4 w-4" />
              <span>Add Knowledge Entry</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
