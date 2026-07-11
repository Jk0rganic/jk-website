import type { CheckoutFormProps } from "@/utils/zod/checkout-schema/checkout-form-props";
import type { CheckOutSchemaType } from "@/utils/zod/checkout-schema/checkout-schema";
import BillingAddress from "./billingAddress";
import DeliveryLocationSelector from "./delivery-location/deliveryLocationSelector";
import ExclusiveEmail from "./exclusiveEmail";
import PickUpPoint from "./pickUpPoint/pickUpPoint";

type BillingSectionProps = Pick<
  CheckoutFormProps,
  "register" | "control" | "errors" | "setValue" | "watch" | "loading" | "error"
> & {
  deliveryMethod: CheckOutSchemaType["delivery_method"];
  shippingZones: NonNullable<CheckoutFormType["shippingZone"]>[];
  deliverySubtype?: CheckOutSchemaType["delivery_subtype"];
};

export default function BillingSection({
  register,
  control,
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
          control={control}
          errors={errors}
          setValue={setValue}
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
