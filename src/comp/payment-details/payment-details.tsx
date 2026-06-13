import { formatPhoneDisplay } from "@/utils/format-phone";
import { formatPrice } from "@/utils/format-price";
import k from "./styles.module.scss";

interface PaymentDetailsProps {
  phone?: string | null;
  amount?: number | null;
  orderId?: string | number | null;
  transactionRef?: string | null;
  provider?: string | null;
  className?: string;
}

function formatProvider(provider?: string | null): string | null {
  if (!provider) return null;
  if (provider === "M-PESA") return "M-Pesa";
  if (provider === "CARD-PAYMENT") return "Card";
  if (provider === "PESALINK") return "Bank (PesaLink)";
  return provider.replace(/-/g, " ");
}

export default function PaymentDetails({
  phone,
  amount,
  orderId,
  transactionRef,
  provider,
  className,
}: PaymentDetailsProps) {
  const displayPhone = formatPhoneDisplay(phone);
  const displayAmount =
    amount != null && !Number.isNaN(amount) ? formatPrice(amount) : "—";
  const displayProvider = formatProvider(provider);

  return (
    <dl className={`${k.details} ${className ?? ""}`}>
      {orderId != null && (
        <div className={k.row}>
          <dt>Order</dt>
          <dd>#{orderId}</dd>
        </div>
      )}
      <div className={k.row}>
        <dt>Phone</dt>
        <dd>{displayPhone}</dd>
      </div>
      <div className={k.row}>
        <dt>Amount</dt>
        <dd className={k.amount}>{displayAmount}</dd>
      </div>
      {displayProvider && (
        <div className={k.row}>
          <dt>Method</dt>
          <dd>{displayProvider}</dd>
        </div>
      )}
      {transactionRef && (
        <div className={k.row}>
          <dt>Reference</dt>
          <dd className={k.receipt}>{transactionRef}</dd>
        </div>
      )}
    </dl>
  );
}
