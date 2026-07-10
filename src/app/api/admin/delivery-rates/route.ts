import { requireAdminSession } from "@/lib/admin/require-admin";
import { DEFAULT_DELIVERY_RATES } from "@/lib/delivery/delivery-quote";
import prisma from "@/lib/prisma";

type DeliveryRateClient = typeof prisma & {
  deliveryRate: {
    createMany: (args: {
      data: Array<{
        code: string;
        label: string;
        fulfillmentType: string;
        counties: string[];
        fee: number;
        freeAbove: number | null;
        eta: string;
        active: boolean;
        sortOrder: number;
      }>;
      skipDuplicates: true;
    }) => Promise<unknown>;
    findMany: (args: {
      orderBy: Array<{ sortOrder: "asc" } | { label: "asc" }>;
    }) => Promise<unknown[]>;
    update: (args: {
      where: { id: string };
      data: {
        fee: number;
        freeAbove: number | null;
        eta: string;
        active: boolean;
      };
    }) => Promise<unknown>;
  };
};

const deliveryRate = (prisma as DeliveryRateClient).deliveryRate;

export async function GET() {
  const { error, status } = await requireAdminSession();

  if (error) {
    return Response.json({ error }, { status });
  }

  try {
    await deliveryRate.createMany({
      data: DEFAULT_DELIVERY_RATES.map((rate, index) => ({
        code: rate.code,
        label: rate.label,
        fulfillmentType: rate.fulfillmentType,
        counties: rate.counties ?? [],
        fee: rate.fee,
        freeAbove: rate.freeAbove ?? null,
        eta: rate.eta,
        active: true,
        sortOrder: index + 1,
      })),
      skipDuplicates: true,
    });

    const rates = await deliveryRate.findMany({
      orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
    });

    return Response.json({ rates });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch delivery rates";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const { error, status } = await requireAdminSession();

  if (error) {
    return Response.json({ error }, { status });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = parseDeliveryRateUpdate(body);

  if (!parsed.valid) {
    return Response.json(
      { error: "Invalid delivery rate data" },
      { status: 400 },
    );
  }

  try {
    const rate = await deliveryRate.update({
      where: { id: parsed.data.id },
      data: {
        fee: parsed.data.fee,
        freeAbove: parsed.data.freeAbove,
        eta: parsed.data.eta,
        active: parsed.data.active,
      },
    });

    return Response.json({ rate });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update delivery rate";
    return Response.json({ error: message }, { status: 500 });
  }
}

function parseDeliveryRateUpdate(body: unknown):
  | {
      valid: true;
      data: {
        id: string;
        fee: number;
        freeAbove: number | null;
        eta: string;
        active: boolean;
      };
    }
  | { valid: false } {
  if (!body || typeof body !== "object") {
    return { valid: false };
  }

  const value = body as Record<string, unknown>;
  const fee = value.fee;
  const eta = typeof value.eta === "string" ? value.eta.trim() : "";
  const freeAbove = normalizeNullableInteger(value.freeAbove);

  if (
    typeof value.id !== "string" ||
    !value.id.trim() ||
    typeof fee !== "number" ||
    !Number.isInteger(fee) ||
    fee < 0 ||
    freeAbove === undefined ||
    (typeof freeAbove === "number" && freeAbove < 1) ||
    !eta ||
    typeof value.active !== "boolean"
  ) {
    return { valid: false };
  }

  return {
    valid: true,
    data: {
      id: value.id.trim(),
      fee,
      freeAbove,
      eta,
      active: value.active,
    },
  };
}

function normalizeNullableInteger(value: unknown): number | null | undefined {
  if (value === null || value === "") {
    return null;
  }

  if (typeof value !== "number" || !Number.isInteger(value)) {
    return undefined;
  }

  return value;
}
