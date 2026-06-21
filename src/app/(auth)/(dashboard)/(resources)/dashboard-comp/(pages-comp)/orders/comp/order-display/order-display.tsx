import k from "./styles.module.scss";
import type {
  OrderDisplayTone,
  PaymentDisplayTone,
} from "@/lib/checkout/get-order-display";

const orderToneClass: Record<OrderDisplayTone, string> = {
  action: k.tone_action,
  success: k.tone_success,
  progress: k.tone_progress,
  neutral: k.tone_neutral,
  danger: k.tone_danger,
};

const paymentToneClass: Record<PaymentDisplayTone, string> = {
  paid: k.payment_paid,
  due: k.payment_due,
  "on-delivery": k.payment_on_delivery,
  neutral: k.payment_neutral,
};

export function OrderStatusBadge({
  label,
  hint,
  tone,
}: {
  label: string;
  hint?: string;
  tone: OrderDisplayTone;
}) {
  return (
    <div className={k.status_cell}>
      <span className={`${k.badge} ${orderToneClass[tone]}`}>{label}</span>
      {hint ? <span className={k.hint}>{hint}</span> : null}
    </div>
  );
}

export function OrderPaymentBadge({
  label,
  tone,
}: {
  label: string;
  tone: PaymentDisplayTone;
}) {
  if (label === "—") {
    return <span className={k.payment_empty}>—</span>;
  }

  return (
    <span className={`${k.payment_badge} ${paymentToneClass[tone]}`}>
      {label}
    </span>
  );
}
