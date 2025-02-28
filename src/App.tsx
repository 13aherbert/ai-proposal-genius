
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./components/AuthProvider";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import UploadRFP from "./pages/UploadRFP";
import RecentProjects from "./pages/RecentProjects";
import KnowledgeBase from "./pages/KnowledgeBase";
import ProjectDetails from "./pages/ProjectDetails";
import AccountSettings from "./pages/AccountSettings";
import Subscription from "./pages/Subscription";
import "./App.css";
import { Toaster } from "@/components/ui/toaster";

function App() {
  return (
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
          path="/upload-rfp"
          element={
            <ProtectedRoute>
              <UploadRFP />
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
          path="/knowledge-base"
          element={
            <ProtectedRoute>
              <KnowledgeBase />
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
          path="/account-settings"
          element={
            <ProtectedRoute>
              <AccountSettings />
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
      </Routes>
      <Toaster />
    </AuthProvider>
  );
}

export default App;
