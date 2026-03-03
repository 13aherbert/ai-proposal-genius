

## Plan: Restructure Navbar with Grouped Navigation

### Overview
Replace the flat 6-item nav with grouped dropdown menus (Create, Manage, Discover) using Radix NavigationMenu, add a profile avatar dropdown, and convert mobile menu to Sheet component.

### Modified File: `src/components/navigation/Navbar.tsx` — Full rewrite

**Desktop Navigation (hidden on mobile, flex on md+):**
- Logo stays as-is (links to `/dashboard`)
- `NavigationMenu` with 3 groups:
  - **Create** trigger → dropdown with featured "Upload RFP" card (gradient bg, larger) + "New Project" link (`/upload-rfp`)
  - **Manage** trigger → dropdown with "Projects" (`/projects`), "Knowledge Base" (`/knowledge-base`), and conditionally "Organization" (`/organization`) for enterprise/white_label users
  - **Discover** → direct link to `/opportunities` using `navigationMenuTriggerStyle()`
- **Dashboard** stays as a standalone top-level link (first item, before Create) since it's the home route

**Profile Dropdown (far right, desktop):**
- `Avatar` with `AvatarFallback` showing initials from `profileData.first_name` + `profileData.last_name`
- `DropdownMenu` containing: user name/email label, Account Settings link, Subscription link, separator, Sign Out

**Mobile Navigation:**
- Replace toggle div with `Sheet` (side="left", w-[300px])
- Grouped sections with headers: "Create" (Upload RFP, New Project), "Manage" (Dashboard, Projects, Knowledge Base, Organization), "Discover" (Opportunities)
- Each link wrapped in `SheetClose` for auto-close on navigate
- Account/Sign Out at bottom separated by `Separator`
- Icons for each item: Upload, Plus, LayoutDashboard, Folder, Database, Search, Building2, User, LogOut

**Active state:** Use `useLocation()` to detect current path, apply `font-semibold text-foreground` to active NavigationMenu links

**ListItem helper:** Local component (standard shadcn pattern) rendering `NavigationMenuLink` with title + description, used inside dropdown content grids

### Imports needed
- From `@/components/ui/navigation-menu`: NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuTrigger, NavigationMenuContent, NavigationMenuLink, navigationMenuTriggerStyle
- From `@/components/ui/dropdown-menu`: DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator
- From `@/components/ui/avatar`: Avatar, AvatarFallback
- From `@/components/ui/sheet`: Sheet, SheetTrigger, SheetContent, SheetClose
- From `@/components/ui/separator`: Separator
- `useLocation` from react-router-dom
- Lucide icons: Menu, Upload, Plus, LayoutDashboard, Folder, Database, Search, Building2, User, LogOut

### Files Summary
| File | Action |
|------|--------|
| `src/components/navigation/Navbar.tsx` | Rewrite — grouped nav, avatar dropdown, Sheet mobile |

No new files needed. All UI primitives already exist in the project.

