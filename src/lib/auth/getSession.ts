import { auth } from "./action/auth/auth";
import { cache } from "react";

export type SessionUser = {
  email: string;
  role: string;
  name?: string;
  image?: string;
};

export type Session = {
  user: SessionUser;
};

const cachedAuth = cache(async (): Promise<Session | null> => {
  const session = await auth();

  if (!session?.user) return null;

  return {
    user: {
      email: session.user.email || "",
      role: session.user.role,
      name: session.user.name,
      image: session.user.image,
    },
  };
});

export async function getSession(): Promise<Session | null> {
  return cachedAuth();
}

export default cachedAuth;
