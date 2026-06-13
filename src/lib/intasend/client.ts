import { getIntaSendConfig } from "./config";
import type {
  IntaSendCheckoutResponse,
  IntaSendStatusResponse,
} from "./types";

export interface CreateCheckoutParams {
  orderId: number;
  amount: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  comment?: string;
}

export async function createCheckout(
  params: CreateCheckoutParams,
): Promise<IntaSendCheckoutResponse> {
  const { publicKey, appUrl, baseUrl } = getIntaSendConfig();

  const res = await fetch(`${baseUrl}/api/v1/checkout/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-IntaSend-Public-API-Key": publicKey,
    },
    body: JSON.stringify({
      first_name: params.firstName,
      last_name: params.lastName,
      email: params.email,
      phone_number: params.phone,
      amount: params.amount.toFixed(2),
      currency: "KES",
      api_ref: `ORD-${params.orderId}`,
      comment: params.comment ?? `Order #${params.orderId}`,
      host: appUrl,
      redirect_url: `${appUrl}/payment?orderId=${params.orderId}`,
      channel: "WEBSITE",
      card_tarrif: "BUSINESS-PAYS",
      mobile_tarrif: "BUSINESS-PAYS",
    }),
    cache: "no-store",
  });

  const data = await res.json();

  if (!res.ok) {
    const message =
      typeof data?.detail === "string"
        ? data.detail
        : data?.message || "Failed to create payment checkout";
    throw new Error(message);
  }

  if (!data?.url || !data?.id) {
    throw new Error("Invalid checkout response from IntaSend");
  }

  return data as IntaSendCheckoutResponse;
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
