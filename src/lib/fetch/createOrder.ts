import { fetchWoo } from "./fetchRest";

interface OrderPayload {
  [key: string]: unknown;
}

export async function createOrder(orderPayload: OrderPayload) {
  return fetchWoo("orders", {
    method: "POST",
    body: orderPayload,
  });
}
