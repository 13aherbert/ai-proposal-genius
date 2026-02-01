
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
import BetaProgram from "@/pages/BetaProgram";
import BetaRoadmap from "@/pages/BetaRoadmap";
import AdminDashboard from "@/pages/AdminDashboard";
import SetInitialAdmin from "@/pages/SetInitialAdmin";
import UserManagementPage from "@/pages/admin/UserManagementPage"; // Changed to page component
import BetaInvitationsPage from "@/pages/admin/BetaInvitationsPage"; // Changed to page component
import BetaRequests from "@/pages/admin/BetaRequests";
import Organization from "@/pages/Organization";
import WhiteLabel from "@/pages/WhiteLabel";

// Components
import { AuthProvider } from "@/components/AuthProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { NetworkStatusIndicator } from './components/NetworkStatusIndicator';
import { RecentProjectsRedirect, ProjectDetailsRedirect, BetaInviteRedirect } from "./components/routing/Redirects";
import { SecurityProvider } from "@/components/security/SecurityProvider";

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
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/upload-rfp"
        element={
          <ProtectedRoute>
            <UploadRFP />
          </ProtectedRoute>
        }
      />
      
      {/* Primary project routes */}
      <Route
        path="/projects"
        element={
          <ProtectedRoute>
            <RecentProjects />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/:projectId"
        element={
          <ProtectedRoute>
            <ProjectDetails />
          </ProtectedRoute>
        }
      />
      
      {/* Legacy route redirects for backward compatibility */}
      <Route
        path="/recent-projects"
        element={
          <ProtectedRoute>
            <RecentProjectsRedirect />
          </ProtectedRoute>
        }
      />
      <Route
        path="/project/:projectId"
        element={
          <ProtectedRoute>
            <ProjectDetailsRedirect />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/subscription"
        element={
          <ProtectedRoute>
            <Subscription />
          </ProtectedRoute>
        }
      />
      <Route
        path="/subscription/success"
        element={
          <ProtectedRoute>
            <SubscriptionSuccess />
          </ProtectedRoute>
        }
      />
      <Route
        path="/knowledge-base"
        element={
          <ProtectedRoute>
            <KnowledgeBase />
          </ProtectedRoute>
        }
      />
      <Route
        path="/account-settings"
        element={
          <ProtectedRoute>
            <AccountSettings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/organization"
        element={
          <ProtectedRoute>
            <Organization />
          </ProtectedRoute>
        }
      />
      <Route
        path="/white-label"
        element={
          <ProtectedRoute>
            <WhiteLabel />
          </ProtectedRoute>
        }
      />
      
      {/* Beta Testing Routes - Changed BetaProgram to not require authentication */}
      <Route path="/beta" element={<BetaProgram />} />
      <Route
        path="/beta/dashboard"
        element={
          <ProtectedRoute>
            <BetaProgram />
          </ProtectedRoute>
        }
      />
      <Route
        path="/beta/roadmap"
        element={
          <ProtectedRoute>
            <BetaRoadmap />
          </ProtectedRoute>
        }
      />
      
      {/* Legacy beta invite redirect */}
      <Route path="/beta-invite" element={<BetaInviteRedirect />} />
      
      {/* Admin Routes */}
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/users" element={<UserManagementPage />} />
      <Route path="/admin/beta-invitations" element={<BetaInvitationsPage />} />
      <Route path="/admin/beta-requests" element={<BetaRequests />} />
      
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
                  <Toaster position="top-right" richColors closeButton />
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
