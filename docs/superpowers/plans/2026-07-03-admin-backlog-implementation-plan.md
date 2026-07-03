# Admin Backlog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the in-scope admin improvements: admin password reset/block/delete controls, customer reviews management, analytics helpers/UI, report drilldowns, CSV export, and basic report personalization.

**Architecture:** Implement this as staged, independently testable slices. Keep Prisma admin-account state in local database services, keep WooCommerce/WordPress data behind focused admin fetchers, and expose report-specific API/page modules instead of expanding the global admin layout order fetch.

**Tech Stack:** Next.js App Router, React 19, TypeScript, SCSS Modules, Prisma, NextAuth, WooCommerce REST, WPGraphQL/Woo review APIs, Zod, Vitest, Recharts, lucide-react.

---

## Scope Decision

This plan implements the `## In Scope: Build Plan Now` section in `docs/admin-feature-backlog.md`:

1. Admin password reset, block/unblock, and delete data-model decision.
2. Admin team API/tests, then Team page UI.
3. Reviews admin data source and Reviews page.
4. Analytics calculation helpers with tests.
5. Analytics overview UI.
6. Product/location/payment/discount report drilldowns.
7. CSV export and advanced personalization.

Data-model decisions:

- Block/unblock uses nullable Prisma field `disabledAt DateTime?`.
- Delete uses nullable Prisma field `deletedAt DateTime?` as a soft delete.
- Active admins are users whose role is `super_admin` or `min_admin` and `deletedAt` is `null`.
- Blocked admins keep their role, but cannot sign in or pass admin guards.
- Team management cannot block, delete, demote, or reset the password of the current acting admin through team-management endpoints.
- Team management cannot leave the store without at least one active, non-disabled super admin.

## Files and Responsibilities

Admin users and auth:

- Modify `prisma/schema.prisma`: add `disabledAt` and `deletedAt` to `User`.
- Create `prisma/migrations/<generated_admin_user_status>/migration.sql`: add nullable timestamp columns.
- Modify `src/generated/prisma` by running Prisma generation through the project build/test flow.
- Modify `src/lib/admin/admin-user-schema.ts`: add password reset schema and team action schemas.
- Modify `src/lib/admin/admin-user-service.ts`: map status fields, add guards for reset/block/delete.
- Modify `src/lib/admin/admin-user-service.test.ts`: unit tests for mapping and guard decisions.
- Modify `src/lib/admin/require-admin.ts`: reject disabled or deleted admins.
- Modify `src/lib/admin/require-admin.test.ts`: guard tests for disabled/deleted users.
- Modify `src/lib/auth/admin-login.ts` and/or `src/lib/auth/action/doAdminCredentialLogin.ts`: reject disabled/deleted admin login.
- Modify `src/lib/auth/admin-login.test.ts`: login tests for disabled/deleted users.
- Modify `src/app/api/admin/users/route.ts`: exclude soft-deleted admins and expose status fields.
- Modify `src/app/api/admin/users/[id]/route.ts`: keep demote behavior and add `DELETE` for soft delete.
- Create `src/app/api/admin/users/[id]/password/route.ts`: password reset endpoint.
- Create `src/app/api/admin/users/[id]/status/route.ts`: block/unblock endpoint.
- Create tests beside each new/changed admin user route.
- Modify `src/app/(auth)/(dashboard)/admin-account/team/page.tsx`: add reset, block/unblock, delete actions.
- Modify `src/app/(auth)/(dashboard)/admin-account/team/team.module.scss`: action/menu/modal styling.

Reviews:

- Create `src/lib/admin/review-service.ts`: review fetching, mapping, filtering, summary calculations.
- Create `src/lib/admin/review-service.test.ts`: pure mapper/filter/summary tests.
- Create `src/app/api/admin/reviews/route.ts`: admin reviews API.
- Create `src/app/api/admin/reviews/route.test.ts`: auth and filtering tests.
- Create `src/app/(auth)/(dashboard)/admin-account/reviews/page.tsx`: reviews route.
- Create `src/app/(auth)/(dashboard)/admin-account/reviews/comp/admin-reviews-page.tsx`: reviews UI.
- Create `src/app/(auth)/(dashboard)/admin-account/reviews/styles.module.scss`: page-specific layout.
- Modify `src/app/(auth)/(dashboard)/admin-account/components/shell/admin-nav.ts`: add Reviews nav item and page title.

Analytics:

- Create `src/lib/admin/analytics-date.ts`: date presets, ranges, comparison ranges, URL param parsing.
- Create `src/lib/admin/analytics-date.test.ts`: date range tests with fixed dates.
- Create `src/lib/admin/analytics-service.ts`: aggregation helpers for revenue, payments, products, locations, discounts, behavior, and CSV row models.
- Create `src/lib/admin/analytics-service.test.ts`: fixture-driven tests.
- Modify `src/lib/admin/fetch-admin-orders.ts`: support date filters and return enough order fields for analytics.
- Modify `src/types/global.d.ts`: add any missing Woo order fields needed for analytics, such as discount/coupon fields if present.
- Create `src/app/api/admin/analytics/overview/route.ts`.
- Create `src/app/api/admin/analytics/products/route.ts`.
- Create `src/app/api/admin/analytics/locations/route.ts`.
- Create `src/app/api/admin/analytics/payments/route.ts`.
- Create `src/app/api/admin/analytics/discounts/route.ts`.
- Create route tests for all analytics endpoints.
- Create `src/app/(auth)/(dashboard)/admin-account/analytics/page.tsx`.
- Create `src/app/(auth)/(dashboard)/admin-account/analytics/comp/analytics-page.tsx`.
- Create `src/app/(auth)/(dashboard)/admin-account/analytics/comp/report-table.tsx`.
- Create `src/app/(auth)/(dashboard)/admin-account/analytics/comp/date-range-controls.tsx`.
- Create `src/app/(auth)/(dashboard)/admin-account/analytics/comp/csv-export.tsx`.
- Create `src/app/(auth)/(dashboard)/admin-account/analytics/styles.module.scss`.
- Modify `src/app/(auth)/(dashboard)/admin-account/components/dashboard/admin-dashboard.tsx`: link to analytics and reuse overview helpers where reasonable.
- Modify `src/app/(auth)/(dashboard)/admin-account/components/shell/admin-nav.ts`: add Analytics nav item and page title.

Shared UI:

- Modify `src/app/(auth)/(dashboard)/admin-account/components/ui/page-header.tsx`: add `action` support that accepts compact toolbar controls without changing existing callers.
- Modify `src/app/(auth)/(dashboard)/admin-account/components/ui/admin-ui.module.scss`: add reusable dense table, toolbar, segmented control, badge, and modal styles.

Documentation:

- Modify `docs/admin-feature-backlog.md`: keep status notes synchronized as phases land.
- Create or update short implementation notes if any backend limitation changes review moderation or analytics fields.

## Task 1: Admin User Status Data Model

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_admin_user_status/migration.sql`
- Modify after generation: `src/generated/prisma`

- [ ] **Step 1: Add status fields to `User` in Prisma schema**

Add these fields near `createdAt`:

```prisma
  disabledAt    DateTime? @map("disabled_at")
  deletedAt     DateTime? @map("deleted_at")
```

- [ ] **Step 2: Create migration**

Run:

```bash
pnpm exec prisma migrate dev --name admin_user_status
```

Expected: Prisma creates a migration that adds `disabled_at` and `deleted_at` nullable columns to `users`.

- [ ] **Step 3: Verify generated SQL**

Open the generated migration and confirm it contains:

```sql
ALTER TABLE "users" ADD COLUMN "disabled_at" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN "deleted_at" TIMESTAMP(3);
```

- [ ] **Step 4: Generate Prisma client**

Run:

```bash
pnpm exec prisma generate
```

Expected: command exits 0.

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations src/generated/prisma
git commit -m "feat: add admin user status fields"
```

## Task 2: Admin User Service Guards

**Files:**
- Modify: `src/lib/admin/admin-user-service.ts`
- Modify: `src/lib/admin/admin-user-service.test.ts`
- Modify: `src/lib/admin/admin-user-schema.ts`

- [ ] **Step 1: Write failing service tests**

Add tests covering:

```ts
it("marks disabled admins as blocked and not removable when needed", () => {});
it("blocks actions against the acting admin", () => {});
it("blocks disabling or deleting the last active super admin", () => {});
it("allows super admin to reset a regular admin password", () => {});
it("allows soft-deleting a regular admin", () => {});
```

Expected guard decisions:

- Acting admin cannot reset/block/delete/demote self.
- Last active super admin cannot be blocked, deleted, or demoted.
- Regular admin can be reset, blocked, unblocked, soft-deleted, or demoted by a super admin.
- Soft-deleted users should not appear in active admin lists.

- [ ] **Step 2: Run failing tests**

Run:

```bash
pnpm vitest run src/lib/admin/admin-user-service.test.ts
```

Expected: FAIL because new helpers and fields do not exist.

- [ ] **Step 3: Implement service types and guards**

Add `disabledAt` and `deletedAt` to `AdminUserRecord`, `AdminUserListItem`, and the internal `UserRow`.

Expose helpers:

```ts
export function isActiveAdminUser(user: { role: string | null; deletedAt?: Date | null }) {
  const role = user.role || USER_ROLE;
  return (role === ADMIN_ROLE || role === SUPER_ADMIN_ROLE) && !user.deletedAt;
}

export function canManageAdminTarget(args: {
  action: "reset_password" | "block" | "unblock" | "delete" | "demote";
  actingUserId: string;
  targetUserId: string;
  targetRole: string;
  activeSuperAdminCount: number;
}) {
  if (args.targetUserId === args.actingUserId) {
    return { allowed: false, reason: "You cannot manage your own admin account here" };
  }

  if (
    args.targetRole === SUPER_ADMIN_ROLE &&
    ["block", "delete", "demote"].includes(args.action) &&
    args.activeSuperAdminCount <= 1
  ) {
    return {
      allowed: false,
      reason: "At least one active super admin must remain on the account",
    };
  }

  return { allowed: true };
}
```

Keep `canRevokeAdminRole` as a compatibility wrapper or update its callers.

- [ ] **Step 4: Add Zod schemas**

In `src/lib/admin/admin-user-schema.ts`, add:

```ts
export const resetAdminPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm the password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const adminStatusSchema = z.object({
  disabled: z.boolean(),
});
```

- [ ] **Step 5: Run service tests**

Run:

```bash
pnpm vitest run src/lib/admin/admin-user-service.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/admin/admin-user-service.ts src/lib/admin/admin-user-service.test.ts src/lib/admin/admin-user-schema.ts
git commit -m "feat: add admin management guards"
```

## Task 3: Admin Auth Guard and Login Blocking

**Files:**
- Modify: `src/lib/admin/require-admin.ts`
- Modify: `src/lib/admin/require-admin.test.ts`
- Modify: `src/lib/auth/admin-login.ts`
- Modify: `src/lib/auth/admin-login.test.ts`
- Review: `src/lib/auth/action/doAdminCredentialLogin.ts`

- [ ] **Step 1: Write failing auth tests**

Add tests that prove:

- `requireAdminSession` rejects a session user with `disabledAt`.
- `requireAdminSession` rejects a session user with `deletedAt`.
- `requireSuperAdminSession` rejects disabled/deleted super admins.
- Admin credential login rejects disabled/deleted admins with a friendly error.

- [ ] **Step 2: Run failing tests**

Run:

```bash
pnpm vitest run src/lib/admin/require-admin.test.ts src/lib/auth/admin-login.test.ts
```

Expected: FAIL until status checks are implemented.

- [ ] **Step 3: Implement guard checks**

Update `require-admin.ts` so any disabled/deleted session user returns `Forbidden`.

Update admin login lookup to include `disabledAt` and `deletedAt`, then reject with:

```ts
"This admin account is blocked. Contact the store owner."
```

for disabled accounts and:

```ts
"This admin account is no longer active."
```

for soft-deleted accounts.

- [ ] **Step 4: Run auth tests**

Run:

```bash
pnpm vitest run src/lib/admin/require-admin.test.ts src/lib/auth/admin-login.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/admin/require-admin.ts src/lib/admin/require-admin.test.ts src/lib/auth/admin-login.ts src/lib/auth/admin-login.test.ts src/lib/auth/action/doAdminCredentialLogin.ts
git commit -m "feat: block disabled admin access"
```

## Task 4: Admin User API Endpoints

**Files:**
- Modify: `src/app/api/admin/users/route.ts`
- Modify: `src/app/api/admin/users/[id]/route.ts`
- Create: `src/app/api/admin/users/[id]/password/route.ts`
- Create: `src/app/api/admin/users/[id]/password/route.test.ts`
- Create: `src/app/api/admin/users/[id]/status/route.ts`
- Create: `src/app/api/admin/users/[id]/status/route.test.ts`
- Create: `src/app/api/admin/users/[id]/route.test.ts`

- [ ] **Step 1: Write API tests**

Cover these cases:

- `GET /api/admin/users` excludes `deletedAt` users and includes `disabledAt`.
- password reset requires super admin.
- password reset rejects invalid/mismatched passwords.
- password reset rejects self-management.
- password reset hashes password.
- status update blocks and unblocks regular admins.
- status update rejects self-management.
- status update rejects blocking last active super admin.
- `DELETE /api/admin/users/[id]` soft deletes a regular admin.
- `DELETE` rejects self-management and last active super admin deletion.

- [ ] **Step 2: Run failing API tests**

Run:

```bash
pnpm vitest run src/app/api/admin/users
```

Expected: FAIL until endpoints exist.

- [ ] **Step 3: Implement API behavior**

Use `requireSuperAdminSession`, Prisma, `bcrypt.hash`, and service guards.

Important query rule for active super admin count:

```ts
prisma.user.count({
  where: {
    role: SUPER_ADMIN_ROLE,
    disabledAt: null,
    deletedAt: null,
  },
});
```

Soft delete behavior:

```ts
data: {
  deletedAt: new Date(),
  sessions: { deleteMany: {} },
}
```

Blocking behavior:

```ts
data: {
  disabledAt: parsed.data.disabled ? new Date() : null,
  sessions: parsed.data.disabled ? { deleteMany: {} } : undefined,
}
```

- [ ] **Step 4: Run API tests**

Run:

```bash
pnpm vitest run src/app/api/admin/users
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/admin/users src/lib/admin
git commit -m "feat: add admin user management endpoints"
```

## Task 5: Team Page Management UI

**Files:**
- Modify: `src/app/(auth)/(dashboard)/admin-account/team/page.tsx`
- Modify: `src/app/(auth)/(dashboard)/admin-account/team/team.module.scss`
- Modify: `src/app/(auth)/(dashboard)/admin-account/components/ui/admin-ui.module.scss`

- [ ] **Step 1: Update Team UI state**

Add state for:

```ts
const [actionUser, setActionUser] = useState<AdminUserListItem | null>(null);
const [actionType, setActionType] = useState<"password" | "block" | "unblock" | "delete" | null>(null);
const [actionLoading, setActionLoading] = useState(false);
```

- [ ] **Step 2: Add action handlers**

Implement fetch calls:

- `PATCH /api/admin/users/[id]/password`
- `PATCH /api/admin/users/[id]/status`
- `DELETE /api/admin/users/[id]`
- existing `PATCH /api/admin/users/[id]` for demote/remove role

Each successful action should `toast.success(...)`, close modal state, and call `loadUsers()`.

- [ ] **Step 3: Replace raw confirm for dangerous actions**

Use an in-page modal/dialog section with:

- target admin name and email,
- action-specific warning text,
- cancel button,
- confirm button with loading state.

- [ ] **Step 4: Add table filters**

Add local search and status filter:

- search name/email,
- role filter: all/admin/super admin,
- status filter: active/blocked.

- [ ] **Step 5: Run focused checks**

Run:

```bash
pnpm vitest run src/lib/admin/admin-user-service.test.ts src/app/api/admin/users
pnpm run lint
```

Expected: both commands exit 0.

- [ ] **Step 6: Commit**

```bash
git add 'src/app/(auth)/(dashboard)/admin-account/team' 'src/app/(auth)/(dashboard)/admin-account/components/ui/admin-ui.module.scss'
git commit -m "feat: improve admin team controls"
```

## Task 6: Reviews Admin Data Source

**Files:**
- Create: `src/lib/admin/review-service.ts`
- Create: `src/lib/admin/review-service.test.ts`
- Create: `src/app/api/admin/reviews/route.ts`
- Create: `src/app/api/admin/reviews/route.test.ts`

- [ ] **Step 1: Write review service tests**

Use fixtures with product name, reviewer, rating, date, status, and content.

Expected calculations:

- total reviews,
- average rating rounded to one decimal,
- low-rating count for rating <= 2,
- rating distribution for 1 through 5,
- search matches reviewer, email, product, and content,
- rating/status/product filters work together.

- [ ] **Step 2: Run failing service tests**

Run:

```bash
pnpm vitest run src/lib/admin/review-service.test.ts
```

Expected: FAIL because service does not exist.

- [ ] **Step 3: Implement review mapper and summary helpers**

Use a stable mapped type:

```ts
export type AdminReview = {
  id: number | string;
  productId: number;
  productName: string;
  productSlug?: string;
  reviewer: string;
  reviewerEmail: string;
  rating: number;
  date: string;
  status: string;
  content: string;
};
```

- [ ] **Step 4: Implement API route**

`GET /api/admin/reviews` should:

- require `requireAdminSession`,
- read `rating`, `status`, `search`, `product`, `after`, `before` query params,
- fetch reviews through a dedicated fetch helper,
- return `{ reviews, summary }`.

- [ ] **Step 5: Run review tests**

Run:

```bash
pnpm vitest run src/lib/admin/review-service.test.ts src/app/api/admin/reviews/route.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/admin/review-service.ts src/lib/admin/review-service.test.ts src/app/api/admin/reviews
git commit -m "feat: add admin reviews data source"
```

## Task 7: Reviews Admin Page

**Files:**
- Create: `src/app/(auth)/(dashboard)/admin-account/reviews/page.tsx`
- Create: `src/app/(auth)/(dashboard)/admin-account/reviews/comp/admin-reviews-page.tsx`
- Create: `src/app/(auth)/(dashboard)/admin-account/reviews/styles.module.scss`
- Modify: `src/app/(auth)/(dashboard)/admin-account/components/shell/admin-nav.ts`

- [ ] **Step 1: Add navigation**

Add a Store nav item:

```ts
{ label: "Reviews", href: "/admin-account/reviews", icon: MessageSquareText }
```

Add title:

```ts
"/admin-account/reviews": "Reviews",
```

- [ ] **Step 2: Create server page**

Create a page that renders the client component and lets the client fetch `/api/admin/reviews`.

- [ ] **Step 3: Build client UI**

Include:

- KPI cards: total reviews, average rating, low ratings, pending/unapproved count if present.
- Filters: search, rating, status, product/date filters where data supports it.
- A dense table/card list: product, reviewer, rating, status, date, excerpt.
- Detail drawer/expanded row showing full content and product link.
- Empty, loading, and error states.

- [ ] **Step 4: Run checks**

Run:

```bash
pnpm run lint
pnpm run build
```

Expected: both commands exit 0.

- [ ] **Step 5: Commit**

```bash
git add 'src/app/(auth)/(dashboard)/admin-account/reviews' 'src/app/(auth)/(dashboard)/admin-account/components/shell/admin-nav.ts'
git commit -m "feat: add admin reviews page"
```

## Task 8: Analytics Date and Calculation Helpers

**Files:**
- Create: `src/lib/admin/analytics-date.ts`
- Create: `src/lib/admin/analytics-date.test.ts`
- Create: `src/lib/admin/analytics-service.ts`
- Create: `src/lib/admin/analytics-service.test.ts`
- Modify: `src/lib/admin/fetch-admin-orders.ts`
- Modify: `src/lib/admin/fetch-admin-orders.test.ts`
- Modify: `src/types/global.d.ts`

- [ ] **Step 1: Write date helper tests**

Use fixed current date `2026-07-03T12:00:00.000Z`.

Cover presets:

- today,
- yesterday,
- last_7_days,
- month_to_date,
- last_month,
- year_to_date,
- custom.

Also cover previous-period comparison.

- [ ] **Step 2: Write analytics service tests**

Use order fixtures with:

- line items,
- shipping lines,
- payment methods `cod` and `intasend`,
- `_county`,
- `_delivery_type`,
- coupon lines or discount fields,
- pending/failed/completed statuses.

Assert:

- gross product sales,
- total order revenue,
- total delivery fees,
- total discounts,
- cash total,
- M-Pesa total,
- top products,
- products with no sales when product catalog fixture is provided,
- top locations,
- delivery type split,
- discount/coupon summary,
- unpaid/pending rate,
- average order value,
- units sold.

- [ ] **Step 3: Run failing helper tests**

Run:

```bash
pnpm vitest run src/lib/admin/analytics-date.test.ts src/lib/admin/analytics-service.test.ts src/lib/admin/fetch-admin-orders.test.ts
```

Expected: FAIL because helpers do not exist or fetcher lacks date filters.

- [ ] **Step 4: Implement helpers**

Keep helpers pure and independent from React.

Use exported functions:

```ts
resolveAnalyticsDateRange(...)
getComparisonRange(...)
summarizeRevenue(...)
summarizePayments(...)
summarizeProducts(...)
summarizeLocations(...)
summarizeDiscounts(...)
summarizeOrderBehavior(...)
buildAnalyticsOverview(...)
```

- [ ] **Step 5: Extend order fetching**

Update `AdminOrderFilters` to include `after`, `before`, and optional `dateType`.

Ensure `buildOrdersQuery` maps dates to Woo query params already supported by current fetcher tests.

- [ ] **Step 6: Run helper tests**

Run:

```bash
pnpm vitest run src/lib/admin/analytics-date.test.ts src/lib/admin/analytics-service.test.ts src/lib/admin/fetch-admin-orders.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/lib/admin/analytics-date.ts src/lib/admin/analytics-date.test.ts src/lib/admin/analytics-service.ts src/lib/admin/analytics-service.test.ts src/lib/admin/fetch-admin-orders.ts src/lib/admin/fetch-admin-orders.test.ts src/types/global.d.ts
git commit -m "feat: add admin analytics calculations"
```

## Task 9: Analytics API Routes

**Files:**
- Create: `src/app/api/admin/analytics/overview/route.ts`
- Create: `src/app/api/admin/analytics/overview/route.test.ts`
- Create: `src/app/api/admin/analytics/products/route.ts`
- Create: `src/app/api/admin/analytics/products/route.test.ts`
- Create: `src/app/api/admin/analytics/locations/route.ts`
- Create: `src/app/api/admin/analytics/locations/route.test.ts`
- Create: `src/app/api/admin/analytics/payments/route.ts`
- Create: `src/app/api/admin/analytics/payments/route.test.ts`
- Create: `src/app/api/admin/analytics/discounts/route.ts`
- Create: `src/app/api/admin/analytics/discounts/route.test.ts`

- [ ] **Step 1: Write route tests**

For each route:

- rejects unauthenticated users,
- passes date filters to `fetchAdminOrders`,
- returns mapped report JSON,
- returns 500 JSON on upstream failures.

- [ ] **Step 2: Run failing route tests**

Run:

```bash
pnpm vitest run src/app/api/admin/analytics
```

Expected: FAIL because routes do not exist.

- [ ] **Step 3: Implement routes**

Each route should:

- call `requireAdminSession`,
- parse date/search/filter query params,
- call `fetchAdminOrders`,
- call the matching `analytics-service` helper,
- return stable JSON.

- [ ] **Step 4: Run route tests**

Run:

```bash
pnpm vitest run src/app/api/admin/analytics
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/admin/analytics
git commit -m "feat: add admin analytics APIs"
```

## Task 10: Analytics Overview UI

**Files:**
- Create: `src/app/(auth)/(dashboard)/admin-account/analytics/page.tsx`
- Create: `src/app/(auth)/(dashboard)/admin-account/analytics/comp/analytics-page.tsx`
- Create: `src/app/(auth)/(dashboard)/admin-account/analytics/comp/date-range-controls.tsx`
- Create: `src/app/(auth)/(dashboard)/admin-account/analytics/styles.module.scss`
- Modify: `src/app/(auth)/(dashboard)/admin-account/components/shell/admin-nav.ts`
- Modify: `src/app/(auth)/(dashboard)/admin-account/components/dashboard/admin-dashboard.tsx`

- [ ] **Step 1: Add Analytics navigation**

Add a Store or Overview nav item:

```ts
{ label: "Analytics", href: "/admin-account/analytics", icon: BarChart3 }
```

Add title:

```ts
"/admin-account/analytics": "Analytics",
```

- [ ] **Step 2: Build overview page**

The overview should include:

- date range controls,
- KPI cards for total revenue, net/product revenue, delivery fees, discounts, orders, average order value, units sold,
- payment split cards for cash and M-Pesa,
- revenue/orders chart with Recharts,
- leaderboards for top products and top locations,
- insight callouts from analytics service.

- [ ] **Step 3: Link dashboard to analytics**

Add a dashboard action link to `/admin-account/analytics` and avoid duplicating complex analytics logic in the dashboard component.

- [ ] **Step 4: Run UI checks**

Run:

```bash
pnpm run lint
pnpm run build
```

Expected: both commands exit 0.

- [ ] **Step 5: Commit**

```bash
git add 'src/app/(auth)/(dashboard)/admin-account/analytics' 'src/app/(auth)/(dashboard)/admin-account/components/shell/admin-nav.ts' 'src/app/(auth)/(dashboard)/admin-account/components/dashboard/admin-dashboard.tsx'
git commit -m "feat: add admin analytics overview"
```

## Task 11: Product, Location, Payment, and Discount Drilldowns

**Files:**
- Create: `src/app/(auth)/(dashboard)/admin-account/analytics/comp/report-table.tsx`
- Modify: `src/app/(auth)/(dashboard)/admin-account/analytics/comp/analytics-page.tsx`
- Modify: `src/app/(auth)/(dashboard)/admin-account/analytics/styles.module.scss`
- Modify: analytics API route files from Task 9 to accept report-table filters and sorting params.

- [ ] **Step 1: Create reusable report table**

Features:

- column definition array,
- client-side sorting,
- search,
- pagination,
- empty state,
- mobile stacked rows.

- [ ] **Step 2: Add product report**

Columns:

- product,
- quantity sold,
- revenue,
- order count,
- average item value,
- trend or period comparison,
- status label for top seller, slow mover, or no sales.

- [ ] **Step 3: Add location report**

Columns:

- county/city/location,
- order count,
- revenue,
- delivery fees,
- top delivery type,
- share of orders.

- [ ] **Step 4: Add payment report**

Columns/cards:

- payment method,
- paid total,
- order count,
- pending/unpaid count,
- failed count,
- pending rate.

- [ ] **Step 5: Add discount report**

Columns:

- coupon/code,
- orders,
- gross revenue,
- discount amount,
- revenue after discount,
- average discount per order.

- [ ] **Step 6: Run checks**

Run:

```bash
pnpm vitest run src/lib/admin/analytics-service.test.ts src/app/api/admin/analytics
pnpm run lint
pnpm run build
```

Expected: all commands exit 0.

- [ ] **Step 7: Commit**

```bash
git add 'src/app/(auth)/(dashboard)/admin-account/analytics' src/app/api/admin/analytics src/lib/admin/analytics-service.ts src/lib/admin/analytics-service.test.ts
git commit -m "feat: add analytics report drilldowns"
```

## Task 12: CSV Export and Basic Personalization

**Files:**
- Create: `src/app/(auth)/(dashboard)/admin-account/analytics/comp/csv-export.tsx`
- Modify: `src/app/(auth)/(dashboard)/admin-account/analytics/comp/report-table.tsx`
- Modify: `src/app/(auth)/(dashboard)/admin-account/analytics/comp/analytics-page.tsx`
- Create or modify: `src/lib/admin/analytics-csv.ts`
- Create or modify: `src/lib/admin/analytics-csv.test.ts`

- [ ] **Step 1: Write CSV helper tests**

Cover:

- escaping commas and quotes,
- preserving column order,
- exporting product/location/payment/discount rows,
- returning a useful filename containing report type and date range.

- [ ] **Step 2: Run failing CSV tests**

Run:

```bash
pnpm vitest run src/lib/admin/analytics-csv.test.ts
```

Expected: FAIL because helper does not exist.

- [ ] **Step 3: Implement CSV helper**

Expose:

```ts
export function buildCsv(columns, rows): string
export function buildAnalyticsExportFilename(reportType, range): string
```

- [ ] **Step 4: Add export button**

Add an icon button using lucide `Download` to export the currently visible report rows.

- [ ] **Step 5: Add personalization**

Use local storage for:

- selected default report tab,
- visible columns per report,
- last selected date preset.

Keep this client-only and non-blocking. If local storage is unavailable, use defaults.

- [ ] **Step 6: Run final checks**

Run:

```bash
pnpm vitest run src/lib/admin/analytics-csv.test.ts src/lib/admin/analytics-service.test.ts
pnpm run lint
pnpm run build
```

Expected: all commands exit 0.

- [ ] **Step 7: Commit**

```bash
git add 'src/app/(auth)/(dashboard)/admin-account/analytics' src/lib/admin/analytics-csv.ts src/lib/admin/analytics-csv.test.ts
git commit -m "feat: add analytics CSV export"
```

## Final Verification

- [ ] Run all tests:

```bash
pnpm test
```

Expected: all Vitest suites pass.

- [ ] Run lint:

```bash
pnpm run lint
```

Expected: Biome exits 0.

- [ ] Run production build:

```bash
pnpm run build
```

Expected: Prisma generation and Next build exit 0.

- [ ] Manual admin smoke test in local browser:

```bash
pnpm run dev
```

Check:

- admin Team page can create, reset password, block, unblock, demote, and soft-delete eligible admins,
- blocked admins cannot sign in,
- Reviews page loads and filters reviews,
- Analytics page loads overview and drilldowns,
- CSV export downloads expected rows,
- dashboard still loads without heavy analytics regressions.

## Plan Self-Review

- Spec coverage: every item in `## In Scope: Build Plan Now` maps to Tasks 1 through 12.
- Placeholder scan: no task is deferred to an undefined future phase.
- Type consistency: admin status fields are consistently `disabledAt` and `deletedAt`; analytics files consistently use `analytics-date`, `analytics-service`, and `analytics-csv`.
- Risk note: review moderation actions depend on the exact backend review API capabilities. The current plan delivers read/filter/insight UX first and keeps moderation as an extension only after the available WordPress/Woo endpoint behavior is verified during Task 6.
