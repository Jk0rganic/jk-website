import "server-only";
import prisma from "@/lib/prisma";
import type { DeliveryAdminRate } from "./delivery-quote";

type DeliveryRateRow = {
  code: string;
  label: string;
  fee: number;
  eta: string;
  fulfillmentType: string;
  active: boolean;
  counties: string[];
  freeAbove: number | null;
};

export async function listActiveDeliveryAdminRates(): Promise<
  DeliveryAdminRate[]
> {
  const rows = await prisma.deliveryRate.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
    select: {
      code: true,
      label: true,
      fee: true,
      eta: true,
      fulfillmentType: true,
      active: true,
      counties: true,
      freeAbove: true,
    },
  });

  return (rows as DeliveryRateRow[])
    .map(mapDeliveryRateRow)
    .filter((rate): rate is DeliveryAdminRate => rate !== null);
}

function mapDeliveryRateRow(row: DeliveryRateRow): DeliveryAdminRate | null {
  if (!isDeliveryFulfillmentType(row.fulfillmentType)) {
    return null;
  }

  return {
    code: row.code,
    label: row.label,
    fee: row.fee,
    eta: row.eta,
    fulfillmentType: row.fulfillmentType,
    active: row.active,
    counties: row.counties,
    ...(row.freeAbove !== null ? { freeAbove: row.freeAbove } : {}),
  };
}

function isDeliveryFulfillmentType(
  value: string,
): value is DeliveryAdminRate["fulfillmentType"] {
  return (
    value === "doorstep" || value === "courier-office" || value === "stage"
  );
}
