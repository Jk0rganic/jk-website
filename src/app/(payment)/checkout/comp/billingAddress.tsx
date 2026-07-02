import type { CheckoutFormProps } from "@/utils/zod/checkout-schema/checkout-form-props";
import type { CheckOutSchemaType } from "@/utils/zod/checkout-schema/checkout-schema";
import k from "./styles.module.scss";
import { FormInput } from "@/comp/form/formInput/formInput";

type BillingAddressProps = Pick<CheckoutFormProps, "register" | "errors"> & {
  deliveryMethod: CheckOutSchemaType["delivery_method"];
  deliverySubtype?: CheckOutSchemaType["delivery_subtype"];
};

export default function BillingAddress({
  register,
  errors,
  deliveryMethod,
  deliverySubtype,
}: BillingAddressProps) {
  const isDoorToDoor =
    deliveryMethod === "shipping" && deliverySubtype === "door_to_door";
  const isParcelOffice =
    deliveryMethod === "shipping" && deliverySubtype === "parcel_office";

  return (
    <div className={k.card_wrapper}>
      <h5>{isParcelOffice ? "Your Details" : "Billing Address"}</h5>
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
        {!isParcelOffice ? (
          <FormInput
            type="text"
            name="billing_address_1"
            register={register}
            errors={errors}
            placeholder={
              isDoorToDoor
                ? "Street address, estate & landmarks *"
                : "Street address (optional)"
            }
          />
        ) : null}
        <FormInput
          type="text"
          name="billing_city"
          register={register}
          errors={errors}
          placeholder={isParcelOffice ? "Your town / city *" : "Town / City *"}
        />
      </div>
      <div className={k.shipping_info}>
        <FormInput
          type="text"
          name="billing_phone"
          register={register}
          errors={errors}
          placeholder="Phone Number *"
        />
        {!isParcelOffice ? (
          <FormInput
            type="number"
            name="billing_postcode"
            register={register}
            errors={errors}
            placeholder="Postcode / ZIP (optional)"
          />
        ) : null}
      </div>
      <div className={k.save_info}>
        <input type="checkbox" id="saveInfo" {...register("saveInfo")} />
        <label htmlFor="saveInfo">Save this information for next time</label>
      </div>
    </div>
  );
}
