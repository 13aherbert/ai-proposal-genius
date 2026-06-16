## Tidy the Resources dropdown

Group the three new long-form guides under a single **Guides** entry so the Resources menu doesn't list each guide as a peer of Blog, FAQ, Docs, and Tools.

### Desktop navbar (`PublicNavbar.tsx`)

Restructure the Resources dropdown into a two-column layout:

```text
Resources ▾
┌──────────────────────────┬──────────────────────────┐
│ GUIDES                   │ MORE                     │
│ • What is an RFP?        │ • Blog                   │
│ • RFP examples           │ • FAQ                    │
│ • RFP response template  │ • Documentation          │
│                          │ • Free Tools             │
└──────────────────────────┴──────────────────────────┘
```

- Widen the dropdown to ~`w-[560px]` and use `grid-cols-2`.
- Add small uppercase column headings ("Guides", "More") styled like `text-xs font-semibold text-muted-foreground`.
- Reuse the existing `ListItem` component for each entry — no new components needed.

### Mobile sheet

Inside the existing `Resources` `MobileSection`, add a secondary "Guides" subheading above the three guide links, then a thin divider, then the existing Blog/FAQ/Docs/Tools links. Keep everything in one collapsible section so the mobile nav stays flat and scrollable.

### Out of scope

- No `/resources` landing page.
- Footer, Comparison links, Blog, FAQ, Docs, and Tools stay where they are.
- No route or sitemap changes — the three guide URLs are unchanged.

### Files touched

- `src/components/navigation/PublicNavbar.tsx` — desktop dropdown grid + mobile sub-heading.
