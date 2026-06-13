import { getWordpressConfig } from "./baseUrl";

const getAuthHeader = (key: string, secret: string) =>
  `Basic ${Buffer.from(`${key}:${secret}`).toString("base64")}`;

export async function getOrder(orderId: number) {
  const { BASE_URL, CONSUMER_KEY, CONSUMER_SECRET } = getWordpressConfig();

  if (!CONSUMER_KEY || !CONSUMER_SECRET) {
    throw new Error("Missing WooCommerce credentials");
  }

  const res = await fetch(`${BASE_URL}/wp-json/wc/v3/orders/${orderId}`, {
    headers: {
      Authorization: getAuthHeader(CONSUMER_KEY, CONSUMER_SECRET),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Order fetch failed");
  }

  return res.json();
}
