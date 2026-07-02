"use client";

import { useEffect, useMemo } from "react";
import { get } from "react-hook-form";
import type { CheckoutFormProps } from "@/utils/zod/checkout-schema/checkout-form-props";
import {
  KENYA_COUNTIES,
  getDeliverySubtype,
  getParcelTownsForCounty,
  isDoorToDoorCounty,
} from "@/data/kenya-delivery";
import {
  filterWooShippingZones,
  getDeliveryFee,
} from "../../lib/delivery-zones";
import k from "./styles.module.scss";

type Props = Pick<
  CheckoutFormProps,
  "register" | "errors" | "setValue" | "watch"
> & {
  shippingZones: { zone: string; fee_ksh: number }[];
};

export default function DeliveryLocationSelector({
  register,
  errors,
  setValue,
  watch,
  shippingZones,
}: Props) {
  const county = watch("county") || "";
  const parcelTown = watch("parcel_town") || "";
  const deliverySubtype = county ? getDeliverySubtype(county) : null;
  const isDoorToDoor = county ? isDoorToDoorCounty(county) : false;

  const wooZones = useMemo(
    () => filterWooShippingZones(shippingZones),
    [shippingZones],
  );

  const deliveryFee = useMemo(() => {
    if (!deliverySubtype) return null;
    return getDeliveryFee(wooZones, deliverySubtype);
  }, [deliverySubtype, wooZones]);

  const towns = useMemo(
    () => (county && !isDoorToDoor ? getParcelTownsForCounty(county) : []),
    [county, isDoorToDoor],
  );

  const offices = useMemo(() => {
    if (!parcelTown) return [];
    return towns.find((town) => town.name === parcelTown)?.offices ?? [];
  }, [parcelTown, towns]);

  useEffect(() => {
    if (!county) return;

    const subtype = getDeliverySubtype(county);
    setValue("delivery_subtype", subtype, { shouldValidate: true });

    if (subtype === "parcel_office") {
      setValue("useDifferentShipping", false, { shouldValidate: true });
    }

    if (deliveryFee) {
      setValue("shippingZone", deliveryFee.zoneName, { shouldValidate: true });
    }
  }, [county, deliveryFee, setValue]);

  useEffect(() => {
    if (!county || isDoorToDoor) {
      setValue("parcel_town", "", { shouldValidate: true });
      setValue("parcel_office_id", "", { shouldValidate: true });
      return;
    }

    if (towns.length === 1 && !parcelTown) {
      setValue("parcel_town", towns[0].name, { shouldValidate: true });
    }
  }, [county, isDoorToDoor, towns, parcelTown, setValue]);

  useEffect(() => {
    if (!parcelTown || isDoorToDoor) return;

    const townOffices =
      towns.find((town) => town.name === parcelTown)?.offices ?? [];
    if (townOffices.length === 1) {
      setValue("parcel_office_id", townOffices[0].id, { shouldValidate: true });
    }
  }, [parcelTown, isDoorToDoor, towns, setValue]);

  return (
    <div className={k.delivery_location}>
      <h5>Delivery Location</h5>

      <div className={k.field}>
        <label htmlFor="county">County *</label>
        <select
          id="county"
          className={get(errors, "county") ? k.select_error : ""}
          {...register("county")}
          defaultValue=""
        >
          <option value="" disabled>
            Select your county
          </option>
          {KENYA_COUNTIES.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        {get(errors, "county")?.message ? (
          <span className={k.error}>{String(get(errors, "county")?.message)}</span>
        ) : null}
      </div>

      {county && isDoorToDoor ? (
        <div className={`${k.notice} ${k.door_notice}`}>
          <strong>Door-to-door delivery</strong>
          <p>
            We deliver directly to your address in {county}. Please provide your
            full street address, estate, and any landmarks below.
          </p>
          {deliveryFee ? (
            <p className={k.fee}>
              <strong>Delivery fee:</strong> Ksh {deliveryFee.fee}
            </p>
          ) : null}
        </div>
      ) : null}

      {county && !isDoorToDoor ? (
        <>
          <div className={`${k.notice} ${k.parcel_notice}`}>
            <strong>Parcel office / stage delivery</strong>
            <p>
              Outside Nairobi we deliver to the nearest parcel office or stage.
              You will collect your order from the location you select below.
            </p>
            {deliveryFee ? (
              <p className={k.fee}>
                <strong>Delivery fee:</strong> Ksh {deliveryFee.fee}
              </p>
            ) : null}
          </div>

          <div className={k.field}>
            <label htmlFor="parcel_town">Town / Stage area *</label>
            <select
              id="parcel_town"
              className={get(errors, "parcel_town") ? k.select_error : ""}
              {...register("parcel_town")}
              defaultValue=""
            >
              <option value="" disabled>
                Select town or stage area
              </option>
              {towns.map((town) => (
                <option key={town.name} value={town.name}>
                  {town.name}
                </option>
              ))}
            </select>
            {get(errors, "parcel_town")?.message ? (
              <span className={k.error}>
                {String(get(errors, "parcel_town")?.message)}
              </span>
            ) : null}
          </div>

          {parcelTown ? (
            <div className={k.field}>
              <label htmlFor="parcel_office_id">Parcel office *</label>
              <select
                id="parcel_office_id"
                className={get(errors, "parcel_office_id") ? k.select_error : ""}
                {...register("parcel_office_id")}
                defaultValue=""
              >
                <option value="" disabled>
                  Select parcel office
                </option>
                {offices.map((office) => (
                  <option key={office.id} value={office.id}>
                    {office.name} – {office.address}
                  </option>
                ))}
              </select>
              {get(errors, "parcel_office_id")?.message ? (
                <span className={k.error}>
                  {String(get(errors, "parcel_office_id")?.message)}
                </span>
              ) : null}
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
