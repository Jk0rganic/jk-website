import OrderPaymentStatusPoller from "@/app/(payment)/payment/comp/order-payment-status-poller";
import { getOrderDisplayInfo } from "@/lib/checkout/get-order-display";
import {
  formatDeliveryTypeLabel,
  getOrderDeliveryInfo,
} from "@/lib/checkout/order-delivery-info";
import { formatPrice } from "@/utils/format-price";
import { maskEmail, maskPhone } from "@/utils/mask";
import {
  OrderPaymentBadge,
  OrderStatusBadge,
} from "../order-display/order-display";
import {
  OrderPaidBanner,
  PendingPaymentBanner,
} from "../pending-payment/pending-payment";
import k from "./styles.module.scss";

export default function SingleOrderAccount({
  order,
  variant = "customer",
}: {
  order: DashboardOrder | null;
  variant?: "customer" | "admin";
}) {
  const isAdmin = variant === "admin";
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
    shipping,
    meta_data,
    customer_note,
  } = order;

  const deliveryInfo = getOrderDeliveryInfo(meta_data);
  const deliveryTypeLabel = formatDeliveryTypeLabel(deliveryInfo.type);
  const deliveryPhone = shipping.phone || billing.phone;
  const deliveryAddress = shipping.address_1 || billing.address_1;
  const deliveryCity = shipping.city || billing.city;
  const deliveryCounty = deliveryInfo.county || shipping.state || billing.state;

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
  const stageIndex =
    status === "completed"
      ? 4
      : status === "processing"
        ? 2
        : status === "cancelled" || status === "refunded"
          ? 1
          : 1;
  const isException = status === "cancelled" || status === "refunded";
  const trackingHeadline =
    status === "completed"
      ? "Delivered"
      : status === "cancelled"
        ? "Order cancelled"
        : status === "refunded"
          ? "Order refunded"
          : status === "processing"
            ? "Being prepared"
            : "Order placed";
  const trackingSub =
    status === "completed"
      ? "Delivered — we hope you enjoy your order!"
      : status === "cancelled"
        ? "This order will not be delivered."
        : status === "refunded"
          ? "This order has been refunded to your original payment method."
          : status === "processing"
            ? "Your items are being picked and packed at our warehouse."
            : "We've received your order and it's queued for packing.";
  const trackingStages = [
    "Placed",
    "Processing",
    "Out for delivery",
    "Delivered",
  ];

  if (!isAdmin) {
    return (
      <div className={`${k.order_details} ${k.tracking_page}`}>
        <OrderPaymentStatusPoller
          orderId={order.id}
          orderStatus={status}
          paymentMethodTitle={payment_method_title}
        />

        <section className={k.tracking_hero}>
          <span className={k.order_kicker}>Order #{order.id}</span>
          <h1>{trackingHeadline}</h1>
          <p>{trackingSub}</p>

          {display.awaitingPayment ? (
            <PendingPaymentBanner
              orderId={order.id}
              total={total}
              currency={currency}
            />
          ) : null}

          {display.isPaidOnline && status === "processing" ? (
            <OrderPaidBanner />
          ) : null}

          <ol className={k.stage_tracker} aria-label="Order progress">
            {trackingStages.map((label, index) => {
              const currentIndex = index + 1;
              const isDone = !isException && currentIndex < stageIndex;
              const isCurrent = !isException && currentIndex === stageIndex;

              return (
                <li
                  className={isDone || isCurrent ? k.stage_active : undefined}
                  key={label}
                >
                  <span>{isDone ? "Done" : currentIndex}</span>
                  <strong>{label}</strong>
                  <small>
                    {currentIndex === 1
                      ? orderDate
                      : currentIndex <= stageIndex && !isException
                        ? "Updated"
                        : "—"}
                  </small>
                </li>
              );
            })}
          </ol>

          {isException ? (
            <div className={k.exception_notice}>
              {status === "cancelled"
                ? "This order was cancelled. Refunds, where applicable, are processed within 3-5 business days."
                : "This order was refunded to the original payment method."}
            </div>
          ) : null}
        </section>

        <section className={k.tracking_grid}>
          <div className={k.tracking_card}>
            <h2>Updates sent to you</h2>
            <div className={k.timeline_list}>
              <article>
                <span>1</span>
                <div>
                  <h3>Order confirmed</h3>
                  <p>
                    We've received order #{order.id} for {formatPrice(total)}.
                  </p>
                  <small>SMS + Email · {orderDate}</small>
                </div>
              </article>
              {stageIndex >= 2 && !isException ? (
                <article>
                  <span>2</span>
                  <div>
                    <h3>Preparing your order</h3>
                    <p>Your items are being picked and packed.</p>
                    <small>SMS · Updated</small>
                  </div>
                </article>
              ) : null}
              {stageIndex >= 3 && !isException ? (
                <article>
                  <span>3</span>
                  <div>
                    <h3>Out for delivery</h3>
                    <p>Your delivery is on the way.</p>
                    <small>SMS + Email · Updated</small>
                  </div>
                </article>
              ) : null}
            </div>
          </div>

          <aside className={k.tracking_card}>
            <h2>Order summary</h2>
            <ul className={k.tracking_items}>
              {line_items.map((item) => (
                <li key={item.id ?? item.product_id}>
                  <span>
                    {item.name} · Qty {item.quantity}
                  </span>
                  <strong>{formatPrice(item.total)}</strong>
                </li>
              ))}
              <li>
                <span>Delivery</span>
                <strong>{formatPrice(shippingTotal)}</strong>
              </li>
              <li className={k.tracking_total}>
                <span>Total</span>
                <strong>{formatPrice(total)}</strong>
              </li>
            </ul>
          </aside>
        </section>
      </div>
    );
  }

  return (
    <div className={k.order_details}>
      {!isAdmin && (
        <OrderPaymentStatusPoller
          orderId={order.id}
          orderStatus={status}
          paymentMethodTitle={payment_method_title}
        />
      )}

      <div className={k.order_header}>
        <div>
          <h2>Order #{order.id}</h2>
          <p className={k.placed_on}>Placed on {orderDate}</p>
        </div>
        <OrderStatusBadge
          label={display.orderLabel}
          hint={isAdmin ? undefined : display.orderHint}
          tone={display.orderTone}
        />
      </div>

      {!isAdmin && display.awaitingPayment && (
        <PendingPaymentBanner
          orderId={order.id}
          total={total}
          currency={currency}
        />
      )}

      {isAdmin && display.awaitingPayment && (
        <div className={k.admin_payment_notice}>
          <strong>Payment outstanding</strong>
          <p>
            The customer has not completed M-Pesa payment for this order. They
            can pay from their account or the payment link sent at checkout.
          </p>
        </div>
      )}

      {!isAdmin && display.isPaidOnline && status === "processing" && (
        <OrderPaidBanner />
      )}

      <p className={k.summary}>
        {isAdmin && display.awaitingPayment
          ? "This order is on hold until the customer pays."
          : display.summaryLine}
      </p>

      {isAdmin ? (
        <section className={k.fulfillment_summary}>
          <h3>Fulfillment details</h3>
          <dl>
            <div>
              <dt>Delivery type</dt>
              <dd>{deliveryTypeLabel || shippingTitle}</dd>
            </div>
            {deliveryCounty ? (
              <div>
                <dt>County</dt>
                <dd>{deliveryCounty}</dd>
              </div>
            ) : null}
            {deliveryInfo.parcelTown ? (
              <div>
                <dt>Town / stage area</dt>
                <dd>{deliveryInfo.parcelTown}</dd>
              </div>
            ) : null}
            {deliveryInfo.parcelOfficeName ? (
              <div>
                <dt>Parcel office</dt>
                <dd>
                  {deliveryInfo.parcelOfficeName}
                  {deliveryInfo.parcelOfficeAddress ? (
                    <>
                      <br />
                      {deliveryInfo.parcelOfficeAddress}
                    </>
                  ) : null}
                </dd>
              </div>
            ) : null}
            {deliveryAddress ? (
              <div>
                <dt>Delivery address</dt>
                <dd>
                  {deliveryAddress}
                  {deliveryCity ? (
                    <>
                      <br />
                      {deliveryCity}
                    </>
                  ) : null}
                </dd>
              </div>
            ) : null}
            {deliveryPhone ? (
              <div>
                <dt>Delivery phone</dt>
                <dd>{deliveryPhone}</dd>
              </div>
            ) : null}
          </dl>
        </section>
      ) : null}

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
            <td className={k.product_name}>Delivery method</td>
            <td className={k.product_name}>
              {deliveryTypeLabel || shippingTitle}
            </td>
          </tr>
          {deliveryInfo.parcelOfficeName ? (
            <tr>
              <td className={k.product_name}>Parcel office</td>
              <td className={k.product_name}>
                {deliveryInfo.parcelOfficeName}
                {deliveryInfo.parcelOfficeAddress ? (
                  <>
                    <br />
                    {deliveryInfo.parcelOfficeAddress}
                  </>
                ) : null}
              </td>
            </tr>
          ) : null}
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

      <h3>{isAdmin ? "Customer details" : "Billing address"}</h3>
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
        {isAdmin ? billing.phone : maskPhone(billing.phone)}
        <br />
        {isAdmin ? billing.email : maskEmail(billing.email)}
      </p>

      {(shipping?.address_1 || deliveryInfo.type === "parcel_office") && (
        <>
          <h3>Delivery address</h3>
          <p>
            {shipping.first_name} {shipping.last_name}
            <br />
            {shipping.address_1}
            <br />
            {shipping.city}
            {shipping.state ? (
              <>
                <br />
                {shipping.state}
              </>
            ) : null}
            <br />
            {isAdmin
              ? shipping.phone
              : maskPhone(shipping.phone || billing.phone)}
          </p>
        </>
      )}

      {customer_note ? (
        <>
          <h3>Delivery notes</h3>
          <p>{customer_note}</p>
        </>
      ) : null}
    </div>
  );
}
