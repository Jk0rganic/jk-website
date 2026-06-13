import { getWordpressConfig } from "./baseUrl";

interface OrderPayload {
  [key: string]: unknown;
}

const getAuthHeader = (key: string, secret: string) =>
  `Basic ${Buffer.from(`${key}:${secret}`).toString("base64")}`;

export async function createOrder(orderPayload: OrderPayload) {
  const { BASE_URL, CONSUMER_KEY, CONSUMER_SECRET } = getWordpressConfig();

  const res = await fetch(`${BASE_URL}/wp-json/wc/v3/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: getAuthHeader(CONSUMER_KEY!, CONSUMER_SECRET!),
    },
    body: JSON.stringify(orderPayload),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Order creation failed");
  }

  return res.json();
}
