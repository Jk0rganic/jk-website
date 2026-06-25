"use server";

import { signIn, signOut } from "@/lib/auth/action/auth/auth";
import { getSafeCallbackUrl } from "@/lib/auth/get-safe-callback-url";

import { revalidatePath } from "next/cache";

export async function doSocialLogin(formData: FormData) {
  const action = formData.get("action");
  const callbackUrl = getSafeCallbackUrl(
    formData.get("callbackUrl")?.toString(),
    "/account",
  );

  if (typeof action !== "string" || !action) {
    throw new Error("Invalid auth provider");
  }

  await signIn(action, {
    redirectTo: callbackUrl,
  });
}

export async function logoutAll() {
  await logoutTo("/auth/signin");
}

export async function logoutTo(redirectTo: string) {
  await signOut({
    redirectTo,
  });

  revalidatePath("/");
  revalidatePath("/account");
}

export async function revalidateAccount() {
  revalidatePath("/");
  revalidatePath("/account");
}
