# Checkout Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild checkout as a guided, modern one-page ecommerce flow with clear delivery, payment, product review, and payment-aware submit behavior.

**Architecture:** Keep `CheckOutComp` as the state and submit orchestrator. Split UX into focused presentational sections: layout shell, step cards/progress, card-based delivery/payment controls, and sticky summary with product thumbnails.

**Tech Stack:** Next.js 16, React 19, TypeScript, SCSS modules, `react-hook-form`, Vitest, Testing Library.

---

## File Map

- Create `src/app/(payment)/checkout/comp/checkout-step-card/checkout-step-card.tsx`: reusable card wrapper for numbered checkout sections.
- Create `src/app/(payment)/checkout/comp/checkout-step-card/styles.module.scss`: step card styling.
- Create `src/app/(payment)/checkout/comp/checkout-progress/checkout-progress.tsx`: compact progress/trust strip.
- Create `src/app/(payment)/checkout/comp/checkout-progress/styles.module.scss`: progress styling.
- Modify `src/app/(payment)/checkout/comp/checkout-comp/checkout-comp.tsx`: wire new layout, derive `paymentMethod`, pass CTA context to summary.
- Modify `src/app/(payment)/checkout/comp/checkout-comp/styles.module.scss`: page shell and responsive grid.
- Modify `src/app/(payment)/checkout/comp/delivery-method-selector/deliveryMethodSelector .tsx`: convert radio rows into selectable cards.
- Modify `src/app/(payment)/checkout/comp/delivery-method-selector/styles.module.scss`: delivery card styles.
- Modify `src/app/(payment)/checkout/comp/paymentOption/paymentOption.tsx`: convert payment radios into selectable cards and expose method-specific detail panels.
- Modify `src/app/(payment)/checkout/comp/paymentOption/styles.module.scss`: payment card styles.
- Modify `src/app/(payment)/checkout/comp/cart-summary-section/cart-summary-section.tsx`: add item thumbnails, payment-aware CTA text, trust copy.
- Modify `src/app/(payment)/checkout/comp/cart-summary-section/styles.module.scss`: sticky summary, item rows, totals, coupon, CTA.
- Modify `src/app/(payment)/checkout/comp/AdditionInformation.tsx`: render optional notes as a collapsed disclosure.
- Add focused component tests next to changed components where practical.

## Task 1: Layout Shell And Step Cards

**Files:**
- Create: `src/app/(payment)/checkout/comp/checkout-step-card/checkout-step-card.tsx`
- Create: `src/app/(payment)/checkout/comp/checkout-step-card/styles.module.scss`
- Create: `src/app/(payment)/checkout/comp/checkout-progress/checkout-progress.tsx`
- Create: `src/app/(payment)/checkout/comp/checkout-progress/styles.module.scss`
- Modify: `src/app/(payment)/checkout/comp/checkout-comp/checkout-comp.tsx`
- Modify: `src/app/(payment)/checkout/comp/checkout-comp/styles.module.scss`

- [ ] **Step 1: Write failing layout tests**

Create `src/app/(payment)/checkout/comp/checkout-progress/checkout-progress.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import CheckoutProgress from "./checkout-progress";

describe("CheckoutProgress", () => {
  it("shows the one-page checkout milestones and trust cues", () => {
    render(<CheckoutProgress />);

    expect(screen.getByText("Cart")).toBeInTheDocument();
    expect(screen.getByText("Delivery")).toBeInTheDocument();
    expect(screen.getByText("Details")).toBeInTheDocument();
    expect(screen.getByText("Payment")).toBeInTheDocument();
    expect(screen.getByText(/secure checkout/i)).toBeInTheDocument();
    expect(screen.getByText(/m-pesa supported/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Verify red**

Run: `pnpm exec vitest run src/app/(payment)/checkout/comp/checkout-progress/checkout-progress.test.tsx`

Expected: FAIL because `checkout-progress` does not exist.

- [ ] **Step 3: Implement layout primitives**

Create `CheckoutStepCard` with props:

```tsx
type CheckoutStepCardProps = {
  step: string;
  title: string;
  description?: string;
  children: React.ReactNode;
};
```

Create `CheckoutProgress` that renders milestones `Cart`, `Delivery`, `Details`, `Payment` and trust cues `Secure checkout`, `M-Pesa supported`, `Delivery across Kenya`.

Update `CheckOutComp` so the form contains:

- Header with `Checkout` and reassurance copy.
- `<CheckoutProgress />`.
- Left flow cards wrapping delivery, contact/delivery details, payment/notes/terms.
- Right summary panel.

- [ ] **Step 4: Verify green**

Run: `pnpm exec vitest run src/app/(payment)/checkout/comp/checkout-progress/checkout-progress.test.tsx`

Expected: PASS.

## Task 2: Delivery And Payment Choice Cards

**Files:**
- Modify: `src/app/(payment)/checkout/comp/delivery-method-selector/deliveryMethodSelector .tsx`
- Modify: `src/app/(payment)/checkout/comp/delivery-method-selector/styles.module.scss`
- Modify: `src/app/(payment)/checkout/comp/paymentOption/paymentOption.tsx`
- Modify: `src/app/(payment)/checkout/comp/paymentOption/styles.module.scss`

- [ ] **Step 1: Write failing selector tests**

Create `src/app/(payment)/checkout/comp/delivery-method-selector/deliveryMethodSelector.test.tsx` and `src/app/(payment)/checkout/comp/paymentOption/paymentOption.test.tsx`.

Delivery test should render the component with `useForm<CheckOutSchemaType>()`, assert labels `Ship to my address` and `Pick up from store`, and assert radio values `shipping` and `pickup`.

Payment test should render with default `paymentMethod: "pay_online"`, assert `M-Pesa now`, `Pay on delivery`, `Send prompt to`, amount text from `PaymentDetails`, and guest sign-in guidance.

- [ ] **Step 2: Verify red**

Run both tests. Expected: FAIL because the new labels/card details do not exist.

- [ ] **Step 3: Implement card controls**

Delivery cards:

- Keep radio inputs registered to `delivery_method`.
- Use labels `Ship to my address` and `Pick up from store`.
- Include short supporting copy.
- Use `Truck` and `CalendarCheck` icons.

Payment cards:

- Keep radio inputs registered to `paymentMethod`.
- Use labels `M-Pesa now` and `Pay on delivery`.
- Show `PaymentDetails` only for selected M-Pesa.
- Show guest sign-in helper only when `!isLoggedIn`.
- Show pay-on-delivery reassurance only when selected.

- [ ] **Step 4: Verify green**

Run both selector tests. Expected: PASS.

## Task 3: Sticky Summary With Product Images And Payment-Aware CTA

**Files:**
- Modify: `src/app/(payment)/checkout/comp/cart-summary-section/cart-summary-section.tsx`
- Modify: `src/app/(payment)/checkout/comp/cart-summary-section/styles.module.scss`
- Modify: `src/app/(payment)/checkout/comp/checkout-comp/checkout-comp.tsx`

- [ ] **Step 1: Write failing summary test**

Create `src/app/(payment)/checkout/comp/cart-summary-section/cart-summary-section.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import CartSummarySection from "./cart-summary-section";

const cartDetails = [
  {
    id: "1",
    name: "Raw Shea Butter",
    price: 850,
    quantity: 2,
    image: {
      mediaItemUrl: "https://example.com/shea.jpg",
      title: "Raw Shea Butter jar",
    },
  },
];

describe("CartSummarySection", () => {
  it("renders product thumbnails, totals, and M-Pesa CTA", () => {
    render(
      <form>
        <CartSummarySection
          cartDetails={cartDetails}
          deliveryMethod="shipping"
          shippingCost={250}
          isSubmitting={false}
          itemsTotal={1700}
          discount={100}
          grandTotal={1850}
          activeCoupon={{ code: "SAVE", type: "fixed", amount: 100 }}
          onCouponApplied={() => undefined}
          onCouponRemoved={() => undefined}
          paymentMethod="pay_online"
        />
      </form>,
    );

    expect(screen.getByText("Raw Shea Butter")).toBeInTheDocument();
    expect(screen.getByAltText("Raw Shea Butter jar")).toBeInTheDocument();
    expect(screen.getByText("Qty 2")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send m-pesa prompt/i })).toBeInTheDocument();
    expect(screen.getByText(/secure payment/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Verify red**

Run: `pnpm exec vitest run src/app/(payment)/checkout/comp/cart-summary-section/cart-summary-section.test.tsx`

Expected: FAIL because `paymentMethod` prop and item thumbnail UI do not exist.

- [ ] **Step 3: Implement summary redesign**

Add optional prop:

```ts
paymentMethod?: CheckOutSchemaType["paymentMethod"];
```

Render cart items above totals. Use existing cart image shape:

- `item.image?.mediaItemUrl` for image URL.
- `item.image?.title || item.name` for alt text.

CTA text:

- `Send M-Pesa prompt` when `paymentMethod === "pay_online"`.
- `Place order` when `paymentMethod === "pay_on_delivery"`.
- Preserve submitting text.

Update `CheckOutComp` to derive `const paymentMethod = watch("paymentMethod")` and pass it into `CartSummarySection`.

- [ ] **Step 4: Verify green**

Run summary test. Expected: PASS.

## Task 4: Optional Notes Disclosure And Final Verification

**Files:**
- Modify: `src/app/(payment)/checkout/comp/AdditionInformation.tsx`
- Modify: `src/app/(payment)/checkout/comp/styles.module.scss` if existing field styles need support.
- Test: focused checkout component tests from Tasks 1-3.

- [ ] **Step 1: Write failing disclosure test**

Create `src/app/(payment)/checkout/comp/AdditionInformation.test.tsx` that renders the component with `useForm<CheckOutSchemaType>()`, asserts `Add order note` is visible, and asserts the notes textarea is hidden until the disclosure is opened.

- [ ] **Step 2: Verify red**

Run: `pnpm exec vitest run src/app/(payment)/checkout/comp/AdditionInformation.test.tsx`

Expected: FAIL because notes are currently always visible.

- [ ] **Step 3: Implement disclosure**

Wrap the existing notes input in `<details>` with summary text `Add order note`. Keep the same registered field name and error rendering.

- [ ] **Step 4: Run focused verification**

Run:

```bash
pnpm exec vitest run \
  src/app/(payment)/checkout/comp/checkout-progress/checkout-progress.test.tsx \
  src/app/(payment)/checkout/comp/delivery-method-selector/deliveryMethodSelector.test.tsx \
  src/app/(payment)/checkout/comp/paymentOption/paymentOption.test.tsx \
  src/app/(payment)/checkout/comp/cart-summary-section/cart-summary-section.test.tsx \
  src/app/(payment)/checkout/comp/AdditionInformation.test.tsx \
  src/app/(payment)/checkout/lib/OrderBuilder.test.ts \
  src/app/(payment)/checkout/lib/delivery-zones.test.ts
```

Expected: PASS.

- [ ] **Step 5: Run style/type checks where scoped**

Run:

```bash
pnpm exec biome check src/app/\(payment\)/checkout/comp src/app/\(payment\)/checkout/lib
```

Expected: PASS or only unrelated pre-existing repo-wide issues should be documented.

## Self-Review

- Spec coverage: layout, delivery cards, payment cards, sticky summary, thumbnails, CTA copy, optional notes, and tests are covered.
- Placeholder scan: no placeholder tasks.
- Type consistency: new `paymentMethod` summary prop uses existing `CheckOutSchemaType["paymentMethod"]`; cart image shape follows existing cart table usage.
