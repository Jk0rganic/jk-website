"use client";

import { useEffect, useMemo } from "react";
import { get, useController } from "react-hook-form";
import {
  getDeliverySubtype,
  getParcelTownNamesForCounty,
  isDoorToDoorCounty,
  KENYA_COUNTIES,
} from "@/data/kenya-delivery";
import type { CheckoutFormProps } from "@/utils/zod/checkout-schema/checkout-form-props";
import {
  filterWooShippingZones,
  getDeliveryFee,
} from "../../lib/delivery-zones";
import ComboboxInput from "./comboboxInput";
import k from "./styles.module.scss";

type DeliveryQuoteSummary = {
  fee: number;
  label: string;
  eta?: string | null;
};

type Props = Pick<CheckoutFormProps, "control" | "errors" | "setValue"> & {
  shippingZones: { zone: string; fee_ksh: number }[];
  deliveryQuote?: DeliveryQuoteSummary | null;
};

function matchOption(value: string, options: readonly string[]) {
  const normalized = value.trim().toLowerCase();
  return options.find((option) => option.toLowerCase() === normalized);
}

export default function DeliveryLocationSelector({
  control,
  errors,
  setValue,
  shippingZones,
  deliveryQuote,
}: Props) {
  const {
    field: { value: countyValue, onChange: onCountyChange },
  } = useController({ control, name: "county", defaultValue: "" });
  const county = countyValue || "";
  const selectedCounty = matchOption(county, KENYA_COUNTIES);
  const commitCounty = (raw: string) => {
    const match = matchOption(raw, KENYA_COUNTIES);
    if (match) {
      setValue("county", match, { shouldDirty: true, shouldValidate: true });
    }
  };
  const isValidCounty = Boolean(selectedCounty);
  const deliverySubtype = selectedCounty
    ? getDeliverySubtype(selectedCounty)
    : null;
  const isDoorToDoor = selectedCounty
    ? isDoorToDoorCounty(selectedCounty)
    : false;

  const wooZones = useMemo(
    () => filterWooShippingZones(shippingZones),
    [shippingZones],
  );

  const deliveryFee = useMemo(() => {
    if (!deliverySubtype) return null;
    return getDeliveryFee(wooZones, deliverySubtype);
  }, [deliverySubtype, wooZones]);
  const displayFee = deliveryQuote?.fee ?? deliveryFee?.fee;
  const displayEta = deliveryQuote?.eta;

  const towns = useMemo(
    () =>
      selectedCounty && !isDoorToDoor
        ? getParcelTownNamesForCounty(selectedCounty)
        : [],
    [selectedCounty, isDoorToDoor],
  );
  const {
    field: { value: parcelTownValue, onChange: onParcelTownChange },
  } = useController({ control, name: "parcel_town", defaultValue: "" });
  const commitParcelTown = (raw: string) => {
    const match = matchOption(raw, towns);
    if (match) {
      setValue("parcel_town", match, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  };

  useEffect(() => {
    if (!isValidCounty) {
      setValue("delivery_subtype", undefined, { shouldValidate: false });
      setValue("parcel_town", "", { shouldValidate: false });
      setValue("parcel_office_id", "", { shouldValidate: false });
      setValue("shippingZone", "", { shouldValidate: false });
      return;
    }

    if (!selectedCounty) return;

    const subtype = getDeliverySubtype(selectedCounty);
    setValue("delivery_subtype", subtype, { shouldValidate: true });

    if (subtype === "parcel_office") {
      setValue("useDifferentShipping", false, { shouldValidate: true });
    }

    if (deliveryFee) {
      setValue("shippingZone", deliveryFee.zoneName, { shouldValidate: true });
    }
  }, [deliveryFee, isValidCounty, selectedCounty, setValue]);

  useEffect(() => {
    if (!isValidCounty || isDoorToDoor) {
      setValue("parcel_town", "", { shouldValidate: true });
      setValue("parcel_office_id", "", { shouldValidate: true });
      return;
    }
    setValue("parcel_office_id", "", { shouldValidate: true });
  }, [isValidCounty, isDoorToDoor, setValue]);

  return (
    <div className={k.delivery_location}>
      <h5>Delivery Location</h5>

      <div className={k.field}>
        <label htmlFor="county">County *</label>
        <ComboboxInput
          id="county"
          value={county}
          options={KENYA_COUNTIES}
          placeholder="Start typing, e.g. Kiambu"
          className={get(errors, "county") ? k.select_error : ""}
          onChange={onCountyChange}
          onCommit={commitCounty}
        />
        {get(errors, "county")?.message ? (
          <span className={k.error}>
            {String(get(errors, "county")?.message)}
          </span>
        ) : !county ? (
          <p className={k.help}>
            We&apos;ll show Nairobi address fields or upcountry pickup town
            options after you choose a county.
          </p>
        ) : null}
      </div>

      {county && !isValidCounty ? (
        <p className={k.error}>
          Select a county from the suggestion list to continue.
        </p>
      ) : null}

      {!isValidCounty ? (
        <div className={`${k.field} ${k.disabled_field}`}>
          <label htmlFor="parcel_town_preview">
            Nearest town / centre for pickup *
          </label>
          <input
            id="parcel_town_preview"
            type="text"
            placeholder="Select county first"
            disabled
          />
          <p className={k.help}>
            After county selection, we&apos;ll show the approved pickup towns
            and centres for that county.
          </p>
        </div>
      ) : null}

      {isValidCounty && isDoorToDoor ? (
        <div className={`${k.notice} ${k.door_notice}`}>
          <strong>Door-to-door delivery</strong>
          <p>
            We deliver directly to your address in {selectedCounty}. Please
            provide your full street address, estate, and any landmarks below.
          </p>
          {typeof displayFee === "number" ? (
            <p className={k.fee}>
              <strong>Delivery fee:</strong> Ksh {displayFee}
              {displayEta ? <span> · {displayEta}</span> : null}
            </p>
          ) : null}
        </div>
      ) : null}

      {isValidCounty && !isDoorToDoor ? (
        <>
          <div className={`${k.notice} ${k.parcel_notice}`}>
            <strong>Nearest town/centre pickup</strong>
            <p>
              Outside Nairobi, tell us the nearest town or centre to you — for
              example Kiambu county, Kimende town. We use this to confirm
              whether we can deliver there or advise the nearest pickup point.
              We&apos;ll contact you with the final pickup details after
              dispatch.
            </p>
            {typeof displayFee === "number" ? (
              <p className={k.fee}>
                <strong>Delivery fee:</strong> Ksh {displayFee}
                {displayEta ? <span> · {displayEta}</span> : null}
              </p>
            ) : null}
          </div>

          <div className={k.field}>
            <label htmlFor="parcel_town">
              Nearest town / centre for pickup *
            </label>
            <ComboboxInput
              id="parcel_town"
              value={parcelTownValue || ""}
              options={towns}
              placeholder="Start typing, e.g. Kimende"
              className={get(errors, "parcel_town") ? k.select_error : ""}
              onChange={onParcelTownChange}
              onCommit={commitParcelTown}
            />
            <p className={k.help}>
              Type to search, then choose one of the listed towns/centres.
              We&apos;ll use this to confirm whether we can deliver there or
              suggest the nearest pickup point.
            </p>
            {get(errors, "parcel_town")?.message ? (
              <span className={k.error}>
                {String(get(errors, "parcel_town")?.message)}
              </span>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
