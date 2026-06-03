Plan to improve the mobile public navigation:

1. Make login visible without opening the menu
- Add a clear mobile-only “Login” button in the header next to the hamburger icon.
- Keep the logo on the left and make the top bar a simple three-part layout: logo, Login, menu.
- Use the existing `/auth` page for mobile login instead of a modal, so the flow is more reliable on small screens.

2. Rework the hamburger menu hierarchy
- Move account actions to the top of the mobile menu: “Login” and “Get Started”.
- Keep secondary navigation below, grouped cleanly but with fewer nested-feeling sections.
- Make key links easier to scan: Product, Pricing, Free Tools, Security, Resources, Company, Book Demo.

3. Make the mobile sheet easier to use
- Change the sheet to a full-height mobile drawer using dynamic viewport height (`100dvh` behavior) with a dedicated scroll area.
- Add enough bottom padding so the last buttons are reachable above the browser toolbar.
- Keep close behavior simple and consistent when tapping links.

4. Remove mobile modal friction
- On mobile, route Login to `/auth` and Get Started to `/auth?mode=signup`.
- On desktop, keep the existing dialog modal behavior so the desktop experience remains unchanged.

5. Prevent the offline banner from covering navigation
- Adjust the network/offline banner so it does not obscure the mobile header or hamburger controls.
- Keep it visible, but not in the way of primary navigation.

Validation after implementation:
- Test at the current 390px mobile viewport.
- Confirm Login is visible immediately on the public homepage.
- Confirm the hamburger menu opens, scrolls, and all links/actions are reachable.
- Confirm tapping Login opens the standalone auth page cleanly on mobile.