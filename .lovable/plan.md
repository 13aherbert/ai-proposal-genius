

## Layout & Margin Audit

### Current Issues

**1. Inconsistent Navbar/Footer usage across pages:**
- **Dashboard**: Renders `<Navbar />` inside content (within `space-y-6`), no container wrapper, no Footer
- **Opportunities**: Renders own `<Navbar />`, `max-w-5xl` container, no Footer
- **Organization**: Renders own `<Navbar />` + `<Footer />`, `max-w-7xl` container
- **KnowledgeBase, AccountSettings, UploadRFP, RecentProjects, ProjectDetails, Subscription**: No Navbar, no Footer

**2. `DashboardLayout` exists but is never used** — it wraps `<Outlet />` with Navbar, Footer, subscription banners, and a `max-w-7xl` container, but no routes reference it.

**3. Inconsistent container widths:**
- Dashboard: no container (just `space-y-6`)
- Opportunities: `max-w-5xl`
- Organization: `max-w-7xl`
- KnowledgeBase: `container mx-auto px-3 sm:px-4`
- AccountSettings: `container mx-auto px-4`
- UploadRFP: `container mx-auto px-4`
- RecentProjects: `container` (no explicit max-width/padding)
- ProjectDetails: `container mx-auto px-3 sm:px-4`

### Plan

**Use `DashboardLayout` as a shared layout route for all authenticated pages.** This eliminates per-page Navbar/Footer duplication and standardizes margins.

#### Step 1: Wire DashboardLayout into App.tsx routing
Wrap all authenticated routes inside a `<Route element={<DashboardLayout />}>` parent so every page gets consistent Navbar, Footer, subscription banners, and `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6` container.

#### Step 2: Remove duplicate Navbar/Footer from individual pages
- **Dashboard.tsx**: Remove `<Navbar />` import and usage
- **Opportunities.tsx**: Remove `<Navbar />` and outer `min-h-screen` wrapper; keep only the inner content
- **Organization.tsx**: Remove `<Navbar />`, `<Footer />`, `<AuthCheck>`, subscription banners, and outer wrappers; render just `<OrganizationDashboard />`

#### Step 3: Normalize page containers
Remove per-page `container mx-auto` and `min-h-screen` wrappers from pages that will now be inside DashboardLayout's container:
- **KnowledgeBase**: Remove outer `min-h-screen` + `container` div
- **AccountSettings**: Remove outer `min-h-screen` + `container` div
- **UploadRFP**: Remove outer `min-h-screen` + `container` div
- **RecentProjects**: Already uses just `container py-10` — remove `container` wrapper
- **ProjectDetails**: Remove outer `min-h-screen` + `container` div

### Files to modify
| File | Change |
|------|--------|
| `src/App.tsx` | Wrap authenticated routes in `<Route element={<DashboardLayout />}>` |
| `src/layouts/DashboardLayout.tsx` | Minor: remove `<AuthCheck>` wrapper (handled by `ProtectedRoute`) |
| `src/pages/Dashboard.tsx` | Remove `<Navbar />` |
| `src/pages/Opportunities.tsx` | Remove `<Navbar />` and outer wrapper |
| `src/pages/Organization.tsx` | Simplify to just `<OrganizationDashboard />` |
| `src/pages/KnowledgeBase.tsx` | Remove outer container wrappers |
| `src/pages/AccountSettings.tsx` | Remove outer container wrappers |
| `src/pages/UploadRFP.tsx` | Remove outer container wrappers |
| `src/pages/RecentProjects.tsx` | Remove `container` class |
| `src/pages/ProjectDetails.tsx` | Remove outer container wrappers |

