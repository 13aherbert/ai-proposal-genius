
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { NetworkStatusProvider } from "@/hooks/network";
import { SubscriptionProvider } from "@/hooks/subscription";
import React from "react"; // Added React import

// Pages
import Index from "@/pages/Index";
import Dashboard from "@/pages/Dashboard";
import NotFound from "@/pages/NotFound";
import UploadRFP from "@/pages/UploadRFP";
import RecentProjects from "@/pages/RecentProjects";
import ProjectDetails from "@/pages/ProjectDetails";
import Subscription from "@/pages/Subscription";
import KnowledgeBase from "@/pages/KnowledgeBase";
import ResetPassword from "@/pages/ResetPassword";
import Documentation from "@/pages/Documentation";
import AccountSettings from "@/pages/AccountSettings";
import BetaProgram from "@/pages/BetaProgram";
import BetaRoadmap from "@/pages/BetaRoadmap";
import AdminDashboard from "@/pages/AdminDashboard";
import SetInitialAdmin from "@/pages/SetInitialAdmin";
import { UserManagement } from "@/pages/admin/UserManagement"; // Changed to named import
import { BetaInvitations } from "@/pages/admin/BetaInvitations"; // Changed to named import
import BetaRequests from "@/pages/admin/BetaRequests"; // Import BetaRequests properly

// Components
import { AuthProvider } from "@/components/AuthProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { NetworkStatusIndicator } from './components/NetworkStatusIndicator';
import { RecentProjectsRedirect, ProjectDetailsRedirect, BetaInviteRedirect } from "./components/routing/Redirects";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <NetworkStatusProvider>
          <BrowserRouter>
            <AuthProvider>
              <SubscriptionProvider>
                <ErrorBoundary>
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
                    <Route path="/admin/users" element={<UserManagement />} />
                    <Route path="/admin/beta-invitations" element={<BetaInvitations />} />
                    <Route path="/admin/beta-requests" element={<BetaRequests />} />
                    
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/docs" element={<Documentation />} />
                    <Route path="/docs/:docId" element={<Documentation />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </ErrorBoundary>
                <Toaster position="top-right" richColors closeButton />
                <NetworkStatusIndicator />
              </SubscriptionProvider>
            </AuthProvider>
          </BrowserRouter>
        </NetworkStatusProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
