import { useWatch } from "react-hook-form";
import PaymentDetails from "@/comp/payment-details/payment-details";
import type { CheckoutFormProps } from "@/utils/zod/checkout-schema/checkout-form-props";
import type { CheckOutSchemaType } from "@/utils/zod/checkout-schema/checkout-schema";
import k from "./styles.module.scss";

type PaymentOptionProps = Pick<
  CheckoutFormProps,
  "register" | "control" | "errors" | "watch"
> & {
  orderTotal: number;
};

export default function PaymentOption({
  register,
  control,
  errors,
  watch,
  orderTotal,
}: PaymentOptionProps) {
  const paymentMethod = watch("paymentMethod");
  const billingPhone = useWatch({
    control,
    name: "billing_phone",
    defaultValue: "" as CheckOutSchemaType["billing_phone"],
  });

  return (
    <div className={k.payment_option}>
      <h5>Payment Method</h5>

      <label className={k.checkbox}>
        <input
          type="radio"
          value="pay_online"
          {...register("paymentMethod")}
        />
        Pay online (M-Pesa, card, bank)
      </label>

      {paymentMethod === "pay_online" && (
        <div className={k.online_box}>
          <PaymentDetails
            phone={billingPhone}
            amount={orderTotal}
            className={k.payment_details_card}
          />
          <p className={k.notice}>
            You will be redirected to a secure IntaSend checkout to pay with
            M-Pesa, card, or bank transfer.
          </p>
          {!billingPhone?.trim() && (
            <p className={k.helper}>
              Enter your phone number in the billing section above.
            </p>
          )}
        </div>
      )}

      <label className={k.checkbox}>
        <input
          type="radio"
          value="pay_on_delivery"
          {...register("paymentMethod")}
        />
        Pay on Delivery
      </label>

      {errors.paymentMethod?.message && (
        <p className={k.error}>{errors.paymentMethod.message}</p>
      )}
    </div>
  );
}
