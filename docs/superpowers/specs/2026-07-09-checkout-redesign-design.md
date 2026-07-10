# Checkout Redesign Design

## Goal

Redesign the checkout into a modern, conversion-focused buying flow while keeping the existing order creation, coupon, delivery fee, saved checkout data, M-Pesa, and pay-on-delivery behavior intact.

## Research Basis

The redesign follows current ecommerce checkout guidance from Baymard, Shopify, and Nielsen Norman Group:

- Keep checkout effort low. Baymard's 2024 checkout benchmark reports an average checkout of 5.1 steps and 11.3 fields, while noting most sites can reduce perceived effort by removing or hiding nonessential fields.
- Make guest checkout and low-friction payment obvious. Shopify's checkout guidance emphasizes mobile-first, wallet/payment speed, guest-friendly flow, and visible trust cues.
- Prefer direct delivery clarity over vague speed labels. Baymard recommends specific delivery expectations and clear fulfillment choices.
- Reduce mobile typing and make cart edits/review easy. NN/g highlights mobile checkout success factors: fewer fields, easy review, and convenient payment.

Sources used during research:

- https://baymard.com/blog/current-state-of-checkout-ux
- https://baymard.com/blog/checkout-flow-average-form-fields
- https://www.shopify.com/enterprise/blog/one-page-checkout
- https://www.shopify.com/enterprise/blog/faster-checkout-process
- https://www.nngroup.com/articles/mobile-checkout-ux/
- https://www.nngroup.com/articles/ecommerce-expectations/

## Current State

The current checkout is a single form in `CheckOutComp` with a left column for delivery, billing, shipping, payment, notes, and terms, plus a right order summary. The business behavior is useful and should be preserved:

- `react-hook-form` and `checkOutSchema` validate checkout fields.
- Delivery method defaults to shipping.
- Payment defaults to M-Pesa online.
- Delivery fee is calculated from Woo shipping zones and Kenya delivery subtype.
- Coupons are applied via `/api/checkout/coupon`.
- Pay on delivery creates the order directly.
- M-Pesa requires sign-in, creates the order, then starts `/api/intasend/checkout`.
- Saved checkout details are persisted in `useCheckoutStore`.

The problem is mainly presentation and information architecture. The checkout reads as a long form stack, the CTA is buried inside the summary, and decisions that affect confidence, such as delivery method, delivery fee, M-Pesa sign-in, and item review, are not visually prioritized.

## Approved Approach

Use a full checkout architecture refactor.

This means the form state and submit logic remain centralized, but the UI is split into purpose-built checkout blocks with clear contracts. The result should feel like a guided one-page checkout, not a generic form page.

## UX Design

### Page Layout

Desktop layout:

- Header band with title, short reassurance copy, and a compact trust row.
- Left column for the guided checkout flow.
- Right column for a sticky order summary.
- Two-column grid should use a wider form column and a compact summary column.

Mobile layout:

- One-column flow.
- Order summary appears near the top as a compact review card and CTA remains easy to reach.
- Sticky desktop behavior must not create mobile overlap.

### Checkout Flow

The left column should be organized as numbered or visually progressive cards:

1. Delivery
2. Contact and delivery details
3. Payment
4. Review and place order

The progress indicator is informational, not a multi-page wizard. Users can still complete the checkout on one page.

### Delivery Section

Delivery method should use large selectable cards:

- Ship to my address
- Pick up from store

Each card should show a clear icon, short supporting text, and a selected state. Shipping should mention Kenya delivery. Pickup should mention store collection.

When the user selects a county, show delivery fee and zone feedback near the delivery fields. Keep existing zone calculation logic.

### Contact And Address

The contact/customer section should feel like customer details, not accounting paperwork.

Required high-priority fields:

- Email
- Phone
- First name
- Last name
- County

Shipping-only fields should stay conditional. Door-to-door address fields should only appear when the selected subtype needs them. Optional order notes should be collapsed behind a small disclosure so they do not add visual load.

### Payment Section

Payment should use selectable cards:

- M-Pesa now
- Pay on delivery

M-Pesa selected state should show:

- Phone number being used, if entered.
- Amount to pay.
- A sign-in notice when the customer is not logged in.

Pay on delivery selected state should show a short reassurance that the order is placed immediately and payment is collected later.

### Order Summary

The summary should be a sticky review panel on desktop and a clean stacked card on mobile.

It should include:

- Product thumbnail, title, quantity, and line total for each cart item.
- Items subtotal.
- Coupon input and applied coupon row.
- Delivery row when shipping is selected.
- Final total as the dominant number.
- Trust microcopy near the CTA.
- Submit button text based on payment method:
  - `Send M-Pesa prompt` for `pay_online`.
  - `Place order` for `pay_on_delivery`.

The terms checkbox should remain required and visible before submit. It can either stay as the final left-column card or be placed directly above the summary CTA, as long as validation and error display remain clear.

## Component Architecture

Keep `CheckOutComp` responsible for:

- Form setup.
- Session prefill.
- Cart/coupon/delivery totals.
- Submit behavior.
- Passing a small checkout view model to child components.

Create or reshape presentation components:

- `checkout-layout`: page shell, header, trust row, two-column grid.
- `checkout-step-card`: reusable card wrapper for flow sections.
- `checkout-progress`: compact Cart -> Delivery -> Details -> Payment indicator.
- `delivery-method-selector`: card-based radio group.
- `payment-option`: card-based radio group with selected-detail panels.
- `cart-summary-section`: sticky review panel with product thumbnails and payment-aware CTA.
- `checkout-disclosure`: lightweight optional notes disclosure if needed.

Do not rewrite schema or order APIs unless the existing contracts force a small adapter.

## Data Flow

`CheckOutComp` derives:

- `deliveryMethod`
- `selectedCounty`
- `deliverySubtype`
- `shippingCost`
- `selectedZone`
- `discount`
- `orderTotal`
- `paymentMethod`
- `billingPhone`
- `cartDetails`

These derived values flow into presentational components. Presentational components should not create orders or mutate cart state, except the summary may keep local coupon input state and call the existing coupon callbacks.

## Error Handling

Keep existing validation behavior:

- `onInvalidSubmit` shows the first checkout schema error as a toast.
- Field-level errors continue to render in relevant sections.
- Coupon failures continue to toast and clear invalid active coupon state.
- M-Pesa order-created-but-payment-failed path continues to redirect to `/payment?orderId=...`.

Improve UX error placement where possible:

- Payment error appears inside the payment card.
- Terms error appears near the terms checkbox.
- Delivery zone loading/error remains near delivery fields.

## Testing

Add focused component tests around the redesigned checkout behavior:

- Delivery selector renders card radios and preserves `delivery_method` values.
- Payment option changes CTA context and shows M-Pesa sign-in guidance for guests.
- Cart summary renders thumbnails, subtotal, delivery, discounts, total, and payment-aware CTA text.
- Checkout container still renders the same core sections with the same form submit wiring.

Run existing checkout lib tests to confirm business logic remains unchanged.

## Out Of Scope

- No new payment providers.
- No backend order schema changes.
- No new cart editing behavior beyond rendering item review clearly.
- No multi-page checkout.
- No guest M-Pesa behavior change; sign-in remains required for online payment.
