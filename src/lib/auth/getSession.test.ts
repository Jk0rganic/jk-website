import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("react", () => ({
  cache: (callback: unknown) => callback,
}));

vi.mock("./action/auth/auth", () => ({
  auth: vi.fn(),
}));

import { auth } from "./action/auth/auth";
import { getSession } from "./getSession";

const mockedAuth = vi.mocked(auth);

describe("getSession", () => {
  beforeEach(() => {
    mockedAuth.mockReset();
  });

  it("keeps admin status fields from the auth session", async () => {
    const disabledAt = new Date("2026-02-01");
    const deletedAt = new Date("2026-03-01");

    mockedAuth.mockResolvedValue({
      user: {
        id: "1",
        email: "admin@jkorganics.com",
        role: "min_admin",
        disabledAt,
        deletedAt,
      },
      expires: "2026-04-01T00:00:00.000Z",
    });

    await expect(getSession()).resolves.toEqual({
      user: {
        id: "1",
        email: "admin@jkorganics.com",
        role: "min_admin",
        name: undefined,
        image: undefined,
        disabledAt,
        deletedAt,
      },
    });
  });
});
