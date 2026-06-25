"use client";
import k from "./styles.module.scss";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import Section from "@/comp/section/section";
import {
  useCartStore,
  useCheckoutStore,
  usePendingOrderStore,
} from "@/store/cartStore";
import { useApolloFetcher } from "@/apollo/useApolloFetcher";
import DeliveryMethodSelector from "../delivery-method-selector/deliveryMethodSelector ";
import BillingSection from "../billingSection ";
import ShippingSection from "../shipping-section/shippingSection ";
import TermsAndConditionsSection from "../terms-and-conditions-section";
import CartSummarySection from "../cart-summary-section/cart-summary-section";
import { GET_SHIPPING_ZONES } from "../pickUpPoint/graphql";
import { buildOrderPayload } from "../../lib/OrderBuilder";
import { buildShippingZoneOptions, COLLECT_AT_SHOP_ZONE } from "../../lib/shipping-zones";
import { getOrderRedirectPath } from "@/lib/checkout/get-order-redirect";
import {
  calculateCouponDiscount,
  getCheckoutTotal,
  type CheckoutCoupon,
} from "@/lib/checkout/coupon";
import {
  checkOutSchema,
  type CheckOutSchemaType,
} from "@/utils/zod/checkout-schema/checkout-schema";

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

  const { cartDetails, totalPrice, clearCart, cartCount } = useCartStore();
  const { clearPendingOrder } = usePendingOrderStore();

  const { savedUserInfo, setSavedUserInfo } = useCheckoutStore();

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CheckOutSchemaType>({
    defaultValues: {
      delivery_method: "shipping",
      useDifferentShipping: false,
      paymentMethod: "pay_online",
      saveInfo: savedUserInfo ? true : false,
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
  const selectedZone = watch("shippingZone");
  const isCollectAtShop =
    deliveryMethod === "shipping" && selectedZone === COLLECT_AT_SHOP_ZONE;

  const { data, loading, error }: any = useApolloFetcher(GET_SHIPPING_ZONES);

  const deliveryZones =
    data?.shippingZones?.map((zone: any) => ({
      zone: zone.name,
      fee_ksh:
        Number(zone.shippingMethods[0]?.cost.replace(/[^0-9]/g, "")) || 0,
    })) || [];

  const shippingZonesWithCollect = buildShippingZoneOptions(deliveryZones);

  const shippingCost =
    deliveryMethod === "shipping" && selectedZone
      ? shippingZonesWithCollect.find((z: any) => z.zone === selectedZone)
          ?.fee_ksh || 0
      : 0;

  const deliveryFee = deliveryMethod === "shipping" ? shippingCost : 0;
  const discount = calculateCouponDiscount(activeCoupon, totalPrice);
  const orderTotal = getCheckoutTotal(totalPrice, deliveryFee, discount);

  useEffect(() => {
    if (!cartCount) {
      setActiveCoupon(null);
    }
  }, [cartCount]);

  const onSubmit: SubmitHandler<CheckOutSchemaType> = async (formData: any) => {
    if (!Object.keys(cartDetails).length) {
      toast.error("Cart is empty");
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

    const payMethod = formData.paymentMethod;

    if (payMethod === "pay_on_delivery") {
      try {
        const isLoggedIn = Boolean(sessionEmail) || (await fetchIsLoggedIn());

        const res = await fetch("/api/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orderPayload),
        });

        const order = await res.json();
        if (!res.ok) throw new Error(order.message);

        toast.success("Order placed successfully!");
        clearCart();
        clearPendingOrder();
        setActiveCoupon(null);

        router.push(getOrderRedirectPath(order.id, isLoggedIn));
        return;
      } catch {
        toast.error("Failed to place order");
        return;
      }
    }

    if (payMethod === "pay_online") {
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
        return;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to initiate online payment";
        toast.error(message, { duration: 6000 });
        return;
      }
    }
  };

  if (cartCount === 0) return null;

  return (
    <Section className={k.Check_Out}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className={k.Check_out_form_left}>
          <h3>Checkout</h3>

          <DeliveryMethodSelector register={register} />

          <BillingSection
            register={register}
            errors={errors}
            deliveryMethod={deliveryMethod}
            shippingZones={shippingZonesWithCollect}
            setValue={setValue}
            loading={loading}
            error={error}
            watch={watch}
          />

          {deliveryMethod === "shipping" && !isCollectAtShop && (
            <ShippingSection
              watch={watch}
              setValue={setValue}
              register={register}
              errors={errors}
            />
          )}

          <TermsAndConditionsSection
            register={register}
            control={control}
            errors={errors}
            watch={watch}
            orderTotal={orderTotal}
            isLoggedIn={isLoggedIn}
          />
        </div>

        <div className={k.Check_out_form_right}>
          <CartSummarySection
            cartDetails={cartDetails}
            deliveryMethod={deliveryMethod}
            shippingCost={shippingCost}
            isSubmitting={isSubmitting}
            itemsTotal={totalPrice}
            discount={discount}
            grandTotal={orderTotal}
            activeCoupon={activeCoupon}
            onCouponApplied={setActiveCoupon}
            onCouponRemoved={() => setActiveCoupon(null)}
          />
        </div>
      </form>
    </Section>
  );
}
