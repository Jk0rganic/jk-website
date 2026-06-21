import { isOrderAwaitingPayment } from "./is-order-awaiting-payment";

export type OrderDisplayTone =
  | "action"
  | "success"
  | "progress"
  | "neutral"
  | "danger";

export type PaymentDisplayTone = "paid" | "due" | "on-delivery" | "neutral";

export interface OrderDisplayInfo {
  orderLabel: string;
  orderHint?: string;
  orderTone: OrderDisplayTone;
  paymentLabel: string;
  paymentTone: PaymentDisplayTone;
  awaitingPayment: boolean;
  isPaidOnline: boolean;
  summaryLine: string;
}

type OrderInput = {
  status: string;
  payment_method?: string;
  payment_method_title?: string;
  date_paid?: string | null;
  needs_payment?: boolean;
};

function isOnlinePayment(order: OrderInput) {
  return (
    order.payment_method === "intasend" ||
    order.payment_method_title === "Online Payment"
  );
}

function isCod(order: OrderInput) {
  return (
    order.payment_method === "cod" ||
    order.payment_method_title === "Cash on Delivery"
  );
}

export function getOrderDisplayInfo(order: OrderInput): OrderDisplayInfo {
  const awaitingPayment = isOrderAwaitingPayment(order);
  const online = isOnlinePayment(order);
  const cod = isCod(order);
  const normalizedStatus = order.status.toLowerCase();
  const paidOnline =
    online &&
    Boolean(order.date_paid) &&
    (order.needs_payment === false || Boolean(order.date_paid));

  if (awaitingPayment) {
    return {
      orderLabel: "Awaiting payment",
      orderHint: "Complete M-Pesa payment to confirm",
      orderTone: "action",
      paymentLabel: "Payment due",
      paymentTone: "due",
      awaitingPayment: true,
      isPaidOnline: false,
      summaryLine:
        "Your order is saved but payment is still outstanding. Complete M-Pesa payment to confirm it.",
    };
  }

  if (normalizedStatus === "processing") {
    if (paidOnline || online) {
      return {
        orderLabel: "Being prepared",
        orderHint: "Payment received",
        orderTone: "progress",
        paymentLabel: "Paid · M-Pesa",
        paymentTone: "paid",
        awaitingPayment: false,
        isPaidOnline: true,
        summaryLine:
          "Payment was received. We are preparing your order for delivery or pickup.",
      };
    }

    return {
      orderLabel: "Being prepared",
      orderHint: cod ? "Pay when you receive your order" : undefined,
      orderTone: "progress",
      paymentLabel: cod ? "Pay on delivery" : "Confirmed",
      paymentTone: cod ? "on-delivery" : "neutral",
      awaitingPayment: false,
      isPaidOnline: false,
      summaryLine: cod
        ? "Your order is confirmed. Payment will be collected on delivery."
        : "Your order is being prepared.",
    };
  }

  if (normalizedStatus === "completed") {
    return {
      orderLabel: "Completed",
      orderHint: "Delivered",
      orderTone: "success",
      paymentLabel: online ? "Paid · M-Pesa" : "Paid on delivery",
      paymentTone: "paid",
      awaitingPayment: false,
      isPaidOnline: online,
      summaryLine: "This order has been completed.",
    };
  }

  if (normalizedStatus === "cancelled") {
    return {
      orderLabel: "Cancelled",
      orderTone: "danger",
      paymentLabel: online && !order.date_paid ? "Not paid" : "—",
      paymentTone: "neutral",
      awaitingPayment: false,
      isPaidOnline: false,
      summaryLine: "This order was cancelled.",
    };
  }

  if (normalizedStatus === "pending" && cod) {
    return {
      orderLabel: "Confirmed",
      orderHint: "Awaiting fulfillment",
      orderTone: "neutral",
      paymentLabel: "Pay on delivery",
      paymentTone: "on-delivery",
      awaitingPayment: false,
      isPaidOnline: false,
      summaryLine:
        "Your order is confirmed. Payment will be collected on delivery.",
    };
  }

  return {
    orderLabel: order.status,
    orderTone: "neutral",
    paymentLabel: online ? "M-Pesa" : cod ? "Pay on delivery" : "—",
    paymentTone: "neutral",
    awaitingPayment: false,
    isPaidOnline: paidOnline,
    summaryLine: `This order is currently ${order.status}.`,
  };
}
