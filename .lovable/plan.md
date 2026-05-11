
## Goal
Strip the app down to a calm, confident, minimalist experience. Reduce surface area, hierarchy noise, and decision fatigue — Apple/Tesla style: one clear primary action per screen, generous whitespace, restrained color, no overlapping prompts.

## Problems Today
- **Dashboard overload**: header + tour + progressive onboarding + resume banner + enterprise onboarding + enterprise getting-started + empty-state checklist + KB wizard + first-RFP wizard + quick-upload zone + 3 quick-action cards + usage widget + upgrade banner + recent activity + sidebar (CSM, KB readiness, onboarding progress) — all can render together. Multiple competing CTAs.
- **Navbar clutter**: 4 top-level groups with mega-menu dropdowns, floating help button, theme toggle, accessibility toggle, enterprise crown popover, avatar menu with 6+ items including "Restart Onboarding" and "Restart Tour".
- **Too many pages**: 40+ routes, several near-duplicates (Dashboard, RecentProjects, ProjectDetails; Subscription/Billing/Pricing; HelpCenter/Contact/EnterpriseSupport/FAQ; Organization/Team/WhiteLabel/EnterpriseOnboarding).
- **Workflow friction**: creating a proposal involves Upload RFP → Project Details → Outline → Generate → Edit → Review → Export, each its own dense screen with sidebars and tabs.
- **Persistent banners**: usage banner, upgrade banner, onboarding resume banner stack on top of every page.

## Design Principles (apply everywhere)
1. **One primary action per screen.** Everything else is secondary/ghost.
2. **Progressive disclosure.** Hide power-user controls behind "More" / settings, never on first paint.
3. **Single onboarding voice.** Only one onboarding surface visible at any time, ever.
4. **Calm chrome.** Thin navbar, no badges/popovers in the header. Notifications and upgrade prompts live in one inbox, not as banners.
5. **Whitespace > density.** Larger type scale, fewer cards per row, no decorative gradients on dashboards.
6. **Plain language.** "Start a proposal" not "Upload RFP". "Library" not "Knowledge Base". "Find work" not "Discover/Opportunities".

## Phase 1 — Navigation Simplification
- Collapse top nav to **4 items max**: `Home` · `Proposals` · `Library` · `Find Work`. Remove "Create" mega-menu; the primary "+ New proposal" becomes a single pill button on the right of the navbar.
- Move into the avatar menu (and out of the navbar): Analytics, Organization, API docs, Account, Plan, Help. Drop "Restart Onboarding" and "Restart Tour" from the menu — surface them only inside Help.
- Remove the Enterprise crown popover from the navbar; show CSM contact inside Help → "Your success manager".
- Remove the floating `HelpFeedbackLauncher` button. Replace with a single "?" icon in the navbar that opens the same panel. Keep `Shift+?` shortcut.
- Hide Theme + Accessibility toggles behind the avatar menu → "Display & accessibility".

## Phase 2 — Dashboard Reset (Home)
Single column, max ~720px content width, three zones only:

```
[ Greeting ]            "Good morning, Alex."
[ Primary CTA ]         Big card: "Start a proposal" → upload or paste link
[ Continue ]            Up to 3 most recent in-progress proposals as quiet rows
[ Status strip ]        One small line: "3 of 6 proposals used this month · Manage"
```

- Remove: QuickActionCard grid, UsageProgressWidget, DashboardUpgradeBanner, OnboardingProgress sidebar, CSMContactWidget, KnowledgeBaseReadiness sidebar, EnterpriseGettingStarted, ProductTour auto-launch.
- Onboarding becomes a **single dismissible "Set up" row** above Continue, only while incomplete. Clicking expands an inline 3-step checklist (Profile → Library → First proposal). No modals, no wizards on load.
- Empty state = the same layout, with Continue replaced by 2 example/template suggestions.
- Enterprise users see the same Home; CSM access lives in Help, not on the dashboard.

## Phase 3 — Proposal Workflow Simplification
Today: Upload → Project Details → Outline → Generate → Edit → Review → Export, each a separate page.

Replace with a **single proposal workspace** that is one URL with a slim left rail showing 4 stages:
```
1. Brief      2. Outline      3. Draft      4. Deliver
```
- Stages auto-advance; user can jump back. No modal wizards.
- "Brief" replaces Upload + Project Details (one screen: drop file or paste link, name auto-fills).
- "Deliver" replaces Review + Export + Design Studio entry (export buttons + share link in one panel).
- AI assist is a single floating bubble (existing Ctrl+J) — remove the per-section AI menus from the toolbar to reduce visual noise.

## Phase 4 — Page Consolidation
- Merge `Subscription` + `Billing` + `Pricing` (authenticated view) → one `/plan` page with two tabs: Plan · Invoices.
- Merge `HelpCenter` + `FAQ` + `Contact` + `EnterpriseSupport` → one `/help` with sections: Search docs · Contact us · (if enterprise) Your CSM.
- Merge `Organization` + `Team` + `WhiteLabel` → one `/organization` with tabs: Members · Branding · Domains · API.
- Remove `RecentProjects` (it duplicates `/projects`).
- Keep marketing/comparison pages as-is (out of authenticated scope).

## Phase 5 — Visual Tone
- Reduce cards/borders. Prefer hairline dividers on a flat background.
- Single accent color used sparingly (primary CTA, active nav, key metric). No gradients on dashboards.
- Type scale: H1 32–40px, H2 22px, body 15px, generous line-height. One display font + one body font (already configured).
- Animations: existing 150ms standard kept; remove any decorative motion on Home.
- Banners (usage, upgrade, onboarding resume) become a single consolidated **Notifications inbox** behind a dot on the avatar — never injected above page content.

## Out of Scope
- Backend/data model changes. No edits to RLS, Supabase functions, AI prompts, billing logic.
- Marketing site redesign.
- Renaming database fields; only UI labels change.

## Success Criteria
- Home renders ≤ 4 visible "things" at any moment.
- Navbar has ≤ 4 left items + 1 primary CTA + avatar.
- Creating a proposal from Home takes ≤ 2 clicks (CTA → drop file).
- No more than one onboarding/upgrade/help surface visible simultaneously.

## Suggested Rollout Order
1. Navbar slim-down + Help/Notifications consolidation.
2. Dashboard reset (Home).
3. Page consolidation (Plan, Help, Organization).
4. Proposal workspace unification.
5. Visual tone pass + remove residual banners/popovers.
