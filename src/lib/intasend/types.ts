export type IntaSendInvoiceState =
  | "PENDING"
  | "PROCESSING"
  | "FAILED"
  | "CANCELED"
  | "PARTIAL"
  | "COMPLETE"
  | "RETRY";

export interface IntaSendStkPushResponse {
  id: string;
  invoice: IntaSendInvoice;
}

export interface IntaSendInvoice {
  invoice_id: string;
  state: IntaSendInvoiceState;
  provider?: string;
  mpesa_reference?: string;
  api_ref?: string;
  failed_reason?: string | null;
  value?: string;
  currency?: string;
}

export interface IntaSendStatusResponse {
  invoice: IntaSendInvoice;
}

export interface IntaSendWebhookPayload {
  invoice_id: string;
  state: IntaSendInvoiceState;
  provider?: string;
  api_ref?: string;
  mpesa_reference?: string;
  failed_reason?: string | null;
  challenge?: string;
}

export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED";

export function mapIntaSendState(state: IntaSendInvoiceState): PaymentStatus {
  if (state === "COMPLETE") return "SUCCESS";
  if (state === "FAILED" || state === "CANCELED") return "FAILED";
  return "PENDING";
}
