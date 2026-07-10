"use client";

import { CheckboxInputTerms } from "@/comp/form/formInput/formInput";
import type { CheckoutFormProps } from "@/utils/zod/checkout-schema/checkout-form-props";
import AdditionInformation from "./AdditionInformation";
import PaymentOption from "./paymentOption/paymentOption";

type TermsAndConditionsSectionProps = Pick<
  CheckoutFormProps,
  "register" | "control" | "errors" | "watch"
> & {
  orderTotal: number;
  isLoggedIn?: boolean;
};

export default function TermsAndConditionsSection({
  register,
  control,
  errors,
  watch,
  orderTotal,
  isLoggedIn = false,
}: TermsAndConditionsSectionProps) {
  return (
    <>
      <PaymentOption
        register={register}
        control={control}
        errors={errors}
        watch={watch}
        orderTotal={orderTotal}
        isLoggedIn={isLoggedIn}
      />
      <AdditionInformation register={register} errors={errors} />
      <div className="checkbox_terms">
        <CheckboxInputTerms
          name="termsAgreement"
          register={register}
          errors={errors}
          label="I agree to the terms and conditions"
        />
      </div>
    </>
  );
}
