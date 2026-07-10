import type { DeliverySubtype } from "@/data/kenya-delivery";

export type ShippingZoneOption = {
  zone: string;
  fee_ksh: number;
  address?: string;
};

/** WooCommerce zone names — create matching zones in WP admin. */
export const DOOR_TO_DOOR_ZONE = "Nairobi Door Delivery";
export const PARCEL_OFFICE_ZONE = "Kenya Parcel Office";

export const COLLECT_AT_SHOP_ZONE = "Collect at shop physical";

export const COLLECT_AT_SHOP_OPTION: ShippingZoneOption = {
  zone: COLLECT_AT_SHOP_ZONE,
  fee_ksh: 0,
  address:
    "Stanbank House, Moi Avenue, Next to Archives, 6th Floor, Shop B613, Nairobi",
};

export function getZoneNameForSubtype(subtype: DeliverySubtype): string {
  return subtype === "door_to_door" ? DOOR_TO_DOOR_ZONE : PARCEL_OFFICE_ZONE;
}

export function filterWooShippingZones(
  zones: ShippingZoneOption[] = [],
): ShippingZoneOption[] {
  return zones.filter(
    (zone) =>
      zone.zone !== "Locations not covered by your other zones" &&
      zone.zone !== COLLECT_AT_SHOP_ZONE,
  );
}

export function resolveDeliveryZone(
  zones: ShippingZoneOption[],
  subtype: DeliverySubtype,
): ShippingZoneOption | undefined {
  const preferred = getZoneNameForSubtype(subtype);
  const exact = zones.find((zone) => zone.zone === preferred);
  if (exact) return exact;

  if (subtype === "door_to_door") {
    return (
      zones.find(
        (zone) => /nairobi/i.test(zone.zone) && /door/i.test(zone.zone),
      ) ??
      zones.find((zone) => /nairobi/i.test(zone.zone)) ??
      zones[0]
    );
  }

  return (
    zones.find((zone) => /parcel|office/i.test(zone.zone)) ??
    zones.find((zone) => zone.zone !== DOOR_TO_DOOR_ZONE) ??
    zones[0]
  );
}

export function getDeliveryFee(
  zones: ShippingZoneOption[],
  subtype: DeliverySubtype,
): { zoneName: string; fee: number } {
  const resolved = resolveDeliveryZone(zones, subtype);
  return {
    zoneName: resolved?.zone ?? getZoneNameForSubtype(subtype),
    fee: resolved?.fee_ksh ?? 0,
  };
}
