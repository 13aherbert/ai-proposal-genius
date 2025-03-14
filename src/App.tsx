
import { Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { ThemeProvider } from "next-themes";

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

// Components
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { NetworkStatusIndicator } from './components/NetworkStatusIndicator';
import { RecentProjectsRedirect, ProjectDetailsRedirect, BetaInviteRedirect } from "./components/routing/Redirects";
import { AuthGuard } from "./components/AuthGuard";

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route
            path="/dashboard"
            element={
              <AuthGuard>
                <Dashboard />
              </AuthGuard>
            }
          />
          <Route
            path="/upload-rfp"
            element={
              <AuthGuard>
                <UploadRFP />
              </AuthGuard>
            }
          />
          
          {/* Primary project routes */}
          <Route
            path="/projects"
            element={
              <AuthGuard>
                <RecentProjects />
              </AuthGuard>
            }
          />
          <Route
            path="/projects/:projectId"
            element={
              <AuthGuard>
                <ProjectDetails />
              </AuthGuard>
            }
          />
          
          {/* Legacy route redirects for backward compatibility */}
          <Route
            path="/recent-projects"
            element={
              <AuthGuard>
                <RecentProjectsRedirect />
              </AuthGuard>
            }
          />
          <Route
            path="/project/:projectId"
            element={
              <AuthGuard>
                <ProjectDetailsRedirect />
              </AuthGuard>
            }
          />
          
          <Route
            path="/subscription"
            element={
              <AuthGuard>
                <Subscription />
              </AuthGuard>
            }
          />
          <Route
            path="/knowledge-base"
            element={
              <AuthGuard>
                <KnowledgeBase />
              </AuthGuard>
            }
          />
          <Route
            path="/account-settings"
            element={
              <AuthGuard>
                <AccountSettings />
              </AuthGuard>
            }
          />
          
          {/* Beta Testing Routes - Changed BetaProgram to not require authentication */}
          <Route path="/beta" element={<BetaProgram />} />
          <Route
            path="/beta/dashboard"
            element={
              <AuthGuard requiredRoles={['beta_tester']}>
                <BetaProgram />
              </AuthGuard>
            }
          />
          <Route
            path="/beta/roadmap"
            element={
              <AuthGuard requiredRoles={['beta_tester']}>
                <BetaRoadmap />
              </AuthGuard>
            }
          />
          
          {/* Legacy beta invite redirect */}
          <Route path="/beta-invite" element={<BetaInviteRedirect />} />
          
          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <AuthGuard requiredRoles={['admin']}>
                <AdminDashboard />
              </AuthGuard>
            }
          />
          <Route
            path="/admin/setup"
            element={
              <AuthGuard requiredRoles={['admin']}>
                <SetInitialAdmin />
              </AuthGuard>
            }
          />
          
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/docs" element={<Documentation />} />
          <Route path="/docs/:docId" element={<Documentation />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster position="top-right" richColors closeButton />
        <NetworkStatusIndicator />
      </ErrorBoundary>
    </ThemeProvider>
  );
}
