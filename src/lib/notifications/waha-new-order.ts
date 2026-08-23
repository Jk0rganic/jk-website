import "server-only";
import { getOrderDisplayInfo } from "@/lib/checkout/get-order-display";

function money(amount: string | number, symbol: string) {
  const value = typeof amount === "number" ? amount : Number(amount);
  return `${symbol}${Number.isFinite(value) ? value.toFixed(2) : amount}`;
}

function getWahaConfig() {
  const url = process.env.WAHA_URL?.trim().replace(/\/$/, "");
  const apiKey = process.env.WAHA_API_KEY?.trim();
  const chatId = process.env.WAHA_ORDER_GROUP_ID?.trim();

  if (!url && !apiKey && !chatId) return null;

  if (!url || !apiKey || !chatId) {
    throw new Error(
      "WAHA_URL, WAHA_API_KEY, and WAHA_ORDER_GROUP_ID must all be configured",
    );
  }

  return {
    url,
    apiKey,
    chatId,
    session: process.env.WAHA_SESSION?.trim() || "default",
  };
}

export function buildNewOrderWhatsAppMessage(order: WooOrderResponse) {
  const customerName =
    `${order.billing.first_name} ${order.billing.last_name}`.trim();
  const orderUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/admin-account/orders/${order.id}`;
  const display = getOrderDisplayInfo(order);
  const deliveryAddress = [
    order.shipping.address_1,
    order.shipping.city,
    order.shipping.state,
  ]
    .filter(Boolean)
    .join(", ");
  const items = order.line_items
    .map(
      (item) =>
        `• ${item.quantity} × ${item.name} — ${money(item.total, order.currency_symbol)}`,
    )
    .join("\n");

  return [
    `🛒 *New paid order #${order.id}*`,
    "",
    `Customer: ${customerName}`,
    `Phone: ${order.billing.phone}`,
    `Total: ${money(order.total, order.currency_symbol)}`,
    `Payment: ${display.paymentLabel} · ${order.payment_method_title}`,
    `Delivery: ${deliveryAddress || "See order details"}`,
    "",
    "*Items*",
    items,
    "",
    `View order: ${orderUrl}`,
  ].join("\n");
}

export async function sendNewOrderWhatsAppNotification(
  order: WooOrderResponse,
) {
  const config = getWahaConfig();

  // WAHA is optional so deployments can run before the service is provisioned.
  if (!config) return { status: "disabled" as const };

  const response = await fetch(`${config.url}/api/sendText`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": config.apiKey,
    },
    body: JSON.stringify({
      session: config.session,
      chatId: config.chatId,
      text: buildNewOrderWhatsAppMessage(order),
    }),
  });

  if (!response.ok) {
    const responseBody = (await response.text()).slice(0, 500);
    throw new Error(
      `WAHA returned ${response.status}${responseBody ? `: ${responseBody}` : ""}`,
    );
  }

  return { status: "sent" as const };
}
