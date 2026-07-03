import { fetchWoo } from "./fetchRest";

export interface WooOrderNote {
  id: number;
  note: string;
  customer_note: boolean;
  date_created?: string;
  date_created_gmt?: string;
  added_by?: string;
}

export interface CreateOrderNoteInput {
  note: string;
  customerNote?: boolean;
}

export async function fetchOrderNotes(orderId: number) {
  return fetchWoo<WooOrderNote[]>(`orders/${orderId}/notes`, {
    noCache: true,
  });
}

export async function createOrderNote(
  orderId: number,
  input: CreateOrderNoteInput,
) {
  return fetchWoo<WooOrderNote>(`orders/${orderId}/notes`, {
    method: "POST",
    body: {
      note: input.note,
      customer_note: Boolean(input.customerNote),
    },
    noCache: true,
  });
}
