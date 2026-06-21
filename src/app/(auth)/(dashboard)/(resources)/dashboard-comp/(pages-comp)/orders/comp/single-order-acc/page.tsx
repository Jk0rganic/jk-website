import k from "./styles.module.scss";
import { formatPrice } from "@/utils/format-price";
import { maskPhone, maskEmail } from "@/utils/mask";
import OrderPaymentStatusPoller from "@/app/(payment)/payment/comp/order-payment-status-poller";
import {
  OrderPaidBanner,
  PendingPaymentBanner,
} from "../pending-payment/pending-payment";
import { getOrderDisplayInfo } from "@/lib/checkout/get-order-display";
import {
  OrderPaymentBadge,
  OrderStatusBadge,
} from "../order-display/order-display";

export default function SingleOrderAccount({
  order,
}: {
  order: DashboardOrder | null;
}) {
  if (!order)
    return (
      <div className={k.order_details}>
        <p>Order not found.</p>
      </div>
    );

  const {
    date_created,
    status,
    line_items,
    billing,
    total,
    currency,
    payment_method_title,
    payment_method,
    date_paid,
    needs_payment,
  } = order;

  const display = getOrderDisplayInfo({
    status,
    payment_method,
    payment_method_title,
    date_paid,
    needs_payment,
  });

  const orderDate = new Date(date_created).toLocaleDateString();
  const shippingLines = order?.shipping_lines?.[0];
  const shippingTotal = shippingLines?.total || 0;
  const shippingTitle = shippingLines?.method_title || "N/A";
  const subtotal = Number(total) - Number(shippingTotal);

  return (
    <div className={k.order_details}>
      <OrderPaymentStatusPoller
        orderId={order.id}
        orderStatus={status}
        paymentMethodTitle={payment_method_title}
      />

      <div className={k.order_header}>
        <div>
          <h2>Order #{order.id}</h2>
          <p className={k.placed_on}>Placed on {orderDate}</p>
        </div>
        <OrderStatusBadge
          label={display.orderLabel}
          hint={display.orderHint}
          tone={display.orderTone}
        />
      </div>

      {display.awaitingPayment && (
        <PendingPaymentBanner
          orderId={order.id}
          total={total}
          currency={currency}
        />
      )}

      {display.isPaidOnline && status === "processing" && <OrderPaidBanner />}

      <p className={k.summary}>{display.summaryLine}</p>

      <h3>Order details</h3>
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {line_items.map((item) => (
            <tr key={item.id}>
              <td className={k.product_name}>
                {item.name} – {item.quantity}
              </td>
              <td className={k.product_name}>
                <strong>{formatPrice(item.total)}</strong>
              </td>
            </tr>
          ))}
          <tr>
            <td className={k.product_name}>Delivery Location</td>
            <td className={k.product_name}>{shippingTitle}</td>
          </tr>
          <tr>
            <td className={k.product_name}>Delivery fee</td>
            <td className={k.product_name}>{formatPrice(shippingTotal)}</td>
          </tr>

          <tr className={k.total}>
            <td>
              <strong>Subtotal:</strong>
            </td>
            <td>
              <strong>{formatPrice(subtotal)}</strong>
            </td>
          </tr>
          <tr className={k.total}>
            <td>
              <strong>Total:</strong>
            </td>
            <td>
              <strong>{formatPrice(total)}</strong>
            </td>
          </tr>
          <tr>
            <td>
              <strong>Payment method:</strong>
            </td>
            <td>{payment_method_title}</td>
          </tr>
          <tr>
            <td>
              <strong>Payment status:</strong>
            </td>
            <td>
              <OrderPaymentBadge
                label={display.paymentLabel}
                tone={display.paymentTone}
              />
            </td>
          </tr>
        </tbody>
      </table>

      <h3>Billing address</h3>
      <p>
        {billing.first_name} {billing.last_name}
        <br />
        {billing.address_1}
        <br />
        {billing.city}
        <br />
        {billing.state}
        {billing.postcode}
        <br />
        {maskPhone(billing.phone)}
        <br />
        {maskEmail(billing.email)}
      </p>
    </div>
  );
}
