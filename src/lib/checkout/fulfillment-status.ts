import type { OrderMeta } from "@/types/checkout/checkout";

export const FULFILLMENT_META_KEY = "_jk_fulfillment_status";

export type FulfillmentStageValue =
  | "preparing"
  | "ready_for_pickup"
  | "picked_up"
  | "dispatched"
  | "out_for_delivery"
  | "delivered";

export type FulfillmentStageOption = {
  value: FulfillmentStageValue;
  label: string;
  description: string;
};

export const PICKUP_STAGES: FulfillmentStageOption[] = [
  {
    value: "preparing",
    label: "Preparing",
    description: "Your items are being picked and packed for pickup.",
  },
  {
    value: "ready_for_pickup",
    label: "Ready for pickup",
    description: "Your order is ready to collect.",
  },
  {
    value: "picked_up",
    label: "Picked up",
    description: "Picked up — thanks for shopping with us!",
  },
];

export const DELIVERY_STAGES: FulfillmentStageOption[] = [
  {
    value: "preparing",
    label: "Preparing",
    description: "Your items are being picked and packed for delivery.",
  },
  {
    value: "dispatched",
    label: "Dispatched",
    description: "Your order has left our store with a rider.",
  },
  {
    value: "out_for_delivery",
    label: "Out for delivery",
    description: "Your delivery is on the way.",
  },
  {
    value: "delivered",
    label: "Delivered",
    description: "Delivered — we hope you enjoy your order!",
  },
];

type FulfillmentOrderInput = {
  status: string;
  shipping_lines?: Array<{ method_id?: string }>;
  meta_data?: OrderMeta[];
};

export function isPickupOrder(order: FulfillmentOrderInput): boolean {
  return order.shipping_lines?.[0]?.method_id === "local_pickup";
}

export function getFulfillmentStatusOptions(
  order: FulfillmentOrderInput,
): FulfillmentStageOption[] {
  return isPickupOrder(order) ? PICKUP_STAGES : DELIVERY_STAGES;
}

export function getFulfillmentMetaValue(
  meta: OrderMeta[] = [],
): FulfillmentStageValue | undefined {
  const value = meta.find((item) => item.key === FULFILLMENT_META_KEY)?.value;
  return value as FulfillmentStageValue | undefined;
}

export interface FulfillmentStatusInfo {
  stages: FulfillmentStageOption[];
  stageIndex: number;
  isException: boolean;
  customerHeadline: string;
  customerSub: string;
}

export function getFulfillmentStatusInfo(
  order: FulfillmentOrderInput,
): FulfillmentStatusInfo {
  const stages = getFulfillmentStatusOptions(order);
  const isException =
    order.status === "cancelled" || order.status === "refunded";

  if (isException) {
    return {
      stages,
      stageIndex: 0,
      isException: true,
      customerHeadline:
        order.status === "cancelled" ? "Order cancelled" : "Order refunded",
      customerSub:
        order.status === "cancelled"
          ? "This order will not be fulfilled."
          : "This order has been refunded to the original payment method.",
    };
  }

  const metaValue = getFulfillmentMetaValue(order.meta_data);
  let stageIndex = stages.findIndex((stage) => stage.value === metaValue) + 1;

  if (stageIndex === 0) {
    if (order.status === "completed") {
      stageIndex = stages.length;
    } else if (order.status === "processing") {
      stageIndex = 1;
    }
  }

  const currentStage = stageIndex > 0 ? stages[stageIndex - 1] : undefined;

  return {
    stages,
    stageIndex,
    isException: false,
    customerHeadline: currentStage?.label ?? "Order placed",
    customerSub:
      currentStage?.description ??
      "We've received your order and it's queued for packing.",
  };
}
