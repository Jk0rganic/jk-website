# Admin Dashboard Redesign Design

Date: 2026-07-05

## Purpose

Redesign the full admin dashboard into a calm, modern operations console for JK Organics. The current admin feature set is strong, but the UI should feel simpler, more consistent, and easier for a shop owner to scan during daily work.

The chosen direction is **Calm Operations Console**, now anchored to the eMart-style Dribbble reference the owner selected: a compact dark sidebar, pale blue-gray workspace, white metric/chart cards, dense analytics widgets, and a right-side insight column on wide screens. The implementation should be close in layout rhythm and dashboard composition, while remaining an original JK Organics interface using real store data, JK branding, and accessible components.

## Scope

This redesign covers the full admin area:

- Shared shell, sidebar, topbar, page headers, cards, tables, filters, buttons, badges, empty states, loading states, modals, and mobile navigation.
- Overview dashboard.
- Fulfillment pages: orders list, order detail, payments.
- Catalog pages: products list, product create/edit/detail, coupons list, coupon create/edit, reviews.
- Growth pages: analytics overview and report drilldowns.
- Team page: create admin, reset password, block/unblock, delete/remove access.
- Settings/account details page.

Out of scope for this redesign:

- Rebuilding backend analytics or admin-management APIs beyond UI compatibility fixes required by the redesign.
- Adding new commerce features not already represented in the admin backlog.
- Public storefront redesign.

## Information Architecture

Use workflow groups in the sidebar rather than a flat page list:

- **Overview**
  - Dashboard
- **Fulfillment**
  - Orders
  - Payments
- **Catalog**
  - Products
  - Coupons
  - Reviews
- **Growth**
  - Analytics
  - Reports, represented as analytics drilldown tabs rather than a separate route for now
- **Team**
  - Admins, super-admin only
- **Settings**
  - Account

The sidebar should keep familiar labels visible inside the new groups so existing users do not need to relearn the system. Active states should match both exact pages and nested detail routes.

## Visual System

The UI should be quiet and operational, not decorative. The main dashboard should feel close to the provided eMart reference, translated for JK Organics rather than copied pixel-for-pixel.

- Background: pale blue-gray workspace similar to the reference, not pure white.
- Sidebar: deep charcoal or deep green-black with compact grouped navigation and soft active row highlights.
- Accent: JK Organics green for primary actions, success states, and active navigation, supported by cyan/blue chart accents inspired by the reference.
- Supporting colors: blue/cyan for informational analytics, amber for attention, red only for destructive or failed states.
- Cards: 8px radius or less, subtle border, soft shadow, and white surface on the pale workspace.
- Tables: crisp row separation, sticky or visually stable headers where useful, compact controls.
- Typography: smaller, tighter headings inside panels; no oversized marketing-style hero sections.
- Icons: lucide icons for navigation and icon buttons.
- Spacing: consistent page gutters, dense enough for operations but not cramped.
- Dashboard composition: search/action topbar, welcome/performance strip, central chart grid, compact right-side KPI widgets, and lower payment/product/order panels on desktop.

Avoid:

- Decorative orbs, heavy gradients, oversized hero sections, card-in-card layouts, and one-color green-only screens.
- In-app explanatory text that describes how to use obvious controls.
- Large illustrated characters or decorative SaaS art inside the admin dashboard.
- Direct copying of third-party artwork, characters, logos, exact text, exact icons, or exact chart graphics from the reference.

## Shared Shell

The shared shell becomes the main foundation.

Desktop:

- Fixed-width dark sidebar with grouped navigation.
- Topbar with page title, optional search, compact quick actions, and admin identity.
- Main content uses the eMart-like dashboard rhythm: wide central working area plus a compact right insight rail on dashboard/analytics pages where viewport width allows it.
- Breadcrumb or back affordance appears on detail/create/edit pages.

Mobile:

- Sidebar becomes a drawer opened by an icon button.
- Topbar stays compact and does not crowd the page title.
- Dense tables become stacked cards or horizontally scrollable only when data comparison is essential.
- Primary actions remain reachable near the page title.

## Reusable Components

Create or consolidate reusable admin UI primitives before rewriting individual pages:

- `AdminPageHeader`: title, subtitle, breadcrumbs/back link, actions.
- `AdminMetricCard`: label, value, trend, icon, optional link.
- `AdminPanel`: simple section container with header/action slots.
- `AdminToolbar`: search, filters, segmented controls, export/actions.
- `AdminDataTable`: table shell with loading, empty, error, pagination, and row action patterns.
- `AdminBadge`: status, payment, role, stock, review rating.
- `AdminModal` or dialog pattern: destructive confirmations and password reset.
- `AdminTabs` or segmented report switcher.
- `AdminEmptyState` and `AdminSkeleton`.

These components should live near the existing admin UI components and use SCSS Modules consistent with the project.

## Page Designs

### Overview

The dashboard should answer: what needs attention today, how is revenue doing, and where should the owner click next?

Layout:

- Topbar with search, quick actions, notifications/account controls where useful.
- Welcome/performance strip similar in structure to the reference, but using JK Organics copy and metrics.
- KPI widgets: today's sales, overall performance, expenses/delivery fees, sales/revenue, income/net revenue, growth/comparison.
- Central cards: revenue updates chart, sales overview donut, weekly stats, yearly/monthly sales.
- Right rail on wide screens: compact sales/payment/earnings widgets and payment gateways.
- Lower panels: recent orders, top products, top locations, and payment split for cash vs M-Pesa/IntaSend.

Primary actions:

- Add product.
- View orders.
- Open analytics.

### Orders

The orders list should prioritize fulfillment speed.

Layout:

- Toolbar with search, status filter, date range, payment method, and delivery location.
- KPI chips for pending, processing, completed, unpaid.
- Dense table on desktop with order number, customer, date, status, payment, delivery location, total, and row actions.
- Mobile order cards with status and total emphasized.

Order detail:

- Header with order number, status, total, payment state, and key actions.
- Two-column desktop layout: fulfillment/payment timeline on the side, items/customer/delivery in the main column.
- Notes and payment prompt actions should be clear but not visually dominant.

### Products

Products should feel like inventory control, not a marketing gallery.

Layout:

- Toolbar with search, category, stock status, sort, and add product.
- Summary chips: total products, low stock, out of stock, visible products.
- Table with thumbnail, name, category, price, stock, status, updated date, and actions.
- Inline badges for low stock/out of stock.

Create/edit:

- Use sections: basics, pricing, inventory, images, categories/tags, linked products, variations.
- Sticky or persistent save action on long forms.
- Keep validation near fields and avoid large explanatory blocks.

### Coupons

Coupons should show commercial impact quickly.

Layout:

- Toolbar with search/status/type filters and create coupon.
- Cards or table columns for code, type, amount, usage, expiry, status, and actions.
- Expiring and inactive coupons should be easy to spot.

Create/edit:

- Group fields into discount, limits, eligibility, expiry.
- Use clear toggles and numeric inputs.

### Payments

Payments should help reconcile M-Pesa/IntaSend and cash.

Layout:

- KPI row: collected, pending, failed, cash total, M-Pesa total.
- Filters for provider, status, date, and order id.
- Table with provider, amount, status, transaction ref, phone, order link, date, and failure reason.
- Failed/pending payments get attention badges.

### Reviews

Reviews should be scannable and action-oriented.

Layout:

- KPI row: total reviews, average rating, low-rating count, recent reviews.
- Rating distribution panel.
- Toolbar with rating, product, date, search, and status if available.
- Review list/table with rating, product, reviewer, excerpt, date, and product link.
- Low ratings should be visually flagged without using alarming color everywhere.

### Analytics and Reports

Analytics remains the strategic growth area.

Layout:

- Date range and comparison controls at the top.
- KPI cards: total revenue, net revenue, delivery fees, discounts, order count, average order value, units sold.
- Charts for revenue/orders over time and payment split.
- Insight callouts based on facts from the data: top product, top location, unpaid order count, strongest payment channel, highest discount impact.
- Report tabs: Products, Locations, Payments, Discounts.
- Report tables keep sorting, filtering, pagination, and CSV export.

### Team

Team management should feel secure and deliberate.

Layout:

- Create-admin panel is compact and can be visually secondary to the current-admin list.
- Current admins table shows name, email, role, status, last known state where available, and actions.
- Actions use menus/buttons: reset password, block/unblock, delete/remove.
- Destructive actions require modal confirmation with target admin identity.
- Super-admin-only pages should retain access protection.

### Settings

Settings/account should be simple:

- Admin profile details.
- Account/security area.
- Sign-out action.
- Future store settings can be added later without crowding current needs.

## Data Flow

The redesign should preserve existing data-fetching boundaries:

- Admin shell reads session/user state through existing auth helpers.
- Overview uses existing dashboard/order helpers and links into analytics.
- Analytics continues using `/api/admin/analytics/*`.
- Reviews continue using `/api/admin/reviews`.
- Team continues using `/api/admin/users/*`.
- Products, coupons, orders, and payments continue using their existing admin API routes and Woo/Prisma helpers.

UI state should be URL-driven where useful:

- Analytics date/report filters.
- Orders status/date/search filters if practical.
- Product search/filter can remain client-side initially if the current API shape requires it.

## Error, Empty, and Loading States

Every redesigned page should include:

- Loading skeletons that match final layout shapes.
- Empty states with a useful next action.
- Error states with retry where the data is fetchable client-side.
- Inline form errors and toast feedback for mutations.
- Disabled/loading button states for all async actions.

## Accessibility

- All icon-only buttons need accessible labels and tooltips when the icon is not obvious.
- Status badges cannot rely on color alone.
- Dialogs must trap focus and have clear titles.
- Tables need semantic headers.
- Mobile drawer should be keyboard reachable and close on route change.
- Text must not overlap or overflow inside buttons/cards at desktop or mobile sizes.

## Implementation Approach

Recommended implementation order:

1. Redesign shared shell, grouped sidebar, topbar, and reusable admin UI primitives.
2. Redesign Overview using the new component system.
3. Redesign list-heavy pages: Orders, Products, Reviews, Payments, Coupons, Team.
4. Redesign Analytics and report drilldowns with the new visual system.
5. Redesign detail/form pages: order detail, product create/edit, coupon create/edit, account/settings.
6. Run responsive and visual checks across desktop and mobile.

This order lets the design language stabilize early while still covering the full admin area in one redesign project.

## Testing and Verification

Automated:

- Existing route/unit tests should remain passing.
- Add focused component tests only where behavior changes, especially navigation grouping, modal actions, and filter state.
- Run TypeScript and lint/format checks.

Manual:

- Verify desktop and mobile layouts for every admin route.
- Verify no text overlap in buttons, tables, cards, modals, and sidebar labels.
- Verify protected pages still redirect correctly.
- Verify destructive team actions still require confirmation.
- Verify analytics and CSV export controls still work.

## Open Decisions Resolved

- Visual direction: Calm Operations Console.
- Navigation: workflow groups.
- Scope: full admin redesign, including details and forms.
- Remaining UI decisions: delegated to implementation, guided by this spec.
