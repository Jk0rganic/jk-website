"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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

export default function AdminSingleOrder({
  order,
}: {
  order: DashboardOrder | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(order?.status ?? "pending");
  const [saving, setSaving] = useState(false);

  if (!order) {
    return <SingleOrderAccount order={null} />;
  }

  const currentOrder = order;

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
      </div>

      <SingleOrderAccount order={currentOrder} variant="admin" />
    </div>
  );
}
