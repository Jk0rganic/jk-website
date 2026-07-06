import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Adapter } from "next-auth/adapters";
import prisma from "@/lib/prisma";

export function CustomPrismaAdapter(): Adapter {
  const adapter = PrismaAdapter(prisma) as any;

  return {
    ...adapter,
    createUser: async (data) => {
      const user = await adapter.createUser({
        ...data,
        role: data.role || "user",
      });
      return user;
    },
  } as Adapter;
}
