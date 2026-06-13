import { getWordpressConfig } from "./baseUrl";

interface UpdateOrderPayload {
  status?: string;
  set_paid?: boolean;
  transaction_id?: string;
  meta_data?: Array<{ key: string; value: string }>;
}

const getAuthHeader = (key: string, secret: string) =>
  `Basic ${Buffer.from(`${key}:${secret}`).toString("base64")}`;

export async function updateOrder(
  orderId: number,
  payload: UpdateOrderPayload,
) {
  const { BASE_URL, CONSUMER_KEY, CONSUMER_SECRET } = getWordpressConfig();

  if (!CONSUMER_KEY || !CONSUMER_SECRET) {
    throw new Error("Missing WooCommerce credentials");
  }

  const res = await fetch(`${BASE_URL}/wp-json/wc/v3/orders/${orderId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: getAuthHeader(CONSUMER_KEY, CONSUMER_SECRET),
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Order update failed");
  }

  return res.json();
}
