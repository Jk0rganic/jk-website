import type { CheckoutFormProps } from "@/utils/zod/checkout-schema/checkout-form-props";
import ShippingAddress from "../shippingAddress";
import k from "./styles.module.scss";

type ShippingSectionProps = Pick<
  CheckoutFormProps,
  "register" | "errors" | "setValue" | "watch"
>;

export default function ShippingSection({
  register,
  errors,
  setValue,
  watch,
}: ShippingSectionProps) {
  const useDifferentBilling = watch("useDifferentShipping");

  return (
    <div className={k.shipping_address}>
      <h5>Shipping Address</h5>
      <div className={k.options}>
        <label>
          <input
            type="radio"
            checked={!useDifferentBilling}
            onChange={() => setValue("useDifferentShipping", false)}
          />
          Same as billing address
        </label>

        <label>
          <input
            type="radio"
            checked={useDifferentBilling}
            onChange={() => setValue("useDifferentShipping", true)}
          />
          Use a different shipping address
        </label>
      </div>
      {useDifferentBilling && (
        <ShippingAddress register={register} errors={errors} />
      )}
    </div>
  );
}
