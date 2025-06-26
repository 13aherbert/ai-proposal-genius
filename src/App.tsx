
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { AuthProvider } from "@/components/AuthProvider";
import { SubscriptionProvider } from "@/hooks/subscription";
import { NetworkStatusProvider } from "@/hooks/network";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AuthCheck } from "@/components/auth/AuthCheck";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import ProjectDetails from "./pages/ProjectDetails";
import RecentProjects from "./pages/RecentProjects";
import UploadRFP from "./pages/UploadRFP";
import AccountSettings from "./pages/AccountSettings";
import KnowledgeBase from "./pages/KnowledgeBase";
import NotFound from "./pages/NotFound";
import ResetPassword from "./pages/ResetPassword";
import Subscription from "./pages/Subscription";
import Documentation from "./pages/Documentation";
import HelpCenter from "./pages/HelpCenter";
import BetaProgram from "./pages/BetaProgram";
import BetaRoadmap from "./pages/BetaRoadmap";
import AdminDashboard from "./pages/AdminDashboard";
import UserManagementPage from "./pages/admin/UserManagementPage";
import BetaInvitationsPage from "./pages/admin/BetaInvitationsPage";
import SetInitialAdmin from "./pages/SetInitialAdmin";
import WhiteLabelDashboard from "./pages/WhiteLabelDashboard";
import { BetaInviteRedirect } from "./components/routing/BetaInviteRedirect";
import { Redirects } from "./components/routing/Redirects";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <NetworkStatusProvider>
        <AuthProvider>
          <SubscriptionProvider>
            <TooltipProvider>
              <Toaster />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/set-initial-admin" element={<SetInitialAdmin />} />
                  <Route path="/beta-invite" element={<BetaInviteRedirect />} />
                  
                  {/* Protected Routes */}
                  <Route element={<ProtectedRoute><Outlet /></ProtectedRoute>}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/projects" element={<RecentProjects />} />
                    <Route path="/project/:id" element={<ProjectDetails />} />
                    <Route path="/upload-rfp" element={<UploadRFP />} />
                    <Route path="/account-settings" element={<AccountSettings />} />
                    <Route path="/knowledge-base" element={<KnowledgeBase />} />
                    <Route path="/subscription" element={<Subscription />} />
                    <Route path="/documentation" element={<Documentation />} />
                    <Route path="/help" element={<HelpCenter />} />
                    <Route path="/beta" element={<BetaProgram />} />
                    <Route path="/beta-roadmap" element={<BetaRoadmap />} />
                    <Route path="/white-label" element={<WhiteLabelDashboard />} />
                    
                    {/* Admin Routes */}
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/admin/users" element={<UserManagementPage />} />
                    <Route path="/admin/beta-invitations" element={<BetaInvitationsPage />} />
                  </Route>
                  
                  <Route path="/*" element={<Redirects />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </SubscriptionProvider>
        </AuthProvider>
      </NetworkStatusProvider>
    </QueryClientProvider>
  );
}

export default App;
