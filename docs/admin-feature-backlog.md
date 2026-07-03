# Admin Feature Backlog

Logged on: 2026-07-03

This backlog groups the requested future admin work after scanning the current codebase. The app is a Next.js admin dashboard backed by Prisma users, WooCommerce REST orders/products, WordPress/WPGraphQL product reviews, and existing admin helpers in `src/lib/admin`.

## Current Codebase Notes

- Admin users are stored in Prisma `User` records with string roles: `super_admin`, `min_admin`, and `user`.
- Super admins can currently create admins and remove admin access by demoting a user to `user`.
- There is no current user block/disabled field, hard-delete admin flow, or admin password update flow.
- Product reviews currently come from WordPress/Woo GraphQL comments and render on product detail pages only.
- The admin dashboard already has basic metrics: weekly revenue/orders/units/average order, order status counts, payment method counts, top products, monthly charting, recent orders, and year-over-year helpers.
- Orders expose useful fields for deeper analytics: `total`, `line_items`, `shipping_lines`, `payment_method`, `billing`, `shipping`, `meta_data`, `customer_note`, `date_created`, `date_paid`, and status.
- Checkout writes delivery metadata such as `_delivery_type`, `_county`, parcel town/office data, pickup point data, shipping cost, payment method, and coupon lines.

## Research Notes

- WooCommerce Analytics emphasizes date ranges, comparison periods, KPI summary cards, chart/table drilldowns, CSV download, sorting, search, pagination, and report-specific filters.
- WooCommerce's default performance metrics include total sales, net sales, gross sales, orders, average order value, products sold, refunds, discounted orders, discount amount, tax, and shipping.
- Shopify's default report categories include acquisition, behavior, customers, finance, fraud, inventory, marketing, orders, profit, retail sales, and sales reports. For JK Organics, the most immediately useful categories are sales, orders, finance, customers/locations, inventory, and product performance.

Sources:

- https://woocommerce.com/document/woocommerce-analytics/
- https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/default-reports

## Group 1: Admin Team Security and Controls

1. Add admin password update/reset capability.
   - Allow a super admin to set a new password for another admin.
   - Add a Zod schema for password + confirmation.
   - Add an authenticated API action, likely under `/api/admin/users/[id]/password`.
   - Hash passwords with the existing bcrypt approach.
   - Prevent changing the acting user's own password from the team-management endpoint.
   - Add success/error toasts and loading state in the Team page.
   - Add tests for validation, authorization, missing users, and password hashing.

2. Add admin block/disable capability.
   - Decide data model: add a Prisma field such as `blockedAt`, `disabledAt`, or `status`.
   - Update auth/admin login checks so blocked admins cannot sign in or access admin pages.
   - Add Team table status badges and block/unblock actions.
   - Prevent blocking the last super admin and prevent self-blocking.
   - Add tests for login denial, admin route denial, and unblock flow.

3. Add admin delete capability.
   - Decide whether delete means hard delete or soft delete.
   - If hard delete, account for related `accounts`, `sessions`, and `loginAttempt` relations.
   - If soft delete, reuse the block/status model and hide deleted admins from active views.
   - Add confirmation UI with the admin name/email in the prompt.
   - Prevent deleting the current user and prevent removing the last super admin.
   - Add tests for authorization, relation cleanup/soft-delete behavior, and UI state.

4. Improve Team page UX for admin management.
   - Split "Create admin" and "Current admins" into clearer workflows.
   - Add row actions: reset password, block/unblock, delete/remove role.
   - Add search/filter by role/status.
   - Add empty states and safer confirmation modals instead of `window.confirm`.
   - Consider an audit-friendly activity log later, especially for password/block/delete actions.

## Group 2: Customer Reviews Admin Experience

1. Add an admin reviews data source.
   - Create an admin-only fetch helper for product reviews/comments from WordPress/Woo GraphQL or Woo REST, depending on available fields.
   - Include review id, product id/name/slug, reviewer name/email, rating, date, content, status if available, and product image if easy to fetch.
   - Add server/API authorization via `requireAdminSession`.

2. Add `/admin-account/reviews`.
   - Add Reviews to `adminNavGroups`.
   - Build a modern, scannable reviews page using existing admin shell styles.
   - Include summary cards: total reviews, average rating, pending/unapproved if available, low-rating count.
   - Include filters: rating, product, date range, search reviewer/content, status.
   - Include a sortable/paginated table or card list with product context and review excerpts.

3. Add review detail and moderation actions if supported by backend.
   - Open a review drawer/detail view with full content, customer identity, product link, and date.
   - Add approve/unapprove/spam/trash/delete actions if the WordPress/Woo API supports them.
   - Add direct product links and optionally "reply later" notes.
   - Add optimistic UI or clear loading states for moderation actions.

4. Add review insights.
   - Show rating distribution.
   - Show top-reviewed products.
   - Show products with poor average rating.
   - Show recent negative reviews that need attention.
   - Show review velocity over time.

## Group 3: Analytics Data Foundation

1. Define analytics date filtering and comparison.
   - Add report date presets: today, yesterday, week to date, last 7 days, month to date, last month, quarter to date, year to date, custom.
   - Add previous-period comparison and previous-year comparison.
   - Persist filters in URL search params for shareable views.

2. Move deeper analytics to report-specific aggregation.
   - Avoid expanding the global admin layout order fetch indefinitely.
   - Add `src/lib/admin/analytics-service.ts` or grouped helpers in `src/lib/admin/admin-stats.ts`.
   - Consider API routes such as `/api/admin/analytics/overview`, `/api/admin/analytics/products`, `/api/admin/analytics/locations`, and `/api/admin/analytics/payments`.
   - Keep pure calculation helpers testable with Vitest fixtures.

3. Add revenue calculations.
   - Gross product sales from line items.
   - Net revenue after discounts/refunds where available.
   - Total delivery/shipping fees from `shipping_lines`.
   - Total discounts from coupon lines/order discount fields if returned by Woo.
   - Total revenue by payment method: cash on delivery, M-Pesa/IntaSend, and other.
   - Average order value.
   - Units sold.
   - Refund/cancelled order impact if data is available.

4. Add location analytics.
   - Most ordered counties/locations from `_county`, `billing.state`, `shipping.state`, city, parcel town, and pickup metadata.
   - Delivery type split: door-to-door, parcel office, pickup.
   - Revenue and order count by county/city.
   - Delivery fees by location.
   - Identify high-demand and low-demand delivery zones.

5. Add product analytics.
   - Most ordered products by quantity and revenue.
   - Least ordered or not ordered products.
   - Products never sold in selected period.
   - Product variation/size performance where `variation_id` and item metadata exist.
   - Product revenue share.
   - Product attach/basket patterns if order data supports it.
   - Slow movers that may need discounting.

6. Add coupon/discount analytics.
   - Discount amount by coupon.
   - Orders using coupons.
   - Revenue after discount by coupon.
   - Best/worst performing coupons.
   - Coupon usage over time.

7. Add customer/order behavior analytics.
   - Returning vs new customer estimate by email/phone.
   - Repeat purchase count by customer.
   - Average items per order.
   - Peak order days and hours.
   - Time from order created to paid/completed where status dates exist.
   - Abandoned or unpaid order rate using pending/on-hold/failed statuses.

8. Add inventory decision analytics.
   - Low-stock products if stock data is available from Woo product fetches.
   - Fast-moving products to restock.
   - Dead stock/slow-moving products.
   - Stock value and expected days of supply if inventory fields are available.

## Group 4: Analytics Admin UI/UX

1. Create a dedicated analytics page or section.
   - Add `/admin-account/analytics` to navigation or upgrade the dashboard into a richer analytics landing page.
   - Keep the existing dashboard as a quick overview, and use analytics pages for deeper reports.

2. Build an executive overview.
   - KPI cards for total revenue, net revenue, order count, average order value, delivery fees, discounts, units sold, and payment split.
   - Trend badges against previous period.
   - Charts for revenue/orders over time.
   - Leaderboards for top products, top locations, top customers if available, and top coupons.

3. Build report drilldowns.
   - Product report with sortable columns for quantity, revenue, average item value, order count, and trend.
   - Location report with map-like ranking/list, county/city filters, delivery fee totals, and demand trends.
   - Payment report showing cash vs M-Pesa totals, count, paid/unpaid state, and reconciliation flags.
   - Discounts report showing coupon impact and revenue after discount.

4. Add modern report interactions.
   - Date range picker and comparison selector.
   - Search, filters, column sorting, pagination, and column visibility where useful.
   - CSV export for report tables.
   - Empty states that explain when no data exists for the selected period.
   - Loading skeletons for reports.
   - Mobile-friendly stacked cards for dense tables.

5. Add owner-focused insight callouts.
   - "Best seller this period."
   - "Location with most orders."
   - "Most revenue lost to discounts."
   - "Products with no sales."
   - "Delivery zone generating the most fees."
   - "Payment method with highest unpaid/pending rate."
   - Keep these factual and derived from data, avoiding unsupported recommendations.

## In Scope: Build Plan Now

Implementation plan: `docs/superpowers/plans/2026-07-03-admin-backlog-implementation-plan.md`

1. Admin password reset, block/unblock, and delete data-model decision.
2. Admin team API/tests, then Team page UI.
3. Reviews admin data source and Reviews page.
4. Analytics calculation helpers with tests.
5. Analytics overview UI.
6. Product/location/payment/discount report drilldowns.
7. CSV export and advanced personalization.
