"use client";
import k from "./styles.module.scss";
import { useEffect, useMemo } from "react";
import type { CheckoutFormProps } from "@/utils/zod/checkout-schema/checkout-form-props";

type PickUpPointProps = Pick<
  CheckoutFormProps,
  "register" | "setValue" | "watch" | "loading" | "error"
>;

export default function PickUpPoint({
  register,
  setValue,
  loading,
  error,
  watch,
}: PickUpPointProps) {
  const pickupPoint = useMemo(
    () => ({
      id: "stanbank_nairobi",
      name: "Nairobi CBD Pickup – Stanbank House",
      address:
        "Stanbank House, Moi Avenue, Next to Archives, 6th Floor, Shop B613, Nairobi",
    }),
    [],
  );

  useEffect(() => {
    if (!watch("pickupPoint")) {
      setValue("pickupPoint", pickupPoint.id, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    }
  }, [pickupPoint.id, setValue, watch]);

  const selectedPickup = watch("pickupPoint");

  return (
    <div className={k.pick_point}>
      {loading && <p>Loading pick-up details...</p>}
      {error && <p>Error loading pick-up details: {error.message}</p>}

      <h5>Pick-Up Point</h5>

      <div className={k.wrapper}>
        <label className={k.checkbox}>
          <input
            type="radio"
            value={pickupPoint.id}
            {...register("pickupPoint")}
            checked={selectedPickup === pickupPoint.id}
            readOnly
          />
          <div>
            <strong>{pickupPoint.name}</strong>
            <p>{pickupPoint.address}</p>
          </div>
        </label>
      </div>
    </div>
  );
}
