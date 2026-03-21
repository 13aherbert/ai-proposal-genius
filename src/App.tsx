
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
import Referral from "@/pages/Referral";
import Team from "@/pages/Team";
import TeamInvite from "@/pages/TeamInvite";
import AdminDashboard from "@/pages/AdminDashboard";
import SetInitialAdmin from "@/pages/SetInitialAdmin";
import UserManagementPage from "@/pages/admin/UserManagementPage";
import BlogManagement from "@/pages/admin/BlogManagement";
import AdminProjects from "@/pages/admin/AdminProjects";
import AdminSecurity from "@/pages/admin/AdminSecurity";
import AdminBilling from "@/pages/admin/AdminBilling";
import AdminSettings from "@/pages/admin/AdminSettings";
import Organization from "@/pages/Organization";
import WhiteLabel from "@/pages/WhiteLabel";
import Opportunities from "@/pages/Opportunities";
import EnterpriseSupport from "@/pages/EnterpriseSupport";
import ApiDocs from "@/pages/ApiDocs";
import Blog from "@/pages/Blog";
import BlogPost from "@/pages/BlogPost";
import CompareLoopio from "@/pages/CompareLoopio";
import CompareAutoRFP from "@/pages/CompareAutoRFP";
import CompareResponsive from "@/pages/CompareResponsive";
import CompareProposify from "@/pages/CompareProposify";
import CompareQvidian from "@/pages/CompareQvidian";
import ComparePandaDoc from "@/pages/ComparePandaDoc";
import PricingRedirect from "@/pages/Pricing";
import Billing from "@/pages/Billing";
import FAQPage from "@/pages/FAQ";
import SecurityPage from "@/pages/Security";
import Demo from "@/pages/Demo";
import Contact from "@/pages/Contact";
import Integrations from "@/pages/Integrations";

// Components
import { AuthProvider } from "@/components/AuthProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { NetworkStatusIndicator } from './components/NetworkStatusIndicator';
import { RecentProjectsRedirect, ProjectDetailsRedirect } from "./components/routing/Redirects";
import { Navigate } from "react-router-dom";
import { SecurityProvider } from "@/components/security/SecurityProvider";

// Layouts
import DashboardLayout from "@/layouts/DashboardLayout";
import AdminLayout from "@/layouts/AdminLayout";

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
        <Route path="/account" element={<AccountSettings />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/settings" element={<Navigate to="/account" replace />} />
        <Route path="/organization" element={<Organization />} />
        <Route path="/white-label" element={<WhiteLabel />} />
        <Route path="/opportunities" element={<Opportunities />} />
        <Route path="/referral" element={<Referral />} />
        <Route path="/team" element={<Team />} />
        <Route path="/team/invite" element={<TeamInvite />} />
        <Route path="/api-docs" element={<ApiDocs />} />
        <Route path="/enterprise-support" element={<EnterpriseSupport />} />
        
        {/* Legacy route redirects */}
        <Route path="/recent-projects" element={<RecentProjectsRedirect />} />
        <Route path="/project/:projectId" element={<ProjectDetailsRedirect />} />
        <Route path="/account-settings" element={<Navigate to="/account" replace />} />
      </Route>
      
      {/* Admin Routes - wrapped in ProtectedRoute + AdminLayout with sidebar & role gate */}
      <Route element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<UserManagementPage />} />
        <Route path="/admin/blog" element={<BlogManagement />} />
        <Route path="/admin/projects" element={<AdminProjects />} />
        <Route path="/admin/security" element={<AdminSecurity />} />
        <Route path="/admin/billing" element={<AdminBilling />} />
        <Route path="/admin/settings" element={<AdminSettings />} />
      </Route>
      
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/docs" element={<Documentation />} />
      <Route path="/docs/:docId" element={<Documentation />} />
      <Route path="/blog" element={<Blog />} />
      <Route path="/blog/:slug" element={<BlogPost />} />
      <Route path="/compare/loopio" element={<CompareLoopio />} />
      <Route path="/compare/autorfp" element={<CompareAutoRFP />} />
      <Route path="/compare/responsive" element={<CompareResponsive />} />
      <Route path="/compare/proposify" element={<CompareProposify />} />
      <Route path="/compare/qvidian" element={<CompareQvidian />} />
      <Route path="/compare/pandadoc" element={<ComparePandaDoc />} />
      <Route path="/pricing" element={<PricingRedirect />} />
      <Route path="/faq" element={<FAQPage />} />
      <Route path="/security" element={<SecurityPage />} />
      <Route path="/demo" element={<Demo />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/integrations" element={<Integrations />} />
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
