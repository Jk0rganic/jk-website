"use client";

import { useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { loginSchema } from "@/utils/zod/zod";
import { doAdminCredentialLogin } from "@/lib/auth/action/doAdminCredentialLogin";
import { BRAND_LOGO_URL } from "@/lib/brand";
import k from "../admin-signin.module.scss";

interface FormData {
  email: string;
  password: string;
}

export default function AdminSignInForm({
  callbackUrl,
}: {
  callbackUrl: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: FormData) => {
    startTransition(async () => {
      const res = await doAdminCredentialLogin({
        ...data,
        callbackUrl,
      });

      if (res.error) {
        toast.error(res.error);
        return;
      }

      toast.success("Welcome back!");
      router.push(res.redirectTo || "/admin-account");
      router.refresh();
    });
  };

  return (
    <div className={k.page}>
      <div className={k.card}>
        <div className={k.brand}>
          <Image
            src={BRAND_LOGO_URL}
            alt="JK Organics"
            width={152}
            height={52}
            className={k.logo}
            priority
          />
          <span className={k.adminBadge}>Admin</span>
        </div>

        <div className={k.intro}>
          <h1>Staff sign in</h1>
          <p>
            Sign in with your admin account to manage orders, products, and
            payments.
          </p>
        </div>

        <form className={k.form} onSubmit={handleSubmit(onSubmit)}>
          <label className={k.field}>
            <span>Email</span>
            <input
              type="email"
              autoComplete="email"
              placeholder="you@jkorganics.com"
              {...register("email")}
            />
            {errors.email && <em>{errors.email.message}</em>}
          </label>

          <label className={k.field}>
            <span>Password</span>
            <input
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              {...register("password")}
            />
            {errors.password && <em>{errors.password.message}</em>}
          </label>

          <div className={k.actions}>
            <Link href="/auth/forgot-password">Forgot password?</Link>
          </div>

          <button type="submit" className={k.submit} disabled={isPending}>
            {isPending ? "Signing in…" : "Sign in to admin"}
          </button>
        </form>

        <p className={k.footer}>
          Shopping as a customer?{" "}
          <Link href="/auth/signin">Use the store login</Link>
        </p>
      </div>
    </div>
  );
}
