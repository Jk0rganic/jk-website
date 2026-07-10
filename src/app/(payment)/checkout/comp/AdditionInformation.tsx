"use client";

import { useState } from "react";
import { FormTextarea } from "@/comp/form/formInput/formInput";
import type { CheckoutFormProps } from "@/utils/zod/checkout-schema/checkout-form-props";
import k from "./styles.module.scss";

type ShippingAddressProps = Pick<CheckoutFormProps, "register" | "errors">;

export default function AdditionInformation({
  register,
  errors,
}: ShippingAddressProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`${k.card_wrapper} ${k.last_card}`}>
      <details
        className={k.order_note}
        onToggle={(event) => setIsOpen(event.currentTarget.open)}
      >
        <summary>Add order note</summary>
        {isOpen ? (
          <>
            <p>Share delivery instructions or product preferences if needed.</p>

            <FormTextarea
              name="customer_note"
              placeholder="Notes about your order, e.g. special notes for delivery"
              register={register}
              errors={errors}
            />
          </>
        ) : null}
      </details>
    </div>
  );
}
