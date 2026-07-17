import { describe, expect, it } from "vitest";
import {
  DELIVERY_STAGES,
  FULFILLMENT_META_KEY,
  getFulfillmentStatusInfo,
  getFulfillmentStatusOptions,
  isPickupOrder,
  PICKUP_STAGES,
} from "./fulfillment-status";

const deliveryOrder = {
  status: "processing",
  shipping_lines: [{ method_id: "flat_rate" }],
  meta_data: [],
};

const pickupOrder = {
  status: "processing",
  shipping_lines: [{ method_id: "local_pickup" }],
  meta_data: [],
};

describe("isPickupOrder", () => {
  it("detects local pickup orders by shipping method id", () => {
    expect(isPickupOrder(pickupOrder)).toBe(true);
    expect(isPickupOrder(deliveryOrder)).toBe(false);
  });
});

describe("getFulfillmentStatusOptions", () => {
  it("returns pickup stages for pickup orders and delivery stages otherwise", () => {
    expect(getFulfillmentStatusOptions(pickupOrder)).toBe(PICKUP_STAGES);
    expect(getFulfillmentStatusOptions(deliveryOrder)).toBe(DELIVERY_STAGES);
  });
});

describe("getFulfillmentStatusInfo", () => {
  it("falls back to 'not started' for a legacy pending order with no fulfillment meta", () => {
    const info = getFulfillmentStatusInfo({
      ...deliveryOrder,
      status: "pending",
    });

    expect(info.stageIndex).toBe(0);
    expect(info.customerHeadline).toBe("Order placed");
  });

  it("falls back to the first stage for legacy processing orders with no meta", () => {
    const info = getFulfillmentStatusInfo(deliveryOrder);

    expect(info.stageIndex).toBe(1);
    expect(info.customerHeadline).toBe("Preparing");
  });

  it("falls back to the final stage for legacy completed orders with no meta", () => {
    const info = getFulfillmentStatusInfo({
      ...deliveryOrder,
      status: "completed",
    });

    expect(info.stageIndex).toBe(DELIVERY_STAGES.length);
    expect(info.customerHeadline).toBe("Delivered");
  });

  it("reads the explicit fulfillment meta value for delivery orders", () => {
    const info = getFulfillmentStatusInfo({
      ...deliveryOrder,
      meta_data: [{ key: FULFILLMENT_META_KEY, value: "dispatched" }],
    });

    expect(info.stageIndex).toBe(2);
    expect(info.customerHeadline).toBe("Dispatched");
  });

  it("reads the explicit fulfillment meta value for pickup orders", () => {
    const info = getFulfillmentStatusInfo({
      ...pickupOrder,
      meta_data: [{ key: FULFILLMENT_META_KEY, value: "ready_for_pickup" }],
    });

    expect(info.stageIndex).toBe(2);
    expect(info.customerHeadline).toBe("Ready for pickup");
  });

  it("treats cancelled and refunded orders as an exception state", () => {
    const cancelled = getFulfillmentStatusInfo({
      ...deliveryOrder,
      status: "cancelled",
      meta_data: [{ key: FULFILLMENT_META_KEY, value: "dispatched" }],
    });

    expect(cancelled.isException).toBe(true);
    expect(cancelled.stageIndex).toBe(0);
    expect(cancelled.customerHeadline).toBe("Order cancelled");

    const refunded = getFulfillmentStatusInfo({
      ...deliveryOrder,
      status: "refunded",
    });

    expect(refunded.isException).toBe(true);
    expect(refunded.customerHeadline).toBe("Order refunded");
  });
});
