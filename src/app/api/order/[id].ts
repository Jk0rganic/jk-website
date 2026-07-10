import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { id } = req.query;

  if (!id) return res.status(400).json({ message: "Order ID is required" });

  const baseUrl = process.env.WORDPRESS_URL;
  const consumerKey = process.env.WC_CONSUMER_KEY;
  const consumerSecret = process.env.WC_CONSUMER_SECRET;

  if (!baseUrl || !consumerKey || !consumerSecret) {
    console.error("Missing environment variables");
    return res.status(500).json({ message: "Server misconfiguration" });
  }

  try {
    const url = `${baseUrl}/wp-json/wc/v3/orders/${id}?consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`;

    const response = await fetch(url);
    const text = await response.text();

    if (!response.ok) {
      console.error("WooCommerce Error:", text);
      return res.status(response.status).json({ message: text });
    }

    return res.status(200).json(JSON.parse(text));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch order";
    console.error("Error fetching order:", error);
    return res.status(500).json({ message });
  }
}
