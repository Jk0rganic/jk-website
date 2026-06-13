"use server";

import { signIn, signOut } from "@/lib/auth/action/auth/auth";

import { revalidatePath } from "next/cache";

export async function doSocialLogin(formData: FormData) {
  const action = formData.get("action");

  if (typeof action !== "string" || !action) {
    throw new Error("Invalid auth provider");
  }

  await signIn(action, {
    redirectTo: "/account",
  });
}

export async function logoutAll() {
  await signOut({
    redirectTo: "/auth/signin",
  });

  revalidatePath("/");
  revalidatePath("/account");
}

export async function revalidateAccount() {
  revalidatePath("/");
  revalidatePath("/account");
}
