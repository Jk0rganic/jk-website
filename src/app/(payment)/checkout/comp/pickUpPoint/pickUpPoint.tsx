"use client";
import k from "./styles.module.scss";
import { useEffect, useMemo } from "react";
import type { CheckoutFormProps } from "@/utils/zod/checkout-schema/checkout-form-props";
import type { CheckOutSchemaType } from "@/utils/zod/checkout-schema/checkout-schema";
import { COLLECT_AT_SHOP_OPTION, COLLECT_AT_SHOP_ZONE } from "../../lib/shipping-zones";

type BillingSectionProps = Pick<
  CheckoutFormProps,
  "register" | "errors" | "setValue" | "watch" | "loading" | "error"
> & {
  deliveryMethod: CheckOutSchemaType["delivery_method"];
  shippingZones: NonNullable<CheckoutFormType["shippingZone"]> [];
};

export default function PickUpPoint({
  deliveryMethod,
  register,
  setValue,
  shippingZones = [],
  loading,
  error,
  watch,
}: BillingSectionProps) {
  const pickupPoint = useMemo(
    () => ({
      id: "stanbank_nairobi",
      name: "Nairobi CBD Pickup – Stanbank House",
      address:
        "Stanbank House, Moi Avenue, Next to Archives, 6th Floor, Shop B613, Nairobi",
    }),
    [],
  );

  const stableShippingZones = useMemo(() => shippingZones, [shippingZones]);

  // Auto-set default values after async data loads
  useEffect(() => {
    if (deliveryMethod === "pickup" && !watch("pickupPoint")) {
      setValue("pickupPoint", pickupPoint.id, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    }

    if (
      deliveryMethod === "shipping" &&
      stableShippingZones.length > 0 &&
      !watch("shippingZone")
    ) {
      setValue("shippingZone", stableShippingZones[0].zone, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    }
  }, [deliveryMethod, stableShippingZones, pickupPoint.id, setValue, watch]);

  const selectedPickup = watch("pickupPoint");

  return (
    <div className={k.pick_point}>
      {loading && <p>Loading shipping zones...</p>}
      {error && <p>Error fetching shipping zones: {error.message}</p>}

      <h5>{deliveryMethod === "pickup" ? "Pick-Up Point" : "Shipping Zones"}</h5>

      <div className={k.wrapper}>
        {deliveryMethod === "pickup" ? (
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
        ) : (
          stableShippingZones.map((zone) => {
            const selectedZone = watch("shippingZone");
            return (
              <label key={zone.zone} className={k.checkbox}>
                <input
                  type="radio"
                  value={zone.zone}
                  {...register("shippingZone")}
                  checked={selectedZone === zone.zone}
                  readOnly
                />
                <div>
                  <strong>{zone.zone}</strong>
                  <p>
                    <strong>Fee:</strong> Ksh {zone.fee_ksh}
                  </p>
                  {zone.zone === COLLECT_AT_SHOP_ZONE ? (
                    <p>{COLLECT_AT_SHOP_OPTION.address}</p>
                  ) : null}
                </div>
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}