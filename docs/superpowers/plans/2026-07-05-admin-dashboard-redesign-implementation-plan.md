# Admin Dashboard Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the full JK Organics admin area into a calm operations console closely inspired by the selected eMart-style dashboard reference, with workflow navigation, reusable admin UI primitives, and refreshed pages for dashboard, fulfillment, catalog, growth, team, and settings.

**Architecture:** Build a shared admin design system first, then migrate pages by workflow group. Keep existing data APIs and business logic intact; this is primarily shell, layout, interaction, and page-composition work. Use SCSS Modules and local reusable components instead of adding a new UI framework.

**Tech Stack:** Next.js App Router, React 19, TypeScript, SCSS Modules, lucide-react, Recharts, Vitest, existing admin API routes and helpers.

---

## Source Design

Spec: `docs/superpowers/specs/2026-07-05-admin-dashboard-redesign-design.md`

Resolved decisions:

- Visual direction: Calm Operations Console.
- Reference anchor: eMart-style Dribbble dashboard layout with dark left rail, pale blue-gray canvas, white analytics cards, top search/action bar, central chart grid, and compact right-side metric widgets. Do not copy third-party artwork or exact pixels; translate the structure into an original JK Organics admin.
- Navigation: workflow groups.
- Scope: full admin redesign, including list pages, detail pages, forms, team, settings, and analytics.
- Remaining UI decisions are delegated to implementation under this plan.

## File Structure and Responsibilities

Shared shell:

- Modify `src/app/(auth)/(dashboard)/admin-account/components/shell/admin-nav.ts`: workflow-grouped nav, page titles, descriptions, active matching.
- Modify `src/app/(auth)/(dashboard)/admin-account/components/shell/admin-shell.tsx`: layout state and route-change drawer behavior.
- Modify `src/app/(auth)/(dashboard)/admin-account/components/shell/admin-shell.module.scss`: global admin layout tokens and responsive shell.
- Modify `src/app/(auth)/(dashboard)/admin-account/components/shell/admin-sidebar.tsx`: grouped nav, compact dark sidebar, user footer, accessible sign-out.
- Modify `src/app/(auth)/(dashboard)/admin-account/components/shell/admin-sidebar.module.scss`: dark sidebar, active states, mobile drawer.
- Modify `src/app/(auth)/(dashboard)/admin-account/components/shell/admin-topbar.tsx`: topbar title, description, quick actions, mobile menu.
- Modify `src/app/(auth)/(dashboard)/admin-account/components/shell/admin-topbar.module.scss`: compact topbar layout.

Reusable UI:

- Modify `src/app/(auth)/(dashboard)/admin-account/components/ui/page-header.tsx`: page header, card/panel compatibility, back links.
- Create `src/app/(auth)/(dashboard)/admin-account/components/ui/admin-metric-card.tsx`: reusable metric cards.
- Create `src/app/(auth)/(dashboard)/admin-account/components/ui/admin-panel.tsx`: reusable panel shell.
- Create `src/app/(auth)/(dashboard)/admin-account/components/ui/admin-toolbar.tsx`: toolbar shell for filters/actions.
- Create `src/app/(auth)/(dashboard)/admin-account/components/ui/admin-badge.tsx`: reusable status badges.
- Create `src/app/(auth)/(dashboard)/admin-account/components/ui/admin-empty-state.tsx`: loading/empty/error presentation.
- Modify `src/app/(auth)/(dashboard)/admin-account/components/ui/admin-ui.module.scss`: shared tokens, buttons, tables, forms, badges, panels, skeletons.

Overview:

- Modify `src/app/(auth)/(dashboard)/admin-account/components/dashboard/admin-dashboard.tsx`.
- Modify `src/app/(auth)/(dashboard)/admin-account/styles.module.scss`.

Fulfillment:

- Modify `src/app/(auth)/(dashboard)/admin-account/orders/comp/admin-orders-page.tsx`.
- Modify `src/app/(auth)/(dashboard)/admin-account/orders/comp/styles.module.scss`.
- Modify `src/app/(auth)/(dashboard)/admin-account/orders/comp/admin-single-order.tsx`.
- Modify `src/app/(auth)/(dashboard)/admin-account/orders/comp/admin-single-order-styles.module.scss`.
- Modify `src/app/(auth)/(dashboard)/admin-account/payments/payment-page/page.tsx`.
- Modify `src/app/(auth)/(dashboard)/admin-account/payments/payment-page/styles.module.scss`.

Catalog:

- Modify `src/app/(auth)/(dashboard)/admin-account/products/page.tsx`.
- Modify `src/app/(auth)/(dashboard)/admin-account/products/products-list.module.scss`.
- Modify `src/app/(auth)/(dashboard)/admin-account/products/styles.module.scss`.
- Modify `src/app/(auth)/(dashboard)/admin-account/products/comp/product-form.tsx`.
- Modify `src/app/(auth)/(dashboard)/admin-account/products/comp/product-form.module.scss`.
- Modify `src/app/(auth)/(dashboard)/admin-account/coupons/page.tsx`.
- Modify `src/app/(auth)/(dashboard)/admin-account/coupons/comp/coupon-form.tsx`.
- Modify `src/app/(auth)/(dashboard)/admin-account/coupons/comp/coupon-form.module.scss`.
- Modify `src/app/(auth)/(dashboard)/admin-account/reviews/comp/admin-reviews-page.tsx`.
- Modify `src/app/(auth)/(dashboard)/admin-account/reviews/styles.module.scss`.

Growth:

- Modify `src/app/(auth)/(dashboard)/admin-account/analytics/comp/analytics-page.tsx`.
- Modify `src/app/(auth)/(dashboard)/admin-account/analytics/comp/date-range-controls.tsx`.
- Modify `src/app/(auth)/(dashboard)/admin-account/analytics/comp/report-table.tsx`.
- Modify `src/app/(auth)/(dashboard)/admin-account/analytics/comp/csv-export.tsx`.
- Modify `src/app/(auth)/(dashboard)/admin-account/analytics/styles.module.scss`.

Team and settings:

- Modify `src/app/(auth)/(dashboard)/admin-account/team/page.tsx`.
- Modify `src/app/(auth)/(dashboard)/admin-account/team/team.module.scss`.
- Modify `src/app/(auth)/(dashboard)/admin-account/details/page.tsx`.

Tests:

- Modify `src/app/(auth)/(dashboard)/admin-account/layout.test.ts`.
- Modify `src/app/(auth)/(dashboard)/admin-account/team/layout.test.ts` only if shell assumptions change.
- Add focused tests beside new reusable components if behavior is non-trivial.
- Keep existing analytics/reviews/team API tests unchanged unless UI imports force type changes.

## Task 1: Shared Admin Design System and Workflow Shell

**Files:**
- Modify: `src/app/(auth)/(dashboard)/admin-account/components/shell/admin-nav.ts`
- Modify: `src/app/(auth)/(dashboard)/admin-account/components/shell/admin-shell.tsx`
- Modify: `src/app/(auth)/(dashboard)/admin-account/components/shell/admin-shell.module.scss`
- Modify: `src/app/(auth)/(dashboard)/admin-account/components/shell/admin-sidebar.tsx`
- Modify: `src/app/(auth)/(dashboard)/admin-account/components/shell/admin-sidebar.module.scss`
- Modify: `src/app/(auth)/(dashboard)/admin-account/components/shell/admin-topbar.tsx`
- Modify: `src/app/(auth)/(dashboard)/admin-account/components/shell/admin-topbar.module.scss`
- Modify: `src/app/(auth)/(dashboard)/admin-account/components/ui/page-header.tsx`
- Modify: `src/app/(auth)/(dashboard)/admin-account/components/ui/admin-ui.module.scss`
- Create: `src/app/(auth)/(dashboard)/admin-account/components/ui/admin-metric-card.tsx`
- Create: `src/app/(auth)/(dashboard)/admin-account/components/ui/admin-panel.tsx`
- Create: `src/app/(auth)/(dashboard)/admin-account/components/ui/admin-toolbar.tsx`
- Create: `src/app/(auth)/(dashboard)/admin-account/components/ui/admin-badge.tsx`
- Create: `src/app/(auth)/(dashboard)/admin-account/components/ui/admin-empty-state.tsx`
- Test: `src/app/(auth)/(dashboard)/admin-account/layout.test.ts`

- [x] **Step 1: Update nav groups**

Replace `adminNavGroups` with workflow groups:

```ts
export const adminNavGroups: AdminNavGroup[] = [
  {
    title: "Overview",
    items: [{ label: "Dashboard", href: "/admin-account", icon: LayoutDashboard }],
  },
  {
    title: "Fulfillment",
    items: [
      { label: "Orders", href: "/admin-account/orders", icon: ShoppingBag },
      { label: "Payments", href: "/admin-account/payments", icon: CreditCard },
    ],
  },
  {
    title: "Catalog",
    items: [
      { label: "Products", href: "/admin-account/products", icon: Package },
      { label: "Coupons", href: "/admin-account/coupons", icon: Ticket },
      { label: "Reviews", href: "/admin-account/reviews", icon: MessageSquareText },
    ],
  },
  {
    title: "Growth",
    items: [{ label: "Analytics", href: "/admin-account/analytics", icon: BarChart3 }],
  },
  {
    title: "Team",
    items: [{ label: "Admins", href: "/admin-account/team", icon: Users, superAdminOnly: true }],
  },
  {
    title: "Settings",
    items: [{ label: "Account", href: "/admin-account/details", icon: Settings }],
  },
];
```

Update `adminPageTitles` so `/admin-account/team` is `"Admins"` and `/admin-account/details` is `"Account"`. Keep detail route title helpers for product, coupon, and order routes.

- [x] **Step 2: Add descriptions by route group**

In `admin-topbar.tsx`, replace `pageDescriptions` with concise operational copy:

```ts
const pageDescriptions: Record<string, string> = {
  "/admin-account": "Daily performance, urgent work, and growth signals",
  "/admin-account/orders": "Fulfill orders and track payment state",
  "/admin-account/payments": "Reconcile cash, M-Pesa, and pending payments",
  "/admin-account/products": "Manage catalog, pricing, and stock",
  "/admin-account/coupons": "Control discounts and promotional codes",
  "/admin-account/reviews": "Monitor customer feedback and product sentiment",
  "/admin-account/analytics": "Revenue, products, locations, payments, and discounts",
  "/admin-account/team": "Manage admin access and security",
  "/admin-account/details": "Admin account settings",
};
```

- [x] **Step 3: Close mobile drawer on route change**

In `admin-shell.tsx`, import `useEffect` and close the drawer when `pathname` changes:

```ts
useEffect(() => {
  setSidebarOpen(false);
}, [pathname]);
```

- [x] **Step 4: Create reusable UI primitives**

Create `AdminMetricCard`, `AdminPanel`, `AdminToolbar`, `AdminBadge`, and `AdminEmptyState` using typed props and classes from `admin-ui.module.scss`. Keep them simple wrappers:

```tsx
export function AdminPanel({ title, action, children }: AdminPanelProps) {
  return (
    <section className={ui.panel}>
      <div className={ui.panelHeader}>
        <h2>{title}</h2>
        {action}
      </div>
      <div className={ui.panelBody}>{children}</div>
    </section>
  );
}
```

- [x] **Step 5: Refresh shared SCSS tokens**

In `admin-shell.module.scss` define the calm console tokens:

```scss
.shell {
  --admin-sidebar-w: 264px;
  --admin-bg: #f3f8fb;
  --admin-surface: #ffffff;
  --admin-border: #dce8ee;
  --admin-ink: #15211a;
  --admin-muted: #667482;
  --admin-sidebar: #171c24;
  --admin-accent: #22984f;
  --admin-accent-soft: #e7f6ed;
  --admin-info: #22a9e8;
  --admin-chart-blue: #2f54d8;
  --admin-chart-cyan: #55c7ee;
  --admin-warning: #b7791f;
  --admin-danger: #c2413f;
  --admin-radius: 8px;
  min-height: 100dvh;
  background: var(--admin-bg);
}
```

Use these tokens in sidebar, topbar, and shared UI styles.

- [x] **Step 6: Run focused shell checks**

Run:

```bash
pnpm vitest run src/app/\(auth\)/\(dashboard\)/admin-account/layout.test.ts
pnpm exec tsc --noEmit
```

Expected: both commands exit 0.

- [x] **Step 7: Commit**

```bash
git add src/app/\(auth\)/\(dashboard\)/admin-account/components
git add src/app/\(auth\)/\(dashboard\)/admin-account/layout.test.ts
git commit -m "feat: redesign admin shell foundation"
```

## Task 2: Overview Dashboard Redesign

**Files:**
- Modify: `src/app/(auth)/(dashboard)/admin-account/components/dashboard/admin-dashboard.tsx`
- Modify: `src/app/(auth)/(dashboard)/admin-account/styles.module.scss`
- Reuse: shared UI primitives from Task 1

- [ ] **Step 1: Replace decorative dashboard structure with operations layout**

Use this section order in `admin-dashboard.tsx`:

1. Top workspace row inherited from shell: search/action bar and compact admin identity.
2. Welcome/performance strip in the reference style: admin avatar/name, today's sales, overall performance, and a non-copied JK Organics visual area or compact product/operations summary.
3. Main dashboard grid: revenue updates chart, sales overview donut, weekly stats, yearly/monthly sales.
4. Right insight rail on wide screens: delivery fees/expense, sales/revenue, income/net revenue, growth/comparison, monthly earnings, payment gateways.
5. Lower operations panels: recent orders, top products, top locations, pending/unpaid orders.

- [ ] **Step 2: Use `AdminMetricCard` for KPI cards**

Map current dashboard totals into cards:

```tsx
<AdminMetricCard
  label="Revenue"
  value={formatCurrency(stats.revenue)}
  tone="info"
  icon={Banknote}
  detail="Selected recent orders"
/>
```

Use `tone="neutral" | "success" | "info" | "warning" | "danger"` consistently.

- [ ] **Step 3: Create reference-inspired dashboard grid classes**

In `styles.module.scss`, implement desktop areas close to the reference:

```scss
.dashboardCanvas {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 16px;
}

.primaryGrid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 0.9fr);
  gap: 16px;
}

.insightRail {
  display: grid;
  gap: 16px;
}

@media (max-width: 1180px) {
  .dashboardCanvas {
    grid-template-columns: 1fr;
  }

  .insightRail {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .primaryGrid,
  .insightRail {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 4: Make recent orders scannable**

Render recent orders inside `AdminPanel` with customer, status badge, payment method, total, and link to `/admin-account/orders/${order.id}`. Use table on desktop and stacked cards via CSS on narrow screens.

- [ ] **Step 5: Keep the dashboard original**

Do not copy the reference character illustration, exact eMart labels, exact chart shapes, exact colors, or exact icon artwork. Use JK Organics metrics and simple original visual blocks/charts from Recharts or existing chart components.

- [ ] **Step 6: Verify dashboard route**

Run:

```bash
pnpm exec tsc --noEmit
curl -I http://127.0.0.1:3000/admin-account
```

Expected: typecheck exits 0. Curl returns `307` to sign-in when logged out or `200` if logged in.

- [ ] **Step 7: Commit**

```bash
git add src/app/\(auth\)/\(dashboard\)/admin-account/components/dashboard/admin-dashboard.tsx
git add src/app/\(auth\)/\(dashboard\)/admin-account/styles.module.scss
git commit -m "feat: redesign admin overview dashboard"
```

## Task 3: Fulfillment Pages Redesign

**Files:**
- Modify: `src/app/(auth)/(dashboard)/admin-account/orders/comp/admin-orders-page.tsx`
- Modify: `src/app/(auth)/(dashboard)/admin-account/orders/comp/styles.module.scss`
- Modify: `src/app/(auth)/(dashboard)/admin-account/orders/comp/admin-single-order.tsx`
- Modify: `src/app/(auth)/(dashboard)/admin-account/orders/comp/admin-single-order-styles.module.scss`
- Modify: `src/app/(auth)/(dashboard)/admin-account/payments/payment-page/page.tsx`
- Modify: `src/app/(auth)/(dashboard)/admin-account/payments/payment-page/styles.module.scss`

- [ ] **Step 1: Redesign orders list header and toolbar**

Use `PageHeader` and `AdminToolbar`. Controls should include search, status filter, payment method filter if available, and date/location filters only if the current data already supports them. Do not add new backend query params unless existing route support exists.

- [ ] **Step 2: Add fulfillment KPI chips**

Compute visible counts client-side from loaded orders:

```ts
const fulfillmentCounts = {
  pending: orders.filter((order) => order.status === "pending").length,
  processing: orders.filter((order) => order.status === "processing").length,
  completed: orders.filter((order) => order.status === "completed").length,
  unpaid: orders.filter((order) => !order.date_paid).length,
};
```

Render them in a compact `.statusStrip`.

- [ ] **Step 3: Redesign orders table/cards**

Desktop columns: order, customer, status, payment, delivery/location, total, date, actions. Mobile layout: one card per order with status and total at the top.

- [ ] **Step 4: Redesign order detail**

Use two-column layout:

- Main column: items, customer, delivery, notes.
- Side column: status, payment, totals, quick actions.

Keep mark-paid, notes, and payment-prompt interactions intact.

- [ ] **Step 5: Redesign payments page**

Use KPI row and reconciliation table:

- collected
- pending
- failed
- cash total
- M-Pesa/IntaSend total

Keep existing payment API fields and links to orders.

- [ ] **Step 6: Verify fulfillment pages**

Run:

```bash
pnpm exec tsc --noEmit
curl -I http://127.0.0.1:3000/admin-account/orders
curl -I http://127.0.0.1:3000/admin-account/payments
```

Expected: typecheck exits 0. Routes return protected redirects or 200 depending on session.

- [ ] **Step 7: Commit**

```bash
git add src/app/\(auth\)/\(dashboard\)/admin-account/orders
git add src/app/\(auth\)/\(dashboard\)/admin-account/payments
git commit -m "feat: redesign admin fulfillment pages"
```

## Task 4: Catalog Pages Redesign

**Files:**
- Modify: `src/app/(auth)/(dashboard)/admin-account/products/page.tsx`
- Modify: `src/app/(auth)/(dashboard)/admin-account/products/products-list.module.scss`
- Modify: `src/app/(auth)/(dashboard)/admin-account/products/styles.module.scss`
- Modify: `src/app/(auth)/(dashboard)/admin-account/products/comp/product-form.tsx`
- Modify: `src/app/(auth)/(dashboard)/admin-account/products/comp/product-form.module.scss`
- Modify: `src/app/(auth)/(dashboard)/admin-account/coupons/page.tsx`
- Modify: `src/app/(auth)/(dashboard)/admin-account/coupons/comp/coupon-form.tsx`
- Modify: `src/app/(auth)/(dashboard)/admin-account/coupons/comp/coupon-form.module.scss`
- Modify: `src/app/(auth)/(dashboard)/admin-account/reviews/comp/admin-reviews-page.tsx`
- Modify: `src/app/(auth)/(dashboard)/admin-account/reviews/styles.module.scss`

- [ ] **Step 1: Redesign products list**

Use summary chips for total products, visible products, low stock, and out of stock. Use a table with thumbnail, product name, category, price, stock badge, status, and actions.

- [ ] **Step 2: Redesign product forms**

Split the existing form into visually clear sections without changing submission payloads:

- Basics
- Pricing
- Inventory
- Images
- Organization
- Linked products
- Variations

Use a sticky bottom or top save area only on desktop; on mobile keep save action near the page header and at the end of the form.

- [ ] **Step 3: Redesign coupons list**

Use a compact table/card layout with code, type, amount, usage, expiry, status, and row actions. Use amber badge for expiring coupons and muted badge for inactive/expired.

- [ ] **Step 4: Redesign coupon form**

Group fields into discount, restrictions, usage limits, and expiry. Use toggles/inputs for binary/numeric settings and preserve current validation.

- [ ] **Step 5: Redesign reviews page**

Use KPI cards for total reviews, average rating, low-rating count, and recent review count. Use rating distribution panel and a review list/table with product link, reviewer, rating, excerpt, and date.

- [ ] **Step 6: Verify catalog pages**

Run:

```bash
pnpm exec tsc --noEmit
curl -I http://127.0.0.1:3000/admin-account/products
curl -I http://127.0.0.1:3000/admin-account/coupons
curl -I http://127.0.0.1:3000/admin-account/reviews
```

Expected: typecheck exits 0. Routes return protected redirects or 200 depending on session.

- [ ] **Step 7: Commit**

```bash
git add src/app/\(auth\)/\(dashboard\)/admin-account/products
git add src/app/\(auth\)/\(dashboard\)/admin-account/coupons
git add src/app/\(auth\)/\(dashboard\)/admin-account/reviews
git commit -m "feat: redesign admin catalog pages"
```

## Task 5: Growth Analytics Redesign

**Files:**
- Modify: `src/app/(auth)/(dashboard)/admin-account/analytics/comp/analytics-page.tsx`
- Modify: `src/app/(auth)/(dashboard)/admin-account/analytics/comp/date-range-controls.tsx`
- Modify: `src/app/(auth)/(dashboard)/admin-account/analytics/comp/report-table.tsx`
- Modify: `src/app/(auth)/(dashboard)/admin-account/analytics/comp/csv-export.tsx`
- Modify: `src/app/(auth)/(dashboard)/admin-account/analytics/styles.module.scss`
- Test: `src/app/(auth)/(dashboard)/admin-account/analytics/comp/date-range-controls.test.ts`
- Test: `src/app/(auth)/(dashboard)/admin-account/analytics/comp/report-table.test.ts`
- Test: `src/app/(auth)/(dashboard)/admin-account/analytics/comp/analytics-page.test.ts`

- [ ] **Step 1: Preserve analytics data contracts**

Do not change `/api/admin/analytics/*` response shapes. Redesign the presentation layer around existing `AnalyticsOverviewResponse`, report responses, and CSV helpers.

- [ ] **Step 2: Recompose analytics page**

Use this order:

1. Page header and date controls.
2. KPI row: revenue, net revenue, delivery fees, discounts, orders, AOV, units sold.
3. Revenue/orders chart and payment split.
4. Insight callouts.
5. Report tabs and report table.

- [ ] **Step 3: Redesign report tabs**

Use segmented controls with icons:

- Products
- Locations
- Payments
- Discounts

Keep URL/query state behavior already present.

- [ ] **Step 4: Redesign report table**

Make the table visually consistent with other admin tables: compact header, sortable indicators, empty state, CSV action near report title, and mobile stacked rows when columns cannot fit.

- [ ] **Step 5: Verify analytics tests**

Run:

```bash
pnpm vitest run src/app/\(auth\)/\(dashboard\)/admin-account/analytics/comp/date-range-controls.test.ts src/app/\(auth\)/\(dashboard\)/admin-account/analytics/comp/report-table.test.ts src/app/\(auth\)/\(dashboard\)/admin-account/analytics/comp/analytics-page.test.ts
pnpm exec tsc --noEmit
```

Expected: all tests pass and typecheck exits 0.

- [ ] **Step 6: Commit**

```bash
git add src/app/\(auth\)/\(dashboard\)/admin-account/analytics
git commit -m "feat: redesign admin growth analytics"
```

## Task 6: Team and Settings Redesign

**Files:**
- Modify: `src/app/(auth)/(dashboard)/admin-account/team/page.tsx`
- Modify: `src/app/(auth)/(dashboard)/admin-account/team/team.module.scss`
- Modify: `src/app/(auth)/(dashboard)/admin-account/team/styles.module.scss`
- Modify: `src/app/(auth)/(dashboard)/admin-account/details/page.tsx`
- Test: `src/app/(auth)/(dashboard)/admin-account/team/layout.test.ts`

- [ ] **Step 1: Redesign team page hierarchy**

Make the current admins list primary. Place create-admin in a compact panel beside or below it depending on viewport.

- [ ] **Step 2: Replace destructive inline actions with modal pattern**

Use the shared `AdminPanel`, `AdminBadge`, and modal styles from Task 1. Keep existing behavior for:

- reset password
- block
- unblock
- delete/remove access

Every destructive modal must show target `name` or `email`.

- [ ] **Step 3: Redesign create-admin form**

Keep schema and endpoint unchanged. Use compact labels, secure password fields, and clear validation.

- [ ] **Step 4: Redesign account details**

Use simple panels:

- Profile
- Access
- Session/sign out

Do not invent store settings in this pass.

- [ ] **Step 5: Verify team/settings**

Run:

```bash
pnpm vitest run src/app/\(auth\)/\(dashboard\)/admin-account/team/layout.test.ts
pnpm exec tsc --noEmit
curl -I http://127.0.0.1:3000/admin-account/team
curl -I http://127.0.0.1:3000/admin-account/details
```

Expected: tests pass, typecheck exits 0, routes return protected redirects or 200 depending on session.

- [ ] **Step 6: Commit**

```bash
git add src/app/\(auth\)/\(dashboard\)/admin-account/team
git add src/app/\(auth\)/\(dashboard\)/admin-account/details/page.tsx
git commit -m "feat: redesign admin team and settings"
```

## Task 7: Full Responsive Verification and Polish

**Files:**
- Modify as needed: admin SCSS modules touched in Tasks 1-6
- Modify as needed: UI components touched in Tasks 1-6
- Optional create: `docs/admin-dashboard-redesign-verification.md`

- [ ] **Step 1: Run automated checks**

Run:

```bash
pnpm vitest run
pnpm exec tsc --noEmit
pnpm exec biome check src/app/\(auth\)/\(dashboard\)/admin-account src/lib/admin src/lib/auth
```

Expected: all commands exit 0.

- [ ] **Step 2: Check protected routes**

Run:

```bash
curl -I http://127.0.0.1:3000/admin-account
curl -I http://127.0.0.1:3000/admin-account/orders
curl -I http://127.0.0.1:3000/admin-account/products
curl -I http://127.0.0.1:3000/admin-account/analytics
```

Expected: unauthenticated routes redirect to `/auth/admin/signin`; authenticated browser sessions render pages.

- [ ] **Step 3: Manual responsive pass**

In browser, check these viewport sizes:

- 390 x 844
- 768 x 1024
- 1440 x 900

Routes to inspect:

- `/admin-account`
- `/admin-account/orders`
- `/admin-account/orders/[existing-order-id]`
- `/admin-account/products`
- `/admin-account/products/new`
- `/admin-account/coupons`
- `/admin-account/reviews`
- `/admin-account/analytics`
- `/admin-account/team`
- `/admin-account/details`

Confirm:

- no overlapping text
- no card-in-card visual nesting
- no table controls escaping containers
- mobile drawer opens and closes
- destructive modals fit mobile screens
- primary actions are visible

- [ ] **Step 4: Fix polish issues**

Only fix issues found in Step 3. Do not add new features. Keep changes scoped to layout, spacing, overflow, responsive behavior, accessibility labels, and visual consistency.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(auth\)/\(dashboard\)/admin-account
git commit -m "fix: polish admin redesign responsiveness"
```

## Completion Criteria

- All admin routes use the Calm Operations Console visual system.
- Sidebar uses workflow grouping: Overview, Fulfillment, Catalog, Growth, Team, Settings.
- Full admin scope is covered, including list pages, detail pages, forms, team, and settings.
- Existing API/data contracts remain intact.
- Typecheck passes.
- Relevant tests pass.
- Manual desktop/tablet/mobile verification is complete.

## Self-Review Notes

- Spec coverage: every spec page group maps to Tasks 1-7.
- Backend scope: no new backend feature work is included except preserving existing UI behavior.
- Accessibility: covered in shell, modal, table, and responsive verification.
- No unresolved user-facing design questions remain; implementation makes remaining decisions under the committed spec.
