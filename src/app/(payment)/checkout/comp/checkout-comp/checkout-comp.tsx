"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShoppingCartIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  type SubmitErrorHandler,
  type SubmitHandler,
  useForm,
} from "react-hook-form";
import { toast } from "sonner";
import { useApolloFetcher } from "@/apollo/useApolloFetcher";
import { FormInput } from "@/comp/form/formInput/formInput";
import Section from "@/comp/section/section";
import {
  type CheckoutCoupon,
  calculateCouponDiscount,
  getCheckoutTotal,
} from "@/lib/checkout/coupon";
import {
  useCartStore,
  useCheckoutStore,
  usePendingOrderStore,
} from "@/store/cartStore";
import { getFirstCheckoutErrorMessage } from "@/utils/zod/checkout-schema/checkout-errors";
import {
  type CheckOutSchemaType,
  checkOutSchema,
} from "@/utils/zod/checkout-schema/checkout-schema";
import { buildOrderPayload } from "../../lib/OrderBuilder";
import CartSummarySection from "../cart-summary-section/cart-summary-section";
import CheckoutProgress from "../checkout-progress/checkout-progress";
import DeliveryLocationSelector from "../delivery-location/deliveryLocationSelector";
import DeliveryMethodSelector from "../delivery-method-selector/deliveryMethodSelector ";
import { GET_SHIPPING_ZONES } from "../pickUpPoint/graphql";
import PickUpPoint from "../pickUpPoint/pickUpPoint";
import ShippingSection from "../shipping-section/shippingSection ";
import TermsAndConditionsSection from "../terms-and-conditions-section";
import k from "./styles.module.scss";

interface WooShippingZone {
  name: string;
  shippingMethods: Array<{ cost?: string | null }>;
}

interface ShippingZonesResult {
  shippingZones?: WooShippingZone[];
}

type CheckoutDeliveryQuote = {
  method: "shipping" | "pickup";
  code: string;
  label: string;
  fee: number;
  originalFee?: number;
  eta: string;
  fulfillmentType: string;
  freeDeliveryApplied: boolean;
  freeDeliveryRemaining: number;
  available: boolean;
};

async function fetchIsLoggedIn(): Promise<boolean> {
  try {
    const res = await fetch("/api/session");
    const data = await res.json();
    return Boolean(data?.user?.email);
  } catch {
    return false;
  }
}

export default function CheckOutComp() {
  const router = useRouter();
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeCoupon, setActiveCoupon] = useState<CheckoutCoupon | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<1 | 2 | 3>(1);
  const [deliveryQuote, setDeliveryQuote] =
    useState<CheckoutDeliveryQuote | null>(null);

  const { cartDetails, totalPrice, clearCart, cartCount } = useCartStore();
  const { clearPendingOrder } = usePendingOrderStore();
  const { savedUserInfo, setSavedUserInfo } = useCheckoutStore();

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<CheckOutSchemaType>({
    defaultValues: {
      delivery_method: "shipping",
      useDifferentShipping: false,
      paymentMethod: "pay_online",
      saveInfo: !!savedUserInfo,
      ...(savedUserInfo ?? {}),
    },
    resolver: zodResolver(checkOutSchema),
  });

  useEffect(() => {
    fetch("/api/session")
      .then((res) => res.json())
      .then((data) => {
        const user = data?.user;
        if (!user?.email) return;

        setIsLoggedIn(true);
        setSessionEmail(user.email);
        setValue("email", user.email);

        if (user.name) {
          const [firstName, ...rest] = user.name.trim().split(/\s+/);
          if (firstName) setValue("billing_first_name", firstName);
          if (rest.length) setValue("billing_last_name", rest.join(" "));
        }
      })
      .catch(() => {});
  }, [setValue]);

  const deliveryMethod = watch("delivery_method");
  const selectedCounty = watch("county");
  const deliverySubtype = watch("delivery_subtype");

  const { data, loading, error } = useApolloFetcher(GET_SHIPPING_ZONES) as {
    data?: ShippingZonesResult;
    loading: boolean;
    error?: Error | null;
  };

  const wooShippingZones =
    data?.shippingZones?.map((zone) => ({
      zone: zone.name,
      fee_ksh: Number(zone.shippingMethods[0]?.cost ?? 0) || 0,
    })) || [];

  useEffect(() => {
    let cancelled = false;

    if (deliveryMethod === "shipping" && !selectedCounty) {
      setDeliveryQuote(null);
      return;
    }

    fetch("/api/delivery/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deliveryMethod,
        county: selectedCounty,
        cartSubtotal: totalPrice,
      }),
    })
      .then(async (res) => {
        const quote = await res.json();
        if (!res.ok) throw new Error(quote.message);
        if (!cancelled) setDeliveryQuote(quote);
      })
      .catch(() => {
        if (!cancelled) setDeliveryQuote(null);
      });

    return () => {
      cancelled = true;
    };
  }, [deliveryMethod, selectedCounty, totalPrice]);

  const shippingCost =
    deliveryMethod === "shipping" && deliveryQuote?.available
      ? deliveryQuote.fee
      : 0;
  const selectedZone =
    deliveryMethod === "shipping" && deliveryQuote?.available
      ? deliveryQuote.label
      : undefined;
  const discount = calculateCouponDiscount(activeCoupon, totalPrice);
  const orderTotal = getCheckoutTotal(totalPrice, shippingCost, discount);
  const stepTwoTitle =
    deliveryMethod === "pickup" ? "Choose pickup point" : "Delivery address";
  const stepTwoDescription =
    deliveryMethod === "pickup"
      ? "Choose the most convenient pickup location."
      : "Where should we deliver your order?";

  const goBack = () => {
    setCheckoutStep((step) => (step === 1 ? step : ((step - 1) as 1 | 2 | 3)));
  };

  const goNext = async () => {
    const stepFields: Array<keyof CheckOutSchemaType> =
      checkoutStep === 1
        ? [
            "billing_first_name",
            "billing_last_name",
            "email",
            "billing_phone",
            "delivery_method",
          ]
        : deliveryMethod === "pickup"
          ? ["pickupPoint", "billing_city"]
          : ["county", "billing_city", "billing_address_1"];

    const isStepValid = await trigger(stepFields);
    if (!isStepValid) {
      toast.error(getFirstCheckoutErrorMessage(errors), { duration: 5000 });
      return;
    }

    setCheckoutStep((step) => (step === 3 ? step : ((step + 1) as 1 | 2 | 3)));
  };

  useEffect(() => {
    if (!cartCount) {
      setActiveCoupon(null);
    }
  }, [cartCount]);

  const onSubmit: SubmitHandler<CheckOutSchemaType> = async (formData) => {
    if (!Object.keys(cartDetails).length) {
      toast.error("Cart is empty");
      return;
    }

    if (deliveryMethod === "shipping" && !deliveryQuote?.available) {
      toast.error("Please select a delivery county to calculate delivery.");
      return;
    }

    if (formData.saveInfo) {
      const infoToSave = { ...formData };
      delete infoToSave.saveInfo;
      setSavedUserInfo(infoToSave);
    } else {
      setSavedUserInfo(null);
    }

    const orderPayload = buildOrderPayload({
      data: formData,
      cartDetails,
      totalPrice,
      deliveryMethod,
      shippingCost,
      shippingMethodTitle: selectedZone,
      couponCode: activeCoupon?.code,
    });

    const loggedIn = Boolean(sessionEmail) || (await fetchIsLoggedIn());

    if (!loggedIn) {
      const infoToSave = { ...formData };
      delete infoToSave.saveInfo;
      setSavedUserInfo(infoToSave);
      toast.message("Sign in to continue with M-Pesa payment.");
      router.push(
        `/auth/signin?callbackUrl=${encodeURIComponent("/checkout")}`,
      );
      return;
    }

    try {
      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      const order = await res.json();
      if (!res.ok) throw new Error(order.message);

      const checkoutRes = await fetch("/api/intasend/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          amount: Number(order.total ?? orderPayload.total),
          phone: formData.billing_phone,
        }),
      });

      const checkout = await checkoutRes.json();
      if (!checkoutRes.ok) {
        toast.error(checkout.message || "Could not start M-Pesa payment.");
        toast.warning(
          `Order #${order.id} was created but payment was not started. You can retry on the next screen.`,
          { duration: 8000 },
        );
        router.push(`/payment?orderId=${order.id}`);
        return;
      }

      clearCart();
      clearPendingOrder();
      setActiveCoupon(null);
      toast.success("Check your phone for the M-Pesa payment prompt.");
      router.push(`/payment?orderId=${order.id}`);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to initiate online payment";
      toast.error(message, { duration: 6000 });
    }
  };

  const onInvalidSubmit: SubmitErrorHandler<CheckOutSchemaType> = (
    validationErrors,
  ) => {
    toast.error(getFirstCheckoutErrorMessage(validationErrors), {
      duration: 6000,
    });
  };

  if (cartCount === 0) {
    return (
      <Section className={k.Check_Out}>
        <div className={k.empty_checkout}>
          <div className={k.shopping_icon_wrapper}>
            <ShoppingCartIcon />
            <p>Your cart is empty, so there is nothing to check out yet.</p>
          </div>
          <Link href="/products/all">Return To Shop</Link>
        </div>
      </Section>
    );
  }

  return (
    <Section className={k.Check_Out}>
      <div className={k.storefront_bar}>
        <div className={k.brand_lockup}>
          <span className={k.logo_mark}>JK</span>
          <span>JK Organics</span>
        </div>
        <div className={k.checkout_tabs}>
          <button className={k.active_tab} type="button">
            Checkout
          </button>
          <button type="button" onClick={() => router.push("/account/orders")}>
            Track order
          </button>
        </div>
        <span className={k.secure_note}>Secure checkout</span>
      </div>

      <form onSubmit={handleSubmit(onSubmit, onInvalidSubmit)}>
        <div className={k.Check_out_form_left}>
          <CheckoutProgress
            currentStep={checkoutStep}
            stepTwoTitle={stepTwoTitle}
          />

          {checkoutStep === 1 ? (
            <section className={k.handoff_card}>
              <div className={k.step_intro}>
                <h2>Contact &amp; delivery</h2>
                <p>We'll use these to send order &amp; delivery updates.</p>
              </div>

              <div className={k.field_grid}>
                <FormInput
                  type="text"
                  name="billing_first_name"
                  register={register}
                  errors={errors}
                  placeholder="First name *"
                />
                <FormInput
                  type="text"
                  name="billing_last_name"
                  register={register}
                  errors={errors}
                  placeholder="Last name *"
                />
              </div>

              <div className={k.field_grid}>
                <FormInput
                  type="email"
                  name="email"
                  register={register}
                  errors={errors}
                  placeholder="amina@gmail.com"
                />
                <FormInput
                  type="tel"
                  name="billing_phone"
                  register={register}
                  errors={errors}
                  placeholder="0712 345 678"
                />
              </div>

              <div>
                <span className={k.group_label}>Delivery method</span>
                <DeliveryMethodSelector register={register} />
              </div>

              <label className={k.updates_opt_in}>
                <input type="checkbox" defaultChecked />
                Send me SMS &amp; email updates about this order (recommended)
              </label>
            </section>
          ) : null}

          {checkoutStep === 2 ? (
            <section className={k.handoff_card}>
              <div className={k.step_intro}>
                <h2>{stepTwoTitle}</h2>
                <p>{stepTwoDescription}</p>
              </div>

              {deliveryMethod === "shipping" ? (
                <DeliveryLocationSelector
                  register={register}
                  errors={errors}
                  setValue={setValue}
                  watch={watch}
                  shippingZones={wooShippingZones}
                  deliveryQuote={deliveryQuote}
                />
              ) : (
                <PickUpPoint
                  register={register}
                  setValue={setValue}
                  loading={loading}
                  error={error}
                  watch={watch}
                />
              )}

              <div className={k.field_grid}>
                {deliveryMethod === "shipping" ? (
                  <FormInput
                    type="text"
                    name="billing_address_1"
                    register={register}
                    errors={errors}
                    placeholder="Street, building, house/apartment no."
                  />
                ) : null}
                <FormInput
                  type="text"
                  name="billing_city"
                  register={register}
                  errors={errors}
                  placeholder={
                    deliveryMethod === "pickup"
                      ? "Your town / city *"
                      : "Area / estate *"
                  }
                />
              </div>

              {deliveryMethod === "shipping" &&
              deliverySubtype === "door_to_door" ? (
                <ShippingSection
                  watch={watch}
                  setValue={setValue}
                  register={register}
                  errors={errors}
                />
              ) : null}
            </section>
          ) : null}

          {checkoutStep === 3 ? (
            <section className={k.handoff_card}>
              <div className={k.step_intro}>
                <h2>Payment &amp; review</h2>
                <p>Almost done - confirm your details below.</p>
              </div>

              <TermsAndConditionsSection
                register={register}
                control={control}
                errors={errors}
                watch={watch}
                orderTotal={orderTotal}
                isLoggedIn={isLoggedIn}
              />
            </section>
          ) : null}

          <div className={k.step_actions}>
            <button
              type="button"
              className={k.back_button}
              onClick={goBack}
              disabled={checkoutStep === 1}
            >
              {checkoutStep === 1 ? "" : "Back"}
            </button>
            {checkoutStep === 3 ? (
              <button
                type="submit"
                className={k.next_button}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Sending prompt..." : "Send M-Pesa prompt"}
              </button>
            ) : (
              <button type="button" className={k.next_button} onClick={goNext}>
                Continue
              </button>
            )}
          </div>
        </div>

        <div className={k.Check_out_form_right}>
          <CartSummarySection
            cartDetails={cartDetails}
            deliveryMethod={deliveryMethod}
            shippingCost={shippingCost}
            deliveryQuote={deliveryQuote}
            isSubmitting={isSubmitting}
            itemsTotal={totalPrice}
            discount={discount}
            grandTotal={orderTotal}
            activeCoupon={activeCoupon}
            onCouponApplied={setActiveCoupon}
            onCouponRemoved={() => setActiveCoupon(null)}
            showSubmit={false}
          />
        </div>
      </form>
    </Section>
  );
}
