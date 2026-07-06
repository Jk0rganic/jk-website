"use server";

import { revalidatePath } from "next/cache";
import { AuthError } from "next-auth";

import { signIn } from "./auth/auth";

interface LoginInput {
  email: string;
  password: string;
}

interface LoginResult {
  success?: boolean;
  error?: string;
}

export async function doCredentialLogin(
  data: LoginInput,
): Promise<LoginResult> {
  try {
    await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    revalidatePath("/", "layout");
    revalidatePath("/account");

    return {
      success: true,
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

    console.error("[CREDENTIAL_LOGIN_ERROR]", error);

    return {
      error: "Something went wrong. Please try again later.",
    };
  }
}
