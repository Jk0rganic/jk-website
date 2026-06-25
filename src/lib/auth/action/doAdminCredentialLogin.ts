"use server";

import { AuthError } from "next-auth";
import { revalidatePath } from "next/cache";
import { isAdminRole } from "@/lib/admin/roles";
import { getAdminCallbackUrl } from "@/lib/auth/admin-login";
import { auth, signIn, signOut } from "./auth/auth";

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
