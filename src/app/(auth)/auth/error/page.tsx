"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

import Section from "@/comp/section/section";
import k from "./styles.module.scss";

const ERROR_MESSAGES: Record<string, string> = {
  AccessDenied: "You do not have permission to sign in.",
  CredentialsSignin: "Invalid email or password.",
  OAuthAccountNotLinked: "This email is already linked to a different sign-in method.",
  Configuration: "Authentication configuration error.",
  Default: "Something went wrong during authentication.",
};

function AuthError() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const message = ERROR_MESSAGES[error ?? "Default"] ?? ERROR_MESSAGES.Default;

  useEffect(() => {
    if (error) toast.error(message);
  }, [error, message]);

  return (
    <Section className={k.auth_error}>
      <h2>Authentication Error</h2>
      <p>{message}</p>
      <Link href="/auth/signin" className={k.btn}>
        Go back to Sign In
      </Link>
    </Section>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense>
      <AuthError />
    </Suspense>
  );
}