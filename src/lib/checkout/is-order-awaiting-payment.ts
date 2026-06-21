export function isOrderAwaitingPayment(order: {
  status: string;
  payment_method?: string;
  payment_method_title?: string;
  date_paid?: string | null;
  needs_payment?: boolean;
}): boolean {
  const isOnlinePayment =
    order.payment_method === "intasend" ||
    order.payment_method_title === "Online Payment";

  if (!isOnlinePayment || order.status !== "pending") {
    return false;
  }

  if (order.needs_payment === false) {
    return false;
  }

  return !order.date_paid;
}
