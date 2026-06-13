import type { CheckoutFormProps } from "@/utils/zod/checkout-schema/checkout-form-props";
import type { CheckOutSchemaType } from "@/utils/zod/checkout-schema/checkout-schema";
import ExclusiveEmail from "./exclusiveEmail";
import PickUpPoint from "./pickUpPoint/pickUpPoint";
import BillingAddress from "./billingAddress";

type BillingSectionProps = Pick<
  CheckoutFormProps,
  "register" | "errors" | "setValue" | "watch" | "loading" | "error"
> & {
  deliveryMethod: CheckOutSchemaType["delivery_method"];
  shippingZones: NonNullable<CheckoutFormType["shippingZone"]>[];
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
}: BillingSectionProps) {
  return (
    <>
      <ExclusiveEmail register={register} errors={errors} />
      <BillingAddress register={register} errors={errors} />

      <PickUpPoint
        register={register}
        errors={errors}
        deliveryMethod={deliveryMethod}
        shippingZones={shippingZones}
        setValue={setValue}
        loading={loading}
        error={error}
        watch={watch}
      />
    </>
  );
}
