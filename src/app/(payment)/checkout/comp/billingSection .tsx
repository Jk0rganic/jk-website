import type { CheckoutFormProps } from "@/utils/zod/checkout-schema/checkout-form-props";
import type { CheckOutSchemaType } from "@/utils/zod/checkout-schema/checkout-schema";
import ExclusiveEmail from "./exclusiveEmail";
import PickUpPoint from "./pickUpPoint/pickUpPoint";
import BillingAddress from "./billingAddress";
import DeliveryLocationSelector from "./delivery-location/deliveryLocationSelector";

type BillingSectionProps = Pick<
  CheckoutFormProps,
  "register" | "errors" | "setValue" | "watch" | "loading" | "error"
> & {
  deliveryMethod: CheckOutSchemaType["delivery_method"];
  shippingZones: NonNullable<CheckoutFormType["shippingZone"]>[];
  deliverySubtype?: CheckOutSchemaType["delivery_subtype"];
};

export default function BillingSection({
  register,
  errors,
  deliveryMethod,
  shippingZones,
  setValue,
  loading,
  error,
  watch,
  deliverySubtype,
}: BillingSectionProps) {
  return (
    <>
      <ExclusiveEmail register={register} errors={errors} />

      {deliveryMethod === "shipping" ? (
        <DeliveryLocationSelector
          register={register}
          errors={errors}
          setValue={setValue}
          watch={watch}
          shippingZones={shippingZones}
        />
      ) : null}

      <BillingAddress
        register={register}
        errors={errors}
        deliveryMethod={deliveryMethod}
        deliverySubtype={deliverySubtype}
      />

      {deliveryMethod === "pickup" ? (
        <PickUpPoint
          register={register}
          setValue={setValue}
          loading={loading}
          error={error}
          watch={watch}
        />
      ) : null}
    </>
  );
}
