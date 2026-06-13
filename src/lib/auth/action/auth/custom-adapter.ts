import prisma from "@/lib/prisma";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { Adapter } from "next-auth/adapters";

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
