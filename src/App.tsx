
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/components/AuthProvider";
import ProtectedRoute from "@/components/ProtectedRoute";

// Pages
import Index from "@/pages/Index";
import Dashboard from "@/pages/Dashboard";
import NotFound from "@/pages/NotFound";
import AccountSettings from "@/pages/AccountSettings";
import KnowledgeBase from "@/pages/KnowledgeBase";
import RecentProjects from "@/pages/RecentProjects";
import UploadRFP from "@/pages/UploadRFP";
import ProjectDetails from "@/pages/ProjectDetails";
import ResetPassword from "@/pages/ResetPassword";
import Subscription from "@/pages/Subscription";
import Documentation from "@/pages/Documentation";

// Components
import { TestingPanel } from "@/components/development/TestingPanel";

// Create Query Client with defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  const isDev = import.meta.env.DEV || import.meta.env.VITE_ENABLE_TEST_FEATURES === 'true';

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/account"
              element={
                <ProtectedRoute>
                  <AccountSettings />
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
              path="/projects"
              element={
                <ProtectedRoute>
                  <RecentProjects />
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
              path="/projects/:projectId"
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
            <Route path="/docs/:docId?" element={<Documentation />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          {isDev && <TestingPanel />}
          <Toaster position="top-right" />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
