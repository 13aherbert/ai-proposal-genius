

## UX Audit: Findings and Fix Plan

### Issues Found

**1. Landing page (`/`) has no shared navigation**
The Index page renders its own inline nav buttons (Pricing, FAQ, Login) floating in the top-right corner. It does not use the `PublicNavbar` and has no links to About, Contact, Demo, Integrations, Blog, Docs, or Security. Users arriving at the homepage cannot discover the rest of the site.

**Fix**: Wrap the Index page content with the `PublicNavbar` (and optionally the `Footer`). Remove the inline floating nav buttons since the PublicNavbar already provides Login, Get Started, Book Demo, and all dropdown navigation.

**2. `/pricing` redirects via `window.location.replace("/#pricing")`**
This causes a full page reload and navigates back to the landing page's dark theme. Since the landing page doesn't use PublicNavbar, users lose context. This is a jarring experience.

**Fix**: Change the Pricing redirect to use React Router's `useNavigate` or `<Navigate>` so it stays in-app. Alternatively, create a standalone `/pricing` page under `PublicLayout` that mirrors the pricing content.

**3. Footer "Privacy Policy" and "Terms of Service" both link to `/security`**
These are misleading — the Security page is about data encryption and compliance, not legal terms. There are no actual Privacy Policy or Terms of Service pages.

**Fix**: Either create dedicated `/privacy` and `/terms` pages, or point these links to placeholder anchors on the Security page with appropriate sections added. At minimum, rename the labels to be accurate (e.g., "Security & Privacy") or add a legal section to the Security page.

**4. Security page links to `/docs/privacy` which likely 404s**
The "Privacy Policy" download card on the Security page links to `/docs/privacy` — there's no route for this specific doc path unless the Documentation page handles it dynamically.

**Fix**: Verify the `/docs/privacy` route works. If not, update the link to point to an existing resource or create the content.

**5. `SetInitialAdmin` is imported but has no route**
The component is imported in `App.tsx` but never mounted in any `<Route>`. Dead import.

**Fix**: Either add a route (e.g., under admin routes) or remove the unused import.

**6. `HelpCenter` page exists but has no route**
`src/pages/HelpCenter.tsx` is an orphaned page with no route in `App.tsx`.

**Fix**: Either wire it up as a route or remove the file.

**7. Organization dashboard tab bar uses `grid-cols-12` with conditional tabs**
When permissions hide tabs, the 12-column grid leaves awkward gaps. This makes the tab bar look broken for non-admin users.

**Fix**: Change from `grid-cols-12` to a flexible layout (e.g., `flex flex-wrap` or remove the grid constraint) so tabs flow naturally.

**8. Contact form is non-functional (mock `setTimeout`)**
The contact form simulates submission with a `setTimeout` and doesn't actually send anything. Users get a "success" message but no email is sent.

**Fix**: Add a note or connect to a real backend (e.g., Supabase Edge Function or `mailto` fallback). At minimum, document this as a known limitation.

---

### Implementation Steps

1. **Add PublicNavbar + Footer to the landing page** — Either move `/` into the `PublicLayout` route group, or add the navbar/footer components directly to `Index.tsx`. Remove the inline floating nav buttons (lines 73-96 of Index.tsx).

2. **Fix the Pricing redirect** — Replace `window.location.replace("/#pricing")` with proper client-side routing using `useNavigate` and scroll-to-element logic after navigation.

3. **Fix Footer legal links** — Update "Privacy Policy" and "Terms of Service" labels/targets to be accurate. Consider linking to `/security#privacy` or creating minimal legal pages.

4. **Fix orphaned routes** — Remove `SetInitialAdmin` import if no route is needed, or add the route. Remove `HelpCenter.tsx` or add its route.

5. **Fix Organization tabs layout** — Change `grid w-full grid-cols-12` to a flexible layout on the `TabsList`.

6. **Fix Security page `/docs/privacy` link** — Update to a valid destination.

7. **Wire up contact form** — Add a `mailto` fallback or Supabase Edge Function so form submissions actually reach someone.

### Technical Details

- Index.tsx lines 70-96: Remove the `<div className="absolute top-4 right-4">` block with inline nav buttons
- Index.tsx: Either wrap in `PublicLayout` by moving the `/` route inside the `<Route element={<PublicLayout />}>` group, or import and render `PublicNavbar` and `Footer` directly (keeping the dark theme may require the latter approach since PublicLayout adds a white background wrapper)
- Pricing.tsx: Replace `window.location.replace("/#pricing")` with `navigate("/", { replace: true })` + scroll logic, or better yet, create a real pricing section page
- Footer.tsx lines 35-36: Update legal links
- OrganizationDashboard.tsx line 97: Change `grid w-full grid-cols-12` to `flex flex-wrap`
- App.tsx: Remove `SetInitialAdmin` import (line 28) or add route

