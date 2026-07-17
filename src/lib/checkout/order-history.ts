import type { OrderMeta } from "@/types/checkout/checkout";

export const STATUS_HISTORY_META_KEY = "_jk_status_history";
export const FULFILLMENT_HISTORY_META_KEY = "_jk_fulfillment_history";

export interface OrderHistoryEntry {
  value: string;
  by: string;
  at: string;
}

function parseHistory(
  meta: OrderMeta[] = [],
  key: string,
): OrderHistoryEntry[] {
  const raw = meta.find((item) => item.key === key)?.value;

  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getStatusHistory(meta: OrderMeta[] = []): OrderHistoryEntry[] {
  return parseHistory(meta, STATUS_HISTORY_META_KEY);
}

export function getFulfillmentHistory(
  meta: OrderMeta[] = [],
): OrderHistoryEntry[] {
  return parseHistory(meta, FULFILLMENT_HISTORY_META_KEY);
}

export function buildHistoryMetaEntry(
  meta: OrderMeta[] | undefined,
  key: string,
  entry: OrderHistoryEntry,
): OrderMeta {
  const history = [...parseHistory(meta, key), entry];
  return { key, value: JSON.stringify(history) };
}

export function getAdminIdentity(user: {
  name?: string | null;
  email?: string | null;
}): string {
  return user.name?.trim() || user.email?.trim() || "Unknown admin";
}
