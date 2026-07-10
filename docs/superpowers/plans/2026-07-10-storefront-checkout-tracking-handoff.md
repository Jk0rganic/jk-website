# Storefront Checkout Tracking Handoff Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enforce the attached handoff UI/UX on the ecommerce checkout and customer/public order tracking surfaces without changing admin behavior.

**Architecture:** Keep existing checkout/order/payment business logic. Re-skin and restructure storefront components to match `Checkout Redesign.dc.html`: a 3-step checkout flow, sticky order summary, and customer tracking timeline. Customer tracking is implemented behind `variant !== "admin"` so the shared order component preserves admin output.

**Tech Stack:** Next.js 16, React 19, TypeScript, SCSS modules, react-hook-form, Vitest, Testing Library.

---

## File Boundaries

Do not modify files under:

- `src/app/(auth)/(dashboard)/admin-account`
- `src/app/api/admin`
- `src/lib/admin`

Allowed files:

- `src/app/(payment)/checkout/comp/checkout-comp/checkout-comp.tsx`
- `src/app/(payment)/checkout/comp/checkout-comp/styles.module.scss`
- `src/app/(payment)/checkout/comp/cart-summary-section/cart-summary-section.tsx`
- `src/app/(payment)/checkout/comp/cart-summary-section/styles.module.scss`
- `src/app/(payment)/checkout/comp/delivery-method-selector/deliveryMethodSelector .tsx`
- `src/app/(payment)/checkout/comp/delivery-method-selector/styles.module.scss`
- `src/app/(payment)/checkout/comp/paymentOption/paymentOption.tsx`
- `src/app/(payment)/checkout/comp/paymentOption/styles.module.scss`
- `src/app/(payment)/checkout/comp/checkout-progress/*`
- `src/app/(payment)/payment/comp/intasend-payment.tsx`
- `src/app/(payment)/payment/comp/styles.module.scss`
- `src/app/(auth)/(dashboard)/(resources)/dashboard-comp/(pages-comp)/orders/comp/single-order-acc/page.tsx`
- `src/app/(auth)/(dashboard)/(resources)/dashboard-comp/(pages-comp)/orders/comp/single-order-acc/styles.module.scss`
- New focused tests beside changed storefront components.

## Task 1: Checkout Handoff Shell

- [ ] Write failing tests that expect the handoff labels: `Step 1 of 3`, `Contact & delivery`, `Delivery address`, `Payment & review`, `No hidden fees`.
- [ ] Implement a local `checkoutStep` state in `CheckOutComp` with Continue/Back controls.
- [ ] Preserve final form submit only on step 3.
- [ ] Render header, progress bar, step chips, step card, and sticky summary using the handoff visual system.

## Task 2: Summary And Choice Cards

- [ ] Update delivery cards to match handoff copy: `Home delivery`, `Pickup point`.
- [ ] Update payment cards to match handoff copy: `M-Pesa`, `Cash on delivery`.
- [ ] Update order summary to handoff dimensions, coupon row, product rows, and exact trust copy.
- [ ] Keep registered values unchanged: `shipping`, `pickup`, `pay_online`, `pay_on_delivery`.

## Task 3: Customer Tracking Timeline

- [ ] Write a failing test for customer order tracking output that confirms the customer view shows `Order #`, timeline stages, and `Updates sent to you`.
- [ ] Implement customer-only tracking layout in `SingleOrderAccount` when `variant !== "admin"`.
- [ ] Preserve existing admin branch behavior by keeping admin-specific fulfillment/payment sections untouched.
- [ ] Map Woo statuses to stages:
  - placed: pending/on-hold
  - processing: processing
  - out-for-delivery: completed fallback remains completed/delivered
  - cancelled/refunded: exception banners

## Task 4: Payment Status Page Skin

- [ ] Re-skin payment waiting/retry page to use the same surface, border, accent, and action button language as the handoff.
- [ ] Preserve polling/retry/status logic.

## Verification

- [ ] Run focused checkout/payment/order tracking tests.
- [ ] Run scoped Biome on storefront files touched.
- [ ] Run `curl -I http://localhost:3000/checkout`.
- [ ] Run TypeScript and document unrelated existing admin/analytics failures if they remain.

## Self-Review

- The plan covers checkout, summary, tracking, and payment status.
- Admin write boundaries are explicit.
- No placeholders remain.
