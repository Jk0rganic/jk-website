"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminCard, PageHeader } from "../components/ui/page-header";
import k from "./styles.module.scss";

type DeliveryRate = {
  id: string;
  code: string;
  label: string;
  description: string | null;
  fulfillmentType: string;
  counties: string[];
  towns: string[];
  fee: number;
  freeAbove: number | null;
  eta: string;
  active: boolean;
  sortOrder: number;
};

type DeliveryRateDraft = {
  fee: string;
  freeAbove: string;
  eta: string;
  active: boolean;
};

export default function DeliveryRatesPage() {
  const [rates, setRates] = useState<DeliveryRate[]>([]);
  const [drafts, setDrafts] = useState<Record<string, DeliveryRateDraft>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const loadRates = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/delivery-rates");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load delivery rates");
      }

      setRates(data.rates);
      setDrafts(Object.fromEntries(data.rates.map(toDraftEntry)));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load delivery rates",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRates();
  }, [loadRates]);

  function updateDraft(
    id: string,
    field: keyof DeliveryRateDraft,
    value: string | boolean,
  ) {
    setDrafts((current) => ({
      ...current,
      [id]: {
        ...current[id],
        [field]: value,
      },
    }));
  }

  async function saveRate(rate: DeliveryRate) {
    const draft = drafts[rate.id];

    if (!draft) {
      return;
    }

    const payload = {
      id: rate.id,
      fee: Number(draft.fee),
      freeAbove: draft.freeAbove === "" ? null : Number(draft.freeAbove),
      eta: draft.eta.trim(),
      active: draft.active,
    };

    setSavingId(rate.id);

    try {
      const res = await fetch("/api/admin/delivery-rates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update delivery rate");
      }

      setRates((current) =>
        current.map((item) => (item.id === rate.id ? data.rate : item)),
      );
      setDrafts((current) => ({
        ...current,
        [rate.id]: toDraft(data.rate),
      }));
      toast.success(`${rate.label} updated`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update delivery rate",
      );
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className={k.page}>
      <PageHeader
        title="Delivery rates"
        subtitle="Manage checkout delivery fees, free delivery thresholds, ETA copy, and availability."
      />

      <AdminCard title="Rates">
        {loading && <p className={k.muted}>Loading delivery rates...</p>}
        {error && <p className={k.error}>{error}</p>}
        {!loading && !error && rates.length === 0 && (
          <p className={k.muted}>No delivery rates have been configured.</p>
        )}
        {!loading && !error && rates.length > 0 && (
          <div className={k.tableWrap}>
            <table className={k.table}>
              <thead>
                <tr>
                  <th scope="col">Method</th>
                  <th scope="col">Fee</th>
                  <th scope="col">Free above</th>
                  <th scope="col">ETA</th>
                  <th scope="col">Active</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rates.map((rate) => {
                  const draft = drafts[rate.id] ?? toDraft(rate);

                  return (
                    <tr key={rate.id}>
                      <th scope="row">
                        <span className={k.rateLabel}>{rate.label}</span>
                        <span className={k.rateCode}>{rate.code}</span>
                      </th>
                      <td>
                        <label className={k.field}>
                          <span>Fee</span>
                          <input
                            aria-label={`Fee for ${rate.label}`}
                            type="number"
                            min="0"
                            value={draft.fee}
                            onChange={(event) =>
                              updateDraft(rate.id, "fee", event.target.value)
                            }
                          />
                        </label>
                      </td>
                      <td>
                        <label className={k.field}>
                          <span>Free above</span>
                          <input
                            aria-label={`Free above for ${rate.label}`}
                            type="number"
                            min="1"
                            value={draft.freeAbove}
                            onChange={(event) =>
                              updateDraft(
                                rate.id,
                                "freeAbove",
                                event.target.value,
                              )
                            }
                          />
                        </label>
                      </td>
                      <td>
                        <label className={k.field}>
                          <span>ETA</span>
                          <input
                            aria-label={`ETA for ${rate.label}`}
                            type="text"
                            value={draft.eta}
                            onChange={(event) =>
                              updateDraft(rate.id, "eta", event.target.value)
                            }
                          />
                        </label>
                      </td>
                      <td>
                        <label className={k.checkField}>
                          <input
                            aria-label={`Active for ${rate.label}`}
                            type="checkbox"
                            checked={draft.active}
                            onChange={(event) =>
                              updateDraft(
                                rate.id,
                                "active",
                                event.target.checked,
                              )
                            }
                          />
                          <span>{draft.active ? "Active" : "Inactive"}</span>
                        </label>
                      </td>
                      <td>
                        <button
                          className={k.saveButton}
                          type="button"
                          disabled={savingId === rate.id}
                          onClick={() => saveRate(rate)}
                        >
                          {savingId === rate.id ? "Saving..." : "Save"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>
    </div>
  );
}

function toDraftEntry(rate: DeliveryRate): [string, DeliveryRateDraft] {
  return [rate.id, toDraft(rate)];
}

function toDraft(rate: DeliveryRate): DeliveryRateDraft {
  return {
    fee: String(rate.fee),
    freeAbove: rate.freeAbove === null ? "" : String(rate.freeAbove),
    eta: rate.eta,
    active: rate.active,
  };
}
