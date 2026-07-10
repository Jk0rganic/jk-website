import { cache } from "react";
import { auth } from "./action/auth/auth";

export type SessionUser = {
  id: string;
  email: string;
  role: string;
  authVersion?: number;
  name?: string;
  image?: string;
  disabledAt?: Date | string | null;
  deletedAt?: Date | string | null;
};

export type Session = {
  user: SessionUser;
};

const cachedAuth = cache(async (): Promise<Session | null> => {
  const session = await auth();

  if (!session?.user?.id) return null;

  return {
    user: {
      id: session.user.id,
      email: session.user.email || "",
      role: session.user.role,
      authVersion: session.user.authVersion,
      name: session.user.name,
      image: session.user.image,
      disabledAt: session.user.disabledAt,
      deletedAt: session.user.deletedAt,
    },
  };
});

export async function getSession(): Promise<Session | null> {
  return cachedAuth();
}

export default cachedAuth;
