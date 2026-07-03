"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { isOrderAwaitingPayment } from "@/lib/checkout/is-order-awaiting-payment";
import SingleOrderAccount from "../../../(resources)/dashboard-comp/(pages-comp)/orders/comp/single-order-acc/page";
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
      <div className={k.actions}>
        <h3>Admin actions</h3>
        <div className={k.row}>
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
                onChange={(event) => setManualPaymentNote(event.target.value)}
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
      </div>

      <div className={k.notesPanel}>
        <div className={k.notesHeader}>
          <h3>Order notes</h3>
          {notesLoading && <span>Loading…</span>}
        </div>
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
      </div>

      <SingleOrderAccount order={currentOrder} variant="admin" />
    </div>
  );
}
