import { NextResponse } from "next/server";
import { buildNewOrderEmail } from "@/lib/notifications/notify-new-order";
import { sendEmail } from "@/lib/nodemailer/send-mail";

// Temporary route used to manually verify the admin order-notification email
// template/delivery pipeline. Sends only to the developer's own inbox — does
// NOT query real staff or touch WooCommerce. Not linked from anywhere;
// delete after use.
export async function GET() {
  const fakeOrder: WooOrderResponse = {
    id: 999999,
    status: "processing",
    total: "1700.00",
    currency: "KES",
    currency_symbol: "KSh",
    payment_method: "cod",
    payment_method_title: "Cash on Delivery",
    customer_note: "",
    date_created: new Date().toISOString(),
    date_paid: null,
    date_completed: null,
    needs_payment: false,
    needs_processing: true,
    payment_url: "",
    billing: {
      first_name: "[TEST]",
      last_name: "Ignore this order",
      address_1: "123 River Road",
      city: "Nairobi",
      postcode: "",
      phone: "0712345678",
      email: "test-notification@jkorganics.co.ke",
      country: "KE",
      state: "Nairobi",
    },
    shipping: {
      first_name: "[TEST]",
      last_name: "Ignore this order",
      address_1: "123 River Road",
      city: "Nairobi",
      postcode: "",
      phone: "0712345678",
      country: "KE",
      state: "Nairobi",
    },
    line_items: [
      {
        product_id: 0,
        sku: "TEST-TEA",
        name: "[TEST] Organic Green Tea 250g",
        quantity: 3,
        subtotal: "900.00",
        total: "900.00",
        meta_data: [],
      },
      {
        product_id: 0,
        sku: "TEST-HONEY",
        name: "[TEST] Raw Honey 500ml",
        quantity: 2,
        subtotal: "450.00",
        total: "450.00",
        meta_data: [],
      },
    ],
    shipping_lines: [
      {
        method_id: "flat_rate",
        method_title: "Nairobi door delivery",
        total: "350.00",
      },
    ],
    meta_data: [],
  };

  const { subject, html } = buildNewOrderEmail(fakeOrder);

  await sendEmail({
    recipient: "jthuku490@gmail.com",
    subject: `[TEST] ${subject}`,
    body: html,
  });

  return NextResponse.json({ ok: true, subject });
}
