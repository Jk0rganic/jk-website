"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { toast } from "sonner";

import k from "./styles.module.scss";

import PasswordSignup from "../../signup/comp/password-signup/password-signup";

import { resetPassword } from "../action";
import { resetPasswordSchema } from "@/utils/zod/zod";

interface Props {
  token: string | null;
}

interface FormData {
  password: string;
  confirm_password: string;
}

export default function NewPasswordForm({ token }: Props) {
  const router = useRouter();

  const [isPending, startTransition] = useTransition();

  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = (data: FormData) => {
    if (!token) {
      toast.error("Invalid reset token");
      return;
    }

    if (isPending || success) return;

    startTransition(async () => {
      try {
        const res = await resetPassword({
          token,
          password: data.password,
        });

        if (!res.success) {
          toast.error(res.message);
          return;
        }

        toast.success(res.message);

        setSuccess(true);

        setTimeout(() => {
          router.push("/auth/signin");
        }, 1500);
      } catch (error) {
        console.error(error);

        toast.error("Something went wrong");
      }
    });
  };

  return (
    <form className={k.form} onSubmit={handleSubmit(onSubmit)}>
      <PasswordSignup register={register} errors={errors} />

      <button type="submit" className={k.btn} disabled={isPending || success}>
        {isPending
          ? "Resetting..."
          : success
            ? "Password Reset!"
            : "Reset Password"}
      </button>
    </form>
  );
}
