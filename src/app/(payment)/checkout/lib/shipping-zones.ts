export const COLLECT_AT_SHOP_ZONE = "Collect at shop physical";

export const COLLECT_AT_SHOP_OPTION = {
  zone: COLLECT_AT_SHOP_ZONE,
  fee_ksh: 0,
  address:
    "Stanbank House, Moi Avenue, Next to Archives, 6th Floor, Shop B613, Nairobi",
};

type ShippingZoneOption = {
  zone: string;
  fee_ksh: number;
  address?: string;
};

export function buildShippingZoneOptions(
  zones: ShippingZoneOption[] = [],
): ShippingZoneOption[] {
  const filtered = zones.filter(
    (zone) =>
      zone.zone !== "Locations not covered by your other zones" &&
      zone.zone !== COLLECT_AT_SHOP_ZONE,
  );

  return [...filtered, COLLECT_AT_SHOP_OPTION];
}
