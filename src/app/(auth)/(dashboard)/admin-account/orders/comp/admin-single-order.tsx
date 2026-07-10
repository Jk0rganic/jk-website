"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getOrderDisplayInfo } from "@/lib/checkout/get-order-display";
import { isOrderAwaitingPayment } from "@/lib/checkout/is-order-awaiting-payment";
import { formatDate } from "@/utils/formatDate";
import SingleOrderAccount from "../../../(resources)/dashboard-comp/(pages-comp)/orders/comp/single-order-acc/page";
import { AdminBadge } from "../../components/ui/admin-badge";
import { AdminPanel } from "../../components/ui/admin-panel";
import { PageHeader } from "../../components/ui/page-header";
import k from "./admin-single-order-styles.module.scss";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "on-hold", label: "On hold" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "refunded", label: "Refunded" },
];

interface AdminOrderNote {
  id: number;
  note: string;
  customer_note: boolean;
  date_created?: string;
  added_by?: string;
}

type BadgeTone = "success" | "info" | "warning" | "danger" | "neutral";

function orderBadgeTone(status: string): BadgeTone {
  switch (status) {
    case "completed":
      return "success";
    case "processing":
      return "info";
    case "pending":
    case "on-hold":
      return "warning";
    case "cancelled":
    case "refunded":
      return "danger";
    default:
      return "neutral";
  }
}

function paymentBadgeTone(order: DashboardOrder): BadgeTone {
  if (order.date_paid) return "success";
  if (order.payment_method === "cod") return "info";
  return "warning";
}

function getCustomerName(order: DashboardOrder) {
  return [order.billing?.first_name, order.billing?.last_name]
    .filter(Boolean)
    .join(" ");
}

function formatAddress(address?: Partial<BillingAddress | ShippingAddress>) {
  return [
    address?.address_1,
    address?.city,
    address?.state,
    address?.postcode,
    address?.country,
  ]
    .filter(Boolean)
    .join(", ");
}

function getDeliverySummary(order: DashboardOrder) {
  return {
    method:
      order.shipping_lines?.[0]?.method_title || "Delivery method not set",
    location:
      [
        order.shipping?.city || order.billing?.city,
        order.shipping?.state || order.billing?.state,
      ]
        .filter(Boolean)
        .join(", ") || "Location not set",
    address: formatAddress(order.shipping) || formatAddress(order.billing),
  };
}

export default function AdminSingleOrder({
  order,
}: {
  order: DashboardOrder | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(order?.status ?? "pending");
  const [saving, setSaving] = useState(false);
  const [paymentPromptSending, setPaymentPromptSending] = useState(false);
  const [markPaidSaving, setMarkPaidSaving] = useState(false);
  const [transactionRef, setTransactionRef] = useState("");
  const [manualPaymentNote, setManualPaymentNote] = useState("");
  const [notes, setNotes] = useState<AdminOrderNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [noteSaving, setNoteSaving] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [customerNote, setCustomerNote] = useState(false);

  useEffect(() => {
    setStatus(order?.status ?? "pending");
  }, [order?.status]);

  useEffect(() => {
    if (!order?.id) return;

    let active = true;
    const orderId = order.id;

    async function loadNotes() {
      setNotesLoading(true);

      try {
        const res = await fetch(`/api/admin/orders/${orderId}/notes`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load order notes");
        }

        if (active) {
          setNotes(data.notes ?? []);
        }
      } catch (err) {
        if (active) {
          toast.error(
            err instanceof Error ? err.message : "Failed to load order notes",
          );
        }
      } finally {
        if (active) {
          setNotesLoading(false);
        }
      }
    }

    loadNotes();

    return () => {
      active = false;
    };
  }, [order?.id]);

  if (!order) {
    return <SingleOrderAccount order={null} />;
  }

  const currentOrder = order;
  const canPromptPayment = isOrderAwaitingPayment(currentOrder);
  const display = getOrderDisplayInfo(currentOrder);
  const customerName = getCustomerName(currentOrder);
  const delivery = getDeliverySummary(currentOrder);

  async function handleStatusUpdate() {
    if (status === currentOrder.status) return;

    setSaving(true);

    try {
      const res = await fetch(`/api/admin/orders/${currentOrder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update order");
      }

      toast.success(`Order #${currentOrder.id} updated to ${status}`);
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update order",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handlePaymentPrompt() {
    setPaymentPromptSending(true);

    try {
      const res = await fetch(
        `/api/admin/orders/${currentOrder.id}/payment-prompt`,
        { method: "POST" },
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send payment prompt");
      }

      toast.success(`M-Pesa prompt sent for order #${data.orderId}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to send payment prompt",
      );
    } finally {
      setPaymentPromptSending(false);
    }
  }

  async function handleMarkPaid(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!transactionRef.trim()) {
      toast.error("Enter the payment reference");
      return;
    }

    setMarkPaidSaving(true);

    try {
      const res = await fetch(
        `/api/admin/orders/${currentOrder.id}/mark-paid`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transactionRef,
            note: manualPaymentNote,
          }),
        },
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to mark order paid");
      }

      toast.success(`Order #${currentOrder.id} marked paid`);
      setTransactionRef("");
      setManualPaymentNote("");
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to mark order paid",
      );
    } finally {
      setMarkPaidSaving(false);
    }
  }

  async function handleAddNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!newNote.trim()) {
      toast.error("Enter a note");
      return;
    }

    setNoteSaving(true);

    try {
      const res = await fetch(`/api/admin/orders/${currentOrder.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: newNote, customerNote }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to add order note");
      }

      setNotes((current) => [data.note, ...current]);
      setNewNote("");
      setCustomerNote(false);
      toast.success("Order note added");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add note");
    } finally {
      setNoteSaving(false);
    }
  }

  return (
    <div className={k.wrapper}>
      <PageHeader
        title={`Order #${currentOrder.id}`}
        subtitle={`${customerName || "Guest customer"} · ${formatDate(
          currentOrder.date_created,
        )}`}
      />

      <div className={k.detailGrid}>
        <main className={k.mainColumn}>
          <AdminPanel
            title="Order and customer"
            description="Contact details, delivery destination, and fulfillment notes."
          >
            <div className={k.summaryGrid}>
              <div>
                <span>Customer</span>
                <strong>{customerName || "Guest customer"}</strong>
                <p>{currentOrder.billing?.email || "No email"}</p>
                <p>{currentOrder.billing?.phone || "No phone"}</p>
              </div>
              <div>
                <span>Delivery</span>
                <strong>{delivery.location}</strong>
                <p>{delivery.method}</p>
                <p>{delivery.address || "No address supplied"}</p>
              </div>
              <div>
                <span>Items</span>
                <strong>{currentOrder.line_items?.length ?? 0}</strong>
                <p>
                  {(currentOrder.line_items ?? [])
                    .slice(0, 3)
                    .map((item) => item.name)
                    .join(", ") || "No line items"}
                </p>
              </div>
            </div>

            <div className={k.customerNote}>
              <span>Customer checkout note</span>
              <p>
                {currentOrder.customer_note || "No customer note supplied."}
              </p>
            </div>
          </AdminPanel>

          <AdminPanel
            title="Fulfillment notes"
            description="Private admin notes and customer-facing updates."
            action={
              notesLoading ? <span className={k.loading}>Loading…</span> : null
            }
          >
            <form className={k.noteForm} onSubmit={handleAddNote}>
              <textarea
                value={newNote}
                onChange={(event) => setNewNote(event.target.value)}
                placeholder="Add a note about fulfillment, payment, or customer contact"
                rows={3}
                disabled={noteSaving}
              />
              <div className={k.noteFormFooter}>
                <label className={k.checkbox}>
                  <input
                    type="checkbox"
                    checked={customerNote}
                    onChange={(event) => setCustomerNote(event.target.checked)}
                    disabled={noteSaving}
                  />
                  Customer note
                </label>
                <button type="submit" disabled={noteSaving || !newNote.trim()}>
                  {noteSaving ? "Adding…" : "Add note"}
                </button>
              </div>
            </form>
            <div className={k.notesList}>
              {!notesLoading && notes.length === 0 && (
                <p className={k.empty}>No notes yet.</p>
              )}
              {notes.map((note) => (
                <article key={note.id} className={k.noteItem}>
                  <div className={k.noteMeta}>
                    <span>{note.customer_note ? "Customer" : "Private"}</span>
                    {note.date_created && (
                      <time dateTime={note.date_created}>
                        {new Date(note.date_created).toLocaleString()}
                      </time>
                    )}
                  </div>
                  <p>{note.note}</p>
                </article>
              ))}
            </div>
          </AdminPanel>
        </main>

        <aside className={k.sideColumn} aria-label="Order controls">
          <AdminPanel title="Status and payment">
            <div className={k.sideSummary}>
              <div>
                <span>Status</span>
                <AdminBadge tone={orderBadgeTone(currentOrder.status)}>
                  {display.orderLabel}
                </AdminBadge>
                {display.orderHint && <p>{display.orderHint}</p>}
              </div>
              <div>
                <span>Payment</span>
                <AdminBadge tone={paymentBadgeTone(currentOrder)}>
                  {display.paymentLabel || currentOrder.payment_method_title}
                </AdminBadge>
                <p>{currentOrder.date_paid ? "Paid" : "No paid date"}</p>
              </div>
              <div>
                <span>Total</span>
                <strong>
                  {currentOrder.total} {currentOrder.currency}
                </strong>
              </div>
            </div>
          </AdminPanel>

          <AdminPanel title="Quick actions">
            <div className={k.statusControl}>
              <label htmlFor="order-status">Order status</label>
              <select
                id="order-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={saving}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleStatusUpdate}
                disabled={saving || status === currentOrder.status}
              >
                {saving ? "Saving…" : "Update status"}
              </button>
            </div>

            {canPromptPayment && (
              <div className={k.quickAction}>
                <div>
                  <strong>Payment prompt</strong>
                  <p>Send a fresh M-Pesa STK prompt to the billing phone.</p>
                </div>
                <button
                  type="button"
                  onClick={handlePaymentPrompt}
                  disabled={paymentPromptSending}
                >
                  {paymentPromptSending ? "Sending…" : "Send M-Pesa prompt"}
                </button>
              </div>
            )}

            <form className={k.quickForm} onSubmit={handleMarkPaid}>
              <div>
                <strong>Mark paid manually</strong>
                <p>Use this after confirming payment outside automatic sync.</p>
              </div>
              <div className={k.formGrid}>
                <label>
                  Reference
                  <input
                    value={transactionRef}
                    onChange={(event) => setTransactionRef(event.target.value)}
                    placeholder="M-Pesa transaction ref"
                    disabled={markPaidSaving}
                  />
                </label>
                <label>
                  Note
                  <input
                    value={manualPaymentNote}
                    onChange={(event) =>
                      setManualPaymentNote(event.target.value)
                    }
                    placeholder="Optional internal note"
                    disabled={markPaidSaving}
                  />
                </label>
                <button
                  type="submit"
                  disabled={markPaidSaving || !transactionRef.trim()}
                >
                  {markPaidSaving ? "Saving…" : "Mark paid"}
                </button>
              </div>
            </form>
          </AdminPanel>
        </aside>
      </div>

      <SingleOrderAccount order={currentOrder} variant="admin" />
    </div>
  );
}
