"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";

import k from "./styles.module.scss";

import { FormInput } from "@/comp/form/formInput/formInput";
import SigninPassword from "./signin_password/signin-password";

import { loginSchema } from "@/utils/zod/zod";
import { doCredentialLogin } from "@/lib/auth/action/doCredentialLogin";

interface FormData {
  email: string;
  password: string;
}

export default function SignInForm({
  callbackUrl = "/",
}: {
  callbackUrl?: string;
}) {
  const router = useRouter();

  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: FormData) => {
    startTransition(async () => {
      try {
        const res = await doCredentialLogin(data);

        if (res?.error) {
          toast.error(res.error);
          return;
        }

        toast.success("Logged in successfully!");

        reset();

        router.push(callbackUrl);
      } catch (error) {
        console.error(error);

        toast.error("Something went wrong. Please try again.");
      }
    });
  };

  return (
    <form className={k.form} onSubmit={handleSubmit(onSubmit)}>
      <FormInput
        type="email"
        name="email"
        register={register}
        errors={errors}
        placeholder="Email Address"
      />

      <SigninPassword register={register} errors={errors} />

      <div className={k.btn_wrapper}>
        <p className={k.sign_up}>
          Don't have an account? <Link href="/auth/signup">Sign up</Link>
        </p>

        <Link className={k.forgot} href="/auth/forgot-password">
          Forgot Password?
        </Link>
      </div>

      <button type="submit" className={k.btn} disabled={isPending}>
        {isPending ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
}
