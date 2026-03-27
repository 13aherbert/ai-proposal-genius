import React from "react";
import { Outlet, useLocation, Link, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";
import useUserRoles from "@/hooks/user-roles";
import { Loader2, ShieldAlert, LayoutDashboard, Users, FolderKanban, Shield, CreditCard, Settings, ArrowLeft, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const adminNavItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Users", url: "/admin/users", icon: Users },
  { title: "Projects", url: "/admin/projects", icon: FolderKanban },
  { title: "Security & Audit", url: "/admin/security", icon: Shield },
  { title: "Billing", url: "/admin/billing", icon: CreditCard },
  { title: "Settings", url: "/admin/settings", icon: Settings },
  { title: "Source Health", url: "/admin/source-health", icon: Activity },
];

export default function AdminLayout() {
  const { isAdmin, isCheckingRoles } = useUserRoles();
  const location = useLocation();
  const navigate = useNavigate();

  if (isCheckingRoles) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center space-y-6 max-w-md">
            <div className="mx-auto w-20 h-20 rounded-full bg-muted flex items-center justify-center">
              <Shield className="h-10 w-10 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Admin Access Required</h1>
              <p className="text-muted-foreground leading-relaxed">
                This area is reserved for team administrators. If you need admin access, please contact your organization's OptiRFP administrator or email{" "}
                <a href="mailto:support@optirfp.ai" className="text-primary hover:underline">support@optirfp.ai</a>.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
              <Button variant="outline" asChild>
                <a href="mailto:support@optirfp.ai">Contact Support</a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isActive = (path: string) =>
    path === "/admin" ? location.pathname === "/admin" : location.pathname.startsWith(path);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <SidebarProvider>
        <div className="flex flex-1 w-full">
          <Sidebar collapsible="icon" className="border-r">
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>Admin</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {adminNavItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive(item.url)}
                        >
                          <Link to={item.url}>
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>

              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <Link to="/dashboard">
                          <ArrowLeft className="h-4 w-4" />
                          <span>Back to App</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>

          <main className="flex-1 overflow-auto">
            <div className="flex items-center h-12 border-b px-4">
              <SidebarTrigger />
            </div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <Outlet />
            </div>
          </main>
        </div>
      </SidebarProvider>
      <Footer />
    </div>
  );
}
