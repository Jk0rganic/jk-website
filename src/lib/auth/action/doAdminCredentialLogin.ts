"use server";

import { revalidatePath } from "next/cache";
import { AuthError } from "next-auth";
import { isAdminRole } from "@/lib/admin/roles";
import { getAdminCallbackUrl } from "@/lib/auth/admin-login";
import prisma from "@/lib/prisma";
import { auth, signIn, signOut } from "./auth/auth";

function isMissingAdminStatusColumnError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /auth_version|disabled_at|deleted_at/.test(message);
}

interface LoginInput {
  email: string;
  password: string;
  callbackUrl?: string;
}

interface AdminLoginResult {
  success?: boolean;
  error?: string;
  redirectTo?: string;
}

export async function doAdminCredentialLogin(
  data: LoginInput,
): Promise<AdminLoginResult> {
  try {
    await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    const session = await auth();
    const role = session?.user?.role;

    if (!session?.user || !isAdminRole(role)) {
      await signOut({ redirect: false });
      return {
        error: "This account does not have admin access.",
      };
    }

    let adminStatus: {
      disabledAt: Date | null;
      deletedAt: Date | null;
      authVersion: number;
    } | null = null;

    try {
      adminStatus = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { disabledAt: true, deletedAt: true, authVersion: true },
      });
    } catch (error) {
      if (!isMissingAdminStatusColumnError(error)) {
        throw error;
      }

      adminStatus = {
        disabledAt: null,
        deletedAt: null,
        authVersion: 0,
      };
    }

    if (adminStatus?.deletedAt) {
      await signOut({ redirect: false });
      return {
        error: "This admin account is no longer active.",
      };
    }

    if (adminStatus?.disabledAt) {
      await signOut({ redirect: false });
      return {
        error: "This admin account is blocked. Contact the store owner.",
      };
    }

    revalidatePath("/", "layout");
    revalidatePath("/admin-account", "layout");

    return {
      success: true,
      redirectTo: getAdminCallbackUrl(data.callbackUrl),
    };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return {
            error: error.cause?.err?.message ?? "Invalid email or password",
          };

        default:
          return {
            error: "Authentication failed. Please try again.",
          };
      }
    }

    console.error("[ADMIN_CREDENTIAL_LOGIN_ERROR]", error);

    return {
      error: "Something went wrong. Please try again later.",
    };
  }
}
