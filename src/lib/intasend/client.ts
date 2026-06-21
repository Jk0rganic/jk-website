import { getIntaSendConfig } from "./config";
import type {
  IntaSendStkPushResponse,
  IntaSendStatusResponse,
} from "./types";

export interface InitiateMpesaPaymentParams {
  orderId: number;
  amount: number;
  phone: string;
}

export async function initiateMpesaStkPush(
  params: InitiateMpesaPaymentParams,
): Promise<IntaSendStkPushResponse> {
  const { secretKey, baseUrl } = getIntaSendConfig();

  const res = await fetch(`${baseUrl}/api/v1/payment/mpesa-stk-push/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secretKey}`,
    },
    body: JSON.stringify({
      amount: params.amount.toFixed(2),
      phone_number: params.phone,
      api_ref: `ORD-${params.orderId}`,
      mobile_tarrif: "BUSINESS-PAYS",
    }),
    cache: "no-store",
  });

  const data = await res.json();

  if (!res.ok) {
    const message =
      typeof data?.detail === "string"
        ? data.detail
        : data?.message || "Failed to send M-Pesa payment prompt";
    throw new Error(message);
  }

  if (!data?.invoice?.invoice_id) {
    throw new Error("Invalid M-Pesa STK push response from IntaSend");
  }

  return data as IntaSendStkPushResponse;
}

export async function getPaymentStatus(
  invoiceId: string,
): Promise<IntaSendStatusResponse> {
  const { secretKey, baseUrl } = getIntaSendConfig();

  const res = await fetch(`${baseUrl}/api/v1/payment/status/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secretKey}`,
    },
    body: JSON.stringify({ invoice_id: invoiceId }),
    cache: "no-store",
  });

  const data = await res.json();

  if (!res.ok) {
    const message =
      typeof data?.detail === "string"
        ? data.detail
        : data?.message || "Failed to check payment status";
    throw new Error(message);
  }

  return data as IntaSendStatusResponse;
}

export async function getPaymentStatusByCheckoutId(
  checkoutId: string,
): Promise<IntaSendStatusResponse> {
  const { secretKey, baseUrl } = getIntaSendConfig();

  const res = await fetch(`${baseUrl}/api/v1/payment/status/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secretKey}`,
    },
    body: JSON.stringify({ checkout_id: checkoutId }),
    cache: "no-store",
  });

  const data = await res.json();

  if (!res.ok) {
    const message =
      typeof data?.detail === "string"
        ? data.detail
        : data?.message || "Failed to check payment status";
    throw new Error(message);
  }

  return data as IntaSendStatusResponse;
}
