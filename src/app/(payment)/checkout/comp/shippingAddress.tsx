import type { CheckoutFormProps } from "@/utils/zod/checkout-schema/checkout-form-props";
import k from "./styles.module.scss";
import { FormInput } from "@/comp/form/formInput/formInput";

type ShippingAddressProps = Pick<CheckoutFormProps, "register" | "errors">;

export default function ShippingAddress({
  register,
  errors,
}: ShippingAddressProps) {
  return (
    <div className={k.card_wrapper}>
      <h5>Shipping Address</h5>
      <div className={k.user_names}>
        <FormInput
          type="text"
          name="shipping_first_name"
          register={register}
          errors={errors}
          placeholder="First name *"
        />
        <FormInput
          type="text"
          name="shipping_last_name"
          register={register}
          errors={errors}
          placeholder="Last name *"
        />
      </div>

      <div className={k.shipping_info}>
        <FormInput
          type="text"
          name="shipping_address_1"
          register={register}
          errors={errors}
          placeholder="Street address (optional)"
        />

        <FormInput
          type="text"
          name="shipping_city"
          register={register}
          errors={errors}
          placeholder="Town / City "
        />
      </div>

      <div className={k.shipping_info}>
        <FormInput
          type="text"
          name="shipping_phone"
          register={register}
          errors={errors}
          placeholder="Phone Number"
        />

        <FormInput
          type="number"
          name="shipping_postcode"
          register={register}
          errors={errors}
          placeholder="Postcode / ZIP (optional)"
        />
      </div>
    </div>
  );
}
