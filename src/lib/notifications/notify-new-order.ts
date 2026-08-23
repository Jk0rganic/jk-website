import "server-only";
import {
  ADMIN_ROLE,
  STORE_MANAGER_ROLE,
  SUPER_ADMIN_ROLE,
} from "@/lib/admin/roles";
import { BRAND_COLORS, BRAND_LOGO_SQUARE_URL, BRAND_NAME } from "@/lib/brand";
import { getOrderDisplayInfo } from "@/lib/checkout/get-order-display";
import { sendEmail } from "@/lib/nodemailer/send-mail";
import { sendNewOrderWhatsAppNotification } from "@/lib/notifications/waha-new-order";
import prisma from "@/lib/prisma";

const STAFF_ROLES = [SUPER_ADMIN_ROLE, ADMIN_ROLE, STORE_MANAGER_ROLE];

export async function getStaffNotificationEmails(): Promise<string[]> {
  const staff = (await prisma.user.findMany({
    where: {
      role: { in: STAFF_ROLES },
      disabledAt: null,
      deletedAt: null,
    },
    select: { email: true },
  })) as Array<{ email: string }>;

  return [...new Set(staff.map((user) => user.email))];
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function money(amount: string | number, symbol: string) {
  const value = typeof amount === "number" ? amount : Number(amount);
  return `${symbol}${Number.isFinite(value) ? value.toFixed(2) : amount}`;
}

function formatDate(dateCreated: string) {
  const date = new Date(dateCreated);

  if (Number.isNaN(date.getTime())) return dateCreated;

  return date.toLocaleString("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

const cell = "padding:10px 12px;border-bottom:1px solid #e5e7eb;";
const totalsCell = "padding:6px 12px;text-align:right;";

export function buildNewOrderEmail(order: WooOrderResponse) {
  const customerName =
    `${order.billing.first_name} ${order.billing.last_name}`.trim();
  const orderUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/admin-account/orders/${order.id}`;
  const symbol = order.currency_symbol;
  const display = getOrderDisplayInfo(order);

  const subtotal = order.line_items.reduce(
    (sum, item) => sum + (Number(item.total) || 0),
    0,
  );
  const shippingLine = order.shipping_lines[0];
  const shippingTotal = order.shipping_lines.reduce(
    (sum, line) => sum + (Number(line.total) || 0),
    0,
  );

  const itemRows = order.line_items
    .map(
      (item) => `
        <tr>
          <td style="${cell}">${escapeHtml(item.name)}</td>
          <td style="${cell}text-align:center;">${item.quantity}</td>
          <td style="${cell}text-align:right;">${money(item.total, symbol)}</td>
        </tr>`,
    )
    .join("");

  const subject = `Paid order #${order.id} — ${money(order.total, symbol)}`;

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:${BRAND_COLORS.black};">
      <div style="background:${BRAND_COLORS.greenDark};padding:24px;border-radius:8px 8px 0 0;text-align:center;">
        <img src="${BRAND_LOGO_SQUARE_URL}" alt="${BRAND_NAME}" width="48" height="48" style="border-radius:8px;display:block;margin:0 auto 12px;" />
        <h2 style="color:${BRAND_COLORS.white};margin:0;font-size:18px;">Order paid — #${order.id}</h2>
        <p style="color:${BRAND_COLORS.greenSoft};margin:6px 0 0;font-size:13px;">${formatDate(order.date_created)}</p>
      </div>

      <div style="border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 8px 8px;">
        <p style="margin:0 0 16px;font-size:14px;">
          <strong>${escapeHtml(customerName)}</strong>'s order has been paid and is ready for fulfilment.
        </p>

        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:4px;">
          <thead>
            <tr>
              <th align="left" style="${cell}border-bottom:2px solid ${BRAND_COLORS.greenDark};">Item</th>
              <th align="center" style="${cell}border-bottom:2px solid ${BRAND_COLORS.greenDark};">Qty</th>
              <th align="right" style="${cell}border-bottom:2px solid ${BRAND_COLORS.greenDark};">Amount</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="${totalsCell}color:#6b7280;">Subtotal</td>
              <td style="${totalsCell}">${money(subtotal, symbol)}</td>
            </tr>
            <tr>
              <td colspan="2" style="${totalsCell}color:#6b7280;">${shippingLine ? escapeHtml(shippingLine.method_title) : "Delivery"}</td>
              <td style="${totalsCell}">${money(shippingTotal, symbol)}</td>
            </tr>
            <tr>
              <td colspan="2" style="${totalsCell}font-weight:bold;border-top:2px solid ${BRAND_COLORS.greenDark};padding-top:10px;">Total</td>
              <td style="${totalsCell}font-weight:bold;border-top:2px solid ${BRAND_COLORS.greenDark};padding-top:10px;color:${BRAND_COLORS.greenDark};">${money(order.total, symbol)}</td>
            </tr>
          </tfoot>
        </table>

        <div style="background:${BRAND_COLORS.greenSoft};border-radius:6px;padding:12px 16px;margin:16px 0;">
          <p style="margin:0;font-size:14px;color:${BRAND_COLORS.greenDark};"><strong>Payment:</strong> ${escapeHtml(display.paymentLabel)} &middot; ${escapeHtml(order.payment_method_title)}</p>
          <p style="margin:4px 0 0;font-size:13px;color:${BRAND_COLORS.greenMid};">${escapeHtml(display.summaryLine)}</p>
        </div>

        <table style="width:100%;font-size:14px;margin-bottom:20px;">
          <tr>
            <td style="padding:4px 0;color:#6b7280;width:110px;vertical-align:top;">Customer</td>
            <td style="padding:4px 0;">${escapeHtml(customerName)}<br>${escapeHtml(order.billing.email)} &middot; ${escapeHtml(order.billing.phone)}</td>
          </tr>
          <tr>
            <td style="padding:4px 0;color:#6b7280;vertical-align:top;">Delivery to</td>
            <td style="padding:4px 0;">${escapeHtml(order.shipping.address_1)}, ${escapeHtml(order.shipping.city)}${order.shipping.state ? `, ${escapeHtml(order.shipping.state)}` : ""}</td>
          </tr>
          <tr>
            <td style="padding:4px 0;color:#6b7280;vertical-align:top;">Status</td>
            <td style="padding:4px 0;">${escapeHtml(display.orderLabel)}</td>
          </tr>
        </table>

        <a
          href="${orderUrl}"
          style="display:inline-block;padding:12px 24px;background:${BRAND_COLORS.green};color:${BRAND_COLORS.white};text-decoration:none;border-radius:6px;font-size:14px;font-weight:bold;"
        >
          View order in admin →
        </a>

        <p style="margin:24px 0 0;padding-top:16px;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af;text-align:center;">
          ${BRAND_NAME} &middot; automated store notification — please don't reply to this email.
        </p>
      </div>
    </div>
  `;

  return { subject, html };
}

// Swallows all errors internally so a notification failure never breaks checkout.
async function notifyStaffByEmail(order: WooOrderResponse) {
  const recipients = await getStaffNotificationEmails();

  if (!recipients.length) {
    console.warn("[NEW_ORDER_NOTIFICATION] No staff email recipients found");
    return;
  }

  const { subject, html } = buildNewOrderEmail(order);
  const results = await Promise.allSettled(
    recipients.map((recipient) =>
      sendEmail({ recipient, subject, body: html }),
    ),
  );

  for (const [index, result] of results.entries()) {
    if (result.status === "rejected") {
      console.error(
        `[NEW_ORDER_EMAIL_ERROR] Failed to notify ${recipients[index]}:`,
        result.reason,
      );
    }
  }
}

export async function notifyStaffOfNewOrder(
  order: WooOrderResponse,
): Promise<void> {
  if (!order.date_paid) return;

  const results = await Promise.allSettled([
    notifyStaffByEmail(order),
    sendNewOrderWhatsAppNotification(order),
  ]);

  const channels = ["email", "WhatsApp"];
  for (const [index, result] of results.entries()) {
    if (result.status === "rejected") {
      console.error(
        `[NEW_ORDER_NOTIFICATION_ERROR] ${channels[index]} notification failed:`,
        result.reason,
      );
    }
  }
}
