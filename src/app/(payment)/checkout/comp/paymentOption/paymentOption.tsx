import { Smartphone } from "lucide-react";
import { useWatch } from "react-hook-form";
import PaymentDetails from "@/comp/payment-details/payment-details";
import type { CheckoutFormProps } from "@/utils/zod/checkout-schema/checkout-form-props";
import k from "./styles.module.scss";

type PaymentOptionProps = Pick<
  CheckoutFormProps,
  "register" | "control" | "errors" | "watch"
> & {
  orderTotal: number;
  isLoggedIn?: boolean;
};

export default function PaymentOption({
  register,
  control,
  errors,
  watch,
  orderTotal,
  isLoggedIn = false,
}: PaymentOptionProps) {
  const paymentMethod = watch("paymentMethod");
  const watchedBillingPhone = useWatch({
    control,
    name: "billing_phone",
  });
  const billingPhone = watchedBillingPhone ?? watch("billing_phone");

  return (
    <div className={k.payment_option}>
      <div className={k.choice_grid}>
        <label className={k.choice_card}>
          <input
            type="radio"
            value="pay_online"
            {...register("paymentMethod")}
          />
          <span className={k.icon}>
            <Smartphone size={20} />
          </span>
          <span className={k.copy}>
            <span className={k.title}>M-Pesa</span>
            <span className={k.description}>
              Pay by STK push before we prepare your order.
            </span>
          </span>
        </label>

        {paymentMethod === "pay_online" && (
          <div className={k.detail_box}>
            <PaymentDetails
              phone={billingPhone}
              amount={orderTotal}
              className={k.payment_details_card}
            />
            <p className={k.notice}>
              You'll receive an M-Pesa STK push to your billing phone to
              complete payment. Payment is required before your order is made.
            </p>
            {!isLoggedIn && (
              <p className={k.helper}>
                Sign in is required for M-Pesa payment. You will be asked to
                sign in when you confirm your order.
              </p>
            )}
            {!billingPhone?.trim() && (
              <p className={k.helper}>
                Enter your phone number in the billing section above.
              </p>
            )}
          </div>
        )}
      </div>

      {errors.paymentMethod?.message && (
        <p className={k.error}>{errors.paymentMethod.message}</p>
      )}
    </div>
  );
}
