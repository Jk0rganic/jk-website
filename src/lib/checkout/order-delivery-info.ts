import type { OrderMeta } from "@/types/checkout/checkout";

export type OrderDeliveryInfo = {
  type?: "door_to_door" | "parcel_office";
  county?: string;
  parcelOfficeName?: string;
  parcelOfficeAddress?: string;
  parcelTown?: string;
  pickupPointName?: string;
  pickupPointAddress?: string;
};

export function getOrderDeliveryInfo(
  meta: OrderMeta[] = [],
): OrderDeliveryInfo {
  const map = new Map(meta.map((item) => [item.key, item.value]));

  return {
    type: map.get("_delivery_type") as OrderDeliveryInfo["type"],
    county: map.get("_county"),
    parcelOfficeName: map.get("_parcel_office_name"),
    parcelOfficeAddress: map.get("_parcel_office_address"),
    parcelTown: map.get("_parcel_town"),
    pickupPointName: map.get("_pickup_point_name"),
    pickupPointAddress: map.get("_pickup_point_address"),
  };
}

export function formatDeliveryTypeLabel(
  type?: OrderDeliveryInfo["type"],
): string | undefined {
  if (type === "door_to_door") return "Door-to-door delivery";
  if (type === "parcel_office") return "Parcel office / stage delivery";
  return undefined;
}
