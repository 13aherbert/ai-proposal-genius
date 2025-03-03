
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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
import { AuthProvider } from "@/components/AuthProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
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
                <Route
                  path="/projects"
                  element={
                    <ProtectedRoute>
                      <RecentProjects />
                    </ProtectedRoute>
                  }
                />
                {/* Add new route for /recent-projects that renders the same component */}
                <Route
                  path="/recent-projects"
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
                <Route
                  path="/project/:projectId"
                  element={
                    <ProtectedRoute>
                      <ProjectDetails />
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
                
                {/* Beta Testing Routes */}
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
                <Route
                  path="/beta"
                  element={
                    <ProtectedRoute>
                      <BetaProgram />
                    </ProtectedRoute>
                  }
                />
                
                {/* Admin Routes */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/setup"
                  element={
                    <ProtectedRoute>
                      <SetInitialAdmin />
                    </ProtectedRoute>
                  }
                />
                
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/docs" element={<Documentation />} />
                <Route path="/docs/:docId" element={<Documentation />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </ErrorBoundary>
            <Toaster position="top-right" richColors closeButton />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
