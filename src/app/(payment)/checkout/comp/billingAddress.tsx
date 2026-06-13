import type { CheckoutFormProps } from "@/utils/zod/checkout-schema/checkout-form-props";
import k from "./styles.module.scss";
import { FormInput } from "@/comp/form/formInput/formInput";

type BillingAddressProps = Pick<CheckoutFormProps, "register" | "errors">;

export default function BillingAddress({
  register,
  errors,
}: BillingAddressProps) {
  return (
    <div className={k.card_wrapper}>
      <h5>Billing Address</h5>
      <div className={k.user_names}>
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
      <div className={k.shipping_info}>
        <FormInput
          type="text"
          name="billing_address_1"
          register={register}
          errors={errors}
          placeholder="Street address (optional) "
        />
        <FormInput
          type="text"
          name="billing_city"
          register={register}
          errors={errors}
          placeholder="Town / City"
        />
      </div>
      <div className={k.shipping_info}>
        <FormInput
          type="text"
          name="billing_phone"
          register={register}
          errors={errors}
          placeholder="Phone Number"
        />
        <FormInput
          type="number"
          name="billing_postcode"
          register={register}
          errors={errors}
          placeholder="Postcode / ZIP (optional)"
        />
      </div>
      <div className={k.save_info}>
        <input type="checkbox" id="saveInfo" {...register("saveInfo")} />
        <label htmlFor="saveInfo">Save this information for next time</label>
      </div>
    </div>
  );
}
