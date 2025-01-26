import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/components/AuthProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Dashboard from "@/pages/Dashboard";
import Index from "@/pages/Index";
import KnowledgeBase from "@/pages/KnowledgeBase";
import ProjectDetails from "@/pages/ProjectDetails";
import RecentProjects from "@/pages/RecentProjects";
import UploadRFP from "@/pages/UploadRFP";
import AccountSettings from "@/pages/AccountSettings";

function App() {
  return (
    <Router>
      <AuthProvider>
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
            path="/knowledge-base"
            element={
              <ProtectedRoute>
                <KnowledgeBase />
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
            path="/account-settings"
            element={
              <ProtectedRoute>
                <AccountSettings />
              </ProtectedRoute>
            }
          />
        </Routes>
        <Toaster />
      </AuthProvider>
    </Router>
  );
}

export default App;