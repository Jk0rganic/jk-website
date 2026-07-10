import { FormInput } from "@/comp/form/formInput/formInput";
import type { CheckoutFormProps } from "@/utils/zod/checkout-schema/checkout-form-props";

import k from "./styles.module.scss";

type ExclusiveEmailProps = Pick<CheckoutFormProps, "register" | "errors">;

export default function ExclusiveEmail({
  register,
  errors,
}: ExclusiveEmailProps) {
  return (
    <section className={k.card_wrapper}>
      <h5>Customer Information</h5>

      <FormInput
        type="email"
        name="email"
        register={register}
        errors={errors}
        placeholder="Email address *"
      />
    </section>
  );
}
