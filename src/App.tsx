import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./components/AuthProvider";
import { SubscriptionProvider } from "./hooks/use-subscription";
import { Toaster } from "./components/ui/toaster";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import Index from "@/pages/Index";
import Dashboard from "@/pages/Dashboard";
import RecentProjects from "@/pages/RecentProjects";
import UploadRFP from "@/pages/UploadRFP";
import ProjectDetails from "@/pages/ProjectDetails";
import KnowledgeBase from "@/pages/KnowledgeBase";
import AccountSettings from "@/pages/AccountSettings";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" attribute="class">
        <BrowserRouter>
          <AuthProvider>
            <SubscriptionProvider>
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
                  path="/recent-projects"
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
                  path="/projects/:id"
                  element={
                    <ProtectedRoute>
                      <ProjectDetails />
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
              </Routes>
              <Toaster />
            </SubscriptionProvider>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
