import { describe, expect, it } from "vitest";
import {
  getDeliveryFee,
  getZoneNameForSubtype,
  resolveDeliveryZone,
} from "@/app/(payment)/checkout/lib/delivery-zones";
import {
  getDeliverySubtype,
  isDoorToDoorCounty,
} from "@/data/kenya-delivery";

describe("kenya delivery helpers", () => {
  it("treats Nairobi area counties as door-to-door", () => {
    expect(isDoorToDoorCounty("Nairobi")).toBe(true);
    expect(isDoorToDoorCounty("Kiambu")).toBe(true);
    expect(getDeliverySubtype("Kisumu")).toBe("parcel_office");
  });
});

describe("delivery zone resolution", () => {
  const zones = [
    { zone: "Nairobi Door Delivery", fee_ksh: 300 },
    { zone: "Kenya Parcel Office", fee_ksh: 500 },
  ];

  it("resolves exact Woo zone names", () => {
    expect(resolveDeliveryZone(zones, "door_to_door")?.zone).toBe(
      "Nairobi Door Delivery",
    );
    expect(getDeliveryFee(zones, "parcel_office")).toEqual({
      zoneName: "Kenya Parcel Office",
      fee: 500,
    });
  });

  it("falls back to preferred labels when zones are missing", () => {
    expect(getZoneNameForSubtype("door_to_door")).toBe("Nairobi Door Delivery");
    expect(getDeliveryFee([], "parcel_office")).toEqual({
      zoneName: "Kenya Parcel Office",
      fee: 0,
    });
  });
});
