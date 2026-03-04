

## Plan: Enhance Mobile Navigation Touch Targets & Polish

### Analysis
The Navbar already has a functional mobile Sheet navigation with section headers, icons, active states, and sign-out. The main gaps compared to the requirements are:

1. **Touch targets too small** — current `py-3` (~44px) needs to be `min-h-[56px] py-4` for comfortable thumb tapping
2. **Icon sizes too small** — `h-4 w-4` should be `h-5 w-5` for mobile
3. **Missing subscription link** in mobile nav footer
4. **Active states lack tap feedback** — need `active:bg-muted/70` for immediate touch response
5. **Sign out lacks red styling** as specified
6. **User profile info missing** from mobile nav header (name + email)
7. **Hamburger button too small** — needs `h-11 w-11` minimum touch target

### Changes

#### `src/components/navigation/Navbar.tsx`

**Mobile Sheet section (lines 238-384):**

- **Hamburger button**: Change `size="icon"` to explicit `h-11 w-11` and bump icon to `h-6 w-6`
- **Sheet header**: Add user avatar, name, and email at top of the sheet (before nav items), styled like the desktop dropdown label
- **All nav links**: Change from `py-3` to `min-h-[56px] py-4`, icons from `h-4 w-4` to `h-5 w-5`, add `active:bg-muted/70` for tap feedback, text from `text-sm` to `text-base`
- **Sign out button**: Add `text-destructive` styling with red icon
- **Add subscription link**: Insert a "Subscription" link (`/account-settings#subscription`) with a `Settings` icon in the account footer section
- **Section spacing**: Increase gap between sections with `py-3` on section wrappers

No new files needed — this is a refinement of the existing mobile nav in `Navbar.tsx`.

| File | Action |
|------|--------|
| `src/components/navigation/Navbar.tsx` | Modify — enlarge touch targets, add profile header, subscription link, red sign-out, tap feedback |

