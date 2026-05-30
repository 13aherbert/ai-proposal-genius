
import { BrowserRouter, Routes, Route, useSearchParams } from "react-router-dom";
import { Toaster } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { NetworkStatusProvider } from "@/hooks/network";
import { SubscriptionProvider } from "@/hooks/subscription";
import { useAnalytics } from "@/hooks/use-analytics";
import React, { lazy, Suspense } from "react";
import { useWebVitals } from "@/hooks/use-web-vitals";

// Eagerly loaded pages (critical path)
import Index from "@/pages/Index";
import Dashboard from "@/pages/Dashboard";
import NotFound from "@/pages/NotFound";

// Lazy loaded pages
const UploadRFP = lazy(() => import("@/pages/UploadRFP"));
const RecentProjects = lazy(() => import("@/pages/RecentProjects"));
const ProjectDetails = lazy(() => import("@/pages/ProjectDetails"));
const Subscription = lazy(() => import("@/pages/Subscription"));
const SubscriptionSuccess = lazy(() => import("@/pages/SubscriptionSuccess"));
const KnowledgeBase = lazy(() => import("@/pages/KnowledgeBase"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const Documentation = lazy(() => import("@/pages/Documentation"));
const AccountSettings = lazy(() => import("@/pages/AccountSettings"));
const Referral = lazy(() => import("@/pages/Referral"));

const TeamInvite = lazy(() => import("@/pages/TeamInvite"));
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));
const Analytics = lazy(() => import("@/pages/Analytics"));
const UserManagementPage = lazy(() => import("@/pages/admin/UserManagementPage"));
const BlogManagement = lazy(() => import("@/pages/admin/BlogManagement"));
const AdminProjects = lazy(() => import("@/pages/admin/AdminProjects"));
const AdminSecurity = lazy(() => import("@/pages/admin/AdminSecurity"));
const AdminBilling = lazy(() => import("@/pages/admin/AdminBilling"));
const AdminSettings = lazy(() => import("@/pages/admin/AdminSettings"));
const SourceStatusDashboard = lazy(() => import("@/pages/admin/SourceStatusDashboard"));
const AdminLeads = lazy(() => import("@/pages/admin/AdminLeads"));
const AdminLifetime = lazy(() => import("@/pages/admin/AdminLifetime"));
const AdminErrorLogs = lazy(() => import("@/pages/admin/AdminErrorLogs"));
const AdminSupport = lazy(() => import("@/pages/admin/AdminSupport"));
const AdminSeo = lazy(() => import("@/pages/admin/AdminSeo"));
const EnterpriseOnboarding = lazy(() => import("@/pages/EnterpriseOnboarding"));
const Organization = lazy(() => import("@/pages/Organization"));

const Opportunities = lazy(() => import("@/pages/Opportunities"));
const EnterpriseSupport = lazy(() => import("@/pages/EnterpriseSupport"));
const SsoSetupGuide = lazy(() => import("@/pages/SsoSetupGuide"));
const ApiDocs = lazy(() => import("@/pages/ApiDocs"));
const Blog = lazy(() => import("@/pages/Blog"));
const BlogPost = lazy(() => import("@/pages/BlogPost"));
const CompareLoopio = lazy(() => import("@/pages/CompareLoopio"));
const CompareAutoRFP = lazy(() => import("@/pages/CompareAutoRFP"));
const CompareResponsive = lazy(() => import("@/pages/CompareResponsive"));
const CompareProposify = lazy(() => import("@/pages/CompareProposify"));
const CompareQvidian = lazy(() => import("@/pages/CompareQvidian"));
const ComparePandaDoc = lazy(() => import("@/pages/ComparePandaDoc"));
const PricingRedirect = lazy(() => import("@/pages/Pricing"));

const FAQPage = lazy(() => import("@/pages/FAQ"));
const SecurityPage = lazy(() => import("@/pages/Security"));
const Demo = lazy(() => import("@/pages/Demo"));
const Contact = lazy(() => import("@/pages/Contact"));
const Integrations = lazy(() => import("@/pages/Integrations"));
const About = lazy(() => import("@/pages/About"));
const HelpCenter = lazy(() => import("@/pages/HelpCenter"));
const AcceptInvitation = lazy(() => import("@/pages/AcceptInvitation"));
const Unsubscribe = lazy(() => import("@/pages/Unsubscribe"));
const Auth = lazy(() => import("@/pages/Auth"));
const LifetimeDeal = lazy(() => import("@/pages/LifetimeDeal"));

function LifetimeDealRedirect() {
  const [params] = useSearchParams();
  const qs = params.toString();
  return <Navigate to={`/lifetime${qs ? `?${qs}` : ""}`} replace />;
}
const SSOFinish = lazy(() => import("@/pages/SSOFinish"));
const ToolsHub = lazy(() => import("@/pages/tools/ToolsHub"));
const WordCounter = lazy(() => import("@/pages/tools/WordCounter"));
const DeadlineCalculator = lazy(() => import("@/pages/tools/DeadlineCalculator"));
const WinRateCalculator = lazy(() => import("@/pages/tools/WinRateCalculator"));
const ComplianceMatrixGenerator = lazy(() => import("@/pages/tools/ComplianceMatrixGenerator"));
const NaicsLookup = lazy(() => import("@/pages/tools/NaicsLookup"));
const PscLookup = lazy(() => import("@/pages/tools/PscLookup"));
const ExecutiveSummaryGenerator = lazy(() => import("@/pages/tools/ExecutiveSummaryGenerator"));
const CapabilityStatementGenerator = lazy(() => import("@/pages/tools/CapabilityStatementGenerator"));
const BidNoBidScorecard = lazy(() => import("@/pages/tools/BidNoBidScorecard"));
const ProposalOutlineGenerator = lazy(() => import("@/pages/tools/ProposalOutlineGenerator"));
const GovConAcronymDecoder = lazy(() => import("@/pages/tools/GovConAcronymDecoder"));
const PlainLanguageScorer = lazy(() => import("@/pages/tools/PlainLanguageScorer"));
const RfpResponseTemplateGenerator = lazy(() => import("@/pages/tools/RfpResponseTemplateGenerator"));
const RfpTemplateLibrary = lazy(() => import("@/pages/tools/RfpTemplateLibrary"));
const RfpTemplateDetail = lazy(() => import("@/pages/tools/RfpTemplateDetail"));


import PublicLayout from "@/layouts/PublicLayout";

// Components
import { AuthProvider } from "@/components/AuthProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { NetworkStatusIndicator } from './components/NetworkStatusIndicator';
import { RecentProjectsRedirect, ProjectDetailsRedirect } from "./components/routing/Redirects";
import { Navigate } from "react-router-dom";
import { SecurityProvider } from "@/components/security/SecurityProvider";
import { KeyboardShortcutsProvider } from "@/components/keyboard/KeyboardShortcutsProvider";
import { AriaLiveAnnouncer } from "@/components/accessibility/AriaLiveAnnouncer";

// Layouts
import DashboardLayout from "@/layouts/DashboardLayout";
import AdminLayout from "@/layouts/AdminLayout";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 2 * 60 * 1000, // 2 minutes stale-while-revalidate
      gcTime: 10 * 60 * 1000,   // 10 minutes cache time
    },
  },
});

// Minimal loading fallback
function RouteLoader() {
  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}

function AppContent() {
  useAnalytics();
  useWebVitals();
  
  return (
    <Suspense fallback={<RouteLoader />}>
      <Routes>
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
          <Route path="/billing" element={<Navigate to="/subscription" replace />} />
          <Route path="/settings" element={<Navigate to="/account" replace />} />
          <Route path="/organization" element={<Organization />} />
          <Route path="/white-label" element={<Navigate to="/organization" replace />} />
          <Route path="/opportunities" element={<Opportunities />} />
          <Route path="/referral" element={<Referral />} />
          <Route path="/team" element={<Navigate to="/organization" replace />} />
          <Route path="/team/invite" element={<TeamInvite />} />
          <Route path="/api-docs" element={<ApiDocs />} />
          <Route path="/enterprise-support" element={<EnterpriseSupport />} />
          <Route path="/docs/sso-setup" element={<SsoSetupGuide />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/onboarding/enterprise" element={<EnterpriseOnboarding />} />
          
          {/* Legacy route redirects */}
          <Route path="/recent-projects" element={<RecentProjectsRedirect />} />
          <Route path="/project/:projectId" element={<ProjectDetailsRedirect />} />
          <Route path="/account-settings" element={<Navigate to="/account" replace />} />
        </Route>
        
        {/* Admin Routes */}
        <Route element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<UserManagementPage />} />
          <Route path="/admin/blog" element={<BlogManagement />} />
          <Route path="/admin/projects" element={<AdminProjects />} />
          <Route path="/admin/security" element={<AdminSecurity />} />
          <Route path="/admin/billing" element={<AdminBilling />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
          <Route path="/admin/source-health" element={<SourceStatusDashboard />} />
          <Route path="/admin/leads" element={<AdminLeads />} />
          <Route path="/admin/lifetime" element={<AdminLifetime />} />
          <Route path="/admin/errors" element={<AdminErrorLogs />} />
          <Route path="/admin/support" element={<AdminSupport />} />
          <Route path="/admin/seo" element={<AdminSeo />} />
        </Route>
        
        <Route path="/auth" element={<Auth />} />
        <Route path="/sso/finish" element={<SSOFinish />} />
        <Route path="/lifetime" element={<LifetimeDeal />} />
        <Route path="/lifetime-deal" element={<LifetimeDealRedirect />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/accept-invitation" element={<AcceptInvitation />} />
        <Route path="/unsubscribe" element={<Unsubscribe />} />
        
        {/* Public pages with shared navbar + footer */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Index />} />
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
          <Route path="/about" element={<About />} />
          <Route path="/help" element={<HelpCenter />} />
          <Route path="/tools" element={<ToolsHub />} />
          <Route path="/tools/proposal-word-counter" element={<WordCounter />} />
          <Route path="/tools/rfp-deadline-calculator" element={<DeadlineCalculator />} />
          <Route path="/tools/win-rate-calculator" element={<WinRateCalculator />} />
          <Route path="/tools/compliance-matrix-generator" element={<ComplianceMatrixGenerator />} />
          <Route path="/tools/naics-code-lookup" element={<NaicsLookup />} />
          <Route path="/tools/psc-code-lookup" element={<PscLookup />} />
          <Route path="/tools/executive-summary-generator" element={<ExecutiveSummaryGenerator />} />
          <Route path="/tools/capability-statement-generator" element={<CapabilityStatementGenerator />} />
          <Route path="/tools/bid-no-bid-scorecard" element={<BidNoBidScorecard />} />
          <Route path="/tools/proposal-outline-generator" element={<ProposalOutlineGenerator />} />
          <Route path="/tools/govcon-acronym-decoder" element={<GovConAcronymDecoder />} />
          <Route path="/tools/plain-language-scorer" element={<PlainLanguageScorer />} />
          <Route path="/tools/rfp-response-template-generator" element={<RfpResponseTemplateGenerator />} />
          <Route path="/tools/rfp-template-library" element={<RfpTemplateLibrary />} />
          <Route path="/tools/rfp-template-library/:slug" element={<RfpTemplateDetail />} />

        </Route>
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <QueryClientProvider client={queryClient}>
        <NetworkStatusProvider>
          <BrowserRouter>
            <AuthProvider>
              <SecurityProvider>
                <SubscriptionProvider>
                  <KeyboardShortcutsProvider>
                    <AriaLiveAnnouncer>
                      <ErrorBoundary>
                        <AppContent />
                      </ErrorBoundary>
                    </AriaLiveAnnouncer>
                  </KeyboardShortcutsProvider>
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
