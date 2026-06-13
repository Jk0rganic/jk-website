"use client";

import type { CheckoutFormProps } from "@/utils/zod/checkout-schema/checkout-form-props";
import { useState } from "react";
import k from "./styles.module.scss";
import { FormTextarea } from "@/comp/form/formInput/formInput";

type ShippingAddressProps = Pick<CheckoutFormProps, "register" | "errors">;

export default function AdditionInformation({
  register,
  errors,
}: ShippingAddressProps) {
  const [isChecked, setIsChecked] = useState(false);

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsChecked(e.target.checked);
  };

  return (
    <div className={`${k.card_wrapper} ${k.last_card}`}>
      <h5>Additional information</h5>

      <div className={k.checkbox_customer_note}>
        <label>
          <input
            type="checkbox"
            checked={isChecked}
            onChange={handleCheckboxChange}
          />
          Add a note to your order
        </label>

        {isChecked && (
          <FormTextarea
            name="customer_note"
            placeholder="Notes about your order, e.g. Special notes for delivery"
            register={register}
            errors={errors}
          />
        )}
      </div>
    </div>
  );
}
