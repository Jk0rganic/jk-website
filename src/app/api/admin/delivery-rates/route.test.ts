import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/admin/require-admin", () => ({
  requireAdminSession: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    deliveryRate: {
      createMany: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { requireAdminSession } from "@/lib/admin/require-admin";
import prisma from "@/lib/prisma";
import { GET, PATCH } from "./route";

const mockedRequireAdminSession = vi.mocked(requireAdminSession);
const deliveryRate = vi.mocked(
  (
    prisma as unknown as {
      deliveryRate: {
        findMany: ReturnType<typeof vi.fn>;
        createMany: ReturnType<typeof vi.fn>;
        update: ReturnType<typeof vi.fn>;
      };
    }
  ).deliveryRate,
);

describe("/api/admin/delivery-rates", () => {
  beforeEach(() => {
    mockedRequireAdminSession.mockReset();
    deliveryRate.createMany.mockReset();
    deliveryRate.findMany.mockReset();
    deliveryRate.update.mockReset();
    mockedRequireAdminSession.mockResolvedValue({
      error: null,
      status: 200,
      session: {
        user: { id: "admin-1", email: "admin@jk.test", role: "min_admin" },
      },
    } as never);
  });

  it("requires an admin session before listing delivery rates", async () => {
    mockedRequireAdminSession.mockResolvedValue({
      error: "Unauthorized",
      status: 401,
      session: null,
    } as never);

    const response = await GET();

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized" });
    expect(deliveryRate.findMany).not.toHaveBeenCalled();
  });

  it("lists delivery rates in configured order", async () => {
    const rates = [
      rate({ id: "rate-1", label: "Nairobi Door Delivery", sortOrder: 1 }),
      rate({ id: "rate-2", label: "Parcel Office", sortOrder: 2 }),
    ];
    deliveryRate.findMany.mockResolvedValue(rates);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ rates });
    expect(deliveryRate.createMany).toHaveBeenCalledWith(
      expect.objectContaining({ skipDuplicates: true }),
    );
    expect(deliveryRate.findMany).toHaveBeenCalledWith({
      orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
    });
  });

  it("updates the editable delivery-rate fields", async () => {
    const updated = rate({
      id: "rate-1",
      fee: 350,
      freeAbove: 7000,
      eta: "Same day",
      active: false,
    });
    deliveryRate.update.mockResolvedValue(updated);

    const response = await PATCH(
      new Request("http://test.local/api/admin/delivery-rates", {
        method: "PATCH",
        body: JSON.stringify({
          id: "rate-1",
          fee: 350,
          freeAbove: 7000,
          eta: " Same day ",
          active: false,
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ rate: updated });
    expect(deliveryRate.update).toHaveBeenCalledWith({
      where: { id: "rate-1" },
      data: {
        fee: 350,
        freeAbove: 7000,
        eta: "Same day",
        active: false,
      },
    });
  });

  it("rejects invalid update payloads before touching the database", async () => {
    const response = await PATCH(
      new Request("http://test.local/api/admin/delivery-rates", {
        method: "PATCH",
        body: JSON.stringify({
          id: "rate-1",
          fee: -1,
          freeAbove: 0,
          eta: "",
          active: true,
        }),
      }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: "Invalid delivery rate data",
    });
    expect(deliveryRate.update).not.toHaveBeenCalled();
  });
});

function rate(
  overrides: Partial<{
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
  }> = {},
) {
  return {
    id: "rate-1",
    code: "nairobi-door",
    label: "Nairobi Door Delivery",
    description: "Door delivery in Nairobi",
    fulfillmentType: "door_delivery",
    counties: ["Nairobi"],
    towns: [],
    fee: 300,
    freeAbove: 5000,
    eta: "Same day to 24 hours",
    active: true,
    sortOrder: 1,
    ...overrides,
  };
}
