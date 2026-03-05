
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { NetworkStatusProvider } from "@/hooks/network";
import { SubscriptionProvider } from "@/hooks/subscription";
import { useAnalytics } from "@/hooks/use-analytics";
import React from "react";

// Pages
import Index from "@/pages/Index";
import Dashboard from "@/pages/Dashboard";
import NotFound from "@/pages/NotFound";
import UploadRFP from "@/pages/UploadRFP";
import RecentProjects from "@/pages/RecentProjects";
import ProjectDetails from "@/pages/ProjectDetails";
import Subscription from "@/pages/Subscription";
import SubscriptionSuccess from "@/pages/SubscriptionSuccess";
import KnowledgeBase from "@/pages/KnowledgeBase";
import ResetPassword from "@/pages/ResetPassword";
import Documentation from "@/pages/Documentation";
import AccountSettings from "@/pages/AccountSettings";
import AdminDashboard from "@/pages/AdminDashboard";
import SetInitialAdmin from "@/pages/SetInitialAdmin";
import UserManagementPage from "@/pages/admin/UserManagementPage";
import Organization from "@/pages/Organization";
import WhiteLabel from "@/pages/WhiteLabel";
import Opportunities from "@/pages/Opportunities";
import ApiDocs from "@/pages/ApiDocs";

// Components
import { AuthProvider } from "@/components/AuthProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { NetworkStatusIndicator } from './components/NetworkStatusIndicator';
import { RecentProjectsRedirect, ProjectDetailsRedirect } from "./components/routing/Redirects";
import { SecurityProvider } from "@/components/security/SecurityProvider";

// Layouts
import DashboardLayout from "@/layouts/DashboardLayout";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function AppContent() {
  // Initialize analytics tracking for route changes
  useAnalytics();
  
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      
      {/* All authenticated routes share DashboardLayout */}
      <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/upload-rfp" element={<UploadRFP />} />
        <Route path="/projects" element={<RecentProjects />} />
        <Route path="/projects/:projectId" element={<ProjectDetails />} />
        <Route path="/subscription" element={<Subscription />} />
        <Route path="/subscription/success" element={<SubscriptionSuccess />} />
        <Route path="/knowledge-base" element={<KnowledgeBase />} />
        <Route path="/account-settings" element={<AccountSettings />} />
        <Route path="/organization" element={<Organization />} />
        <Route path="/white-label" element={<WhiteLabel />} />
        <Route path="/opportunities" element={<Opportunities />} />
        <Route path="/api-docs" element={<ApiDocs />} />
        
        {/* Legacy route redirects */}
        <Route path="/recent-projects" element={<RecentProjectsRedirect />} />
        <Route path="/project/:projectId" element={<ProjectDetailsRedirect />} />
      </Route>
      
      {/* Admin Routes */}
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/users" element={<UserManagementPage />} />
      
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/docs" element={<Documentation />} />
      <Route path="/docs/:docId" element={<Documentation />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <NetworkStatusProvider>
          <BrowserRouter>
            <AuthProvider>
              <SecurityProvider>
                <SubscriptionProvider>
                  <ErrorBoundary>
                    <AppContent />
                  </ErrorBoundary>
                  <Toaster position="bottom-right" richColors closeButton visibleToasts={3} duration={4000} />
                  <NetworkStatusIndicator />
                </SubscriptionProvider>
              </SecurityProvider>
            </AuthProvider>
          </BrowserRouter>
        </NetworkStatusProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
