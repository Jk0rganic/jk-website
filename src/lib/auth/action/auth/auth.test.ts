import { beforeEach, describe, expect, it, vi } from "vitest";

type AdminStatusValue = Date | string | null | undefined;

type AuthTestUser = {
  id?: string;
  email?: string;
  name?: string;
  password?: string;
  role?: string;
  disabledAt?: AdminStatusValue;
  deletedAt?: AdminStatusValue;
};

type AuthTestToken = {
  id?: string;
  role?: string;
  disabledAt?: AdminStatusValue;
  deletedAt?: AdminStatusValue;
};

type AuthTestSession = {
  user?: AuthTestUser;
};

const nextAuthConfig = vi.hoisted(() => ({
  current: null as null | {
    callbacks: {
      jwt: (args: {
        token: AuthTestToken;
        user?: AuthTestUser;
      }) => Promise<AuthTestToken>;
      session: (args: {
        session: AuthTestSession;
        token: AuthTestToken;
      }) => Promise<AuthTestSession>;
    };
    providers: Array<{
      name: string;
      authorize?: (credentials: {
        email?: string;
        password?: string;
      }) => Promise<AuthTestUser | null>;
    }>;
  },
}));

const getCredentialUserMock = vi.hoisted(() => vi.fn());
const handleLoginAttemptMock = vi.hoisted(() => vi.fn());

vi.mock("next-auth", () => ({
  default: vi.fn((config) => {
    nextAuthConfig.current = config;

    return {
      handlers: {},
      signIn: vi.fn(),
      signOut: vi.fn(),
      auth: vi.fn(),
    };
  }),
}));

vi.mock("next-auth/providers/google", () => ({
  default: vi.fn((config) => ({ name: "Google", config })),
}));

vi.mock("next-auth/providers/credentials", () => ({
  default: vi.fn((config) => ({ name: "Credentials", ...config })),
}));

vi.mock("./custom-adapter", () => ({
  CustomPrismaAdapter: vi.fn(() => ({})),
}));

vi.mock("../getUserWithAccounts", () => ({
  getCredentialUser: getCredentialUserMock,
}));

vi.mock("../action", () => ({
  handleLoginAttempt: handleLoginAttemptMock,
}));

describe("NextAuth admin status propagation", () => {
  beforeEach(async () => {
    vi.resetModules();
    nextAuthConfig.current = null;
    getCredentialUserMock.mockReset();
    handleLoginAttemptMock.mockReset();

    await import("./auth");
  });

  it("persists admin status fields from user to jwt to session", async () => {
    const disabledAt = new Date("2026-02-01");
    const deletedAt = new Date("2026-03-01");

    const token = await nextAuthConfig.current?.callbacks.jwt({
      token: {},
      user: {
        id: "1",
        role: "min_admin",
        disabledAt,
        deletedAt,
      },
    });

    expect(token).toMatchObject({
      id: "1",
      role: "min_admin",
      disabledAt,
      deletedAt,
    });

    const session = await nextAuthConfig.current?.callbacks.session({
      session: { user: {} },
      token,
    });

    expect(session.user).toMatchObject({
      id: "1",
      role: "min_admin",
      disabledAt,
      deletedAt,
    });
  });

  it("returns admin status fields from credential authorize", async () => {
    const disabledAt = new Date("2026-02-01");
    const deletedAt = null;

    getCredentialUserMock.mockResolvedValue({
      id: "1",
      email: "admin@jkorganics.com",
      name: "Admin",
      password: "hash",
      role: "min_admin",
      disabledAt,
      deletedAt,
    });
    handleLoginAttemptMock.mockResolvedValue({
      success: true,
      message: "Login successful!",
    });

    const credentialsProvider = nextAuthConfig.current?.providers.find(
      (provider) => provider.name === "Credentials",
    );

    await expect(
      credentialsProvider?.authorize?.({
        email: "admin@jkorganics.com",
        password: "password",
      }),
    ).resolves.toMatchObject({
      id: "1",
      email: "admin@jkorganics.com",
      name: "Admin",
      role: "min_admin",
      disabledAt,
      deletedAt,
    });
  });
});
