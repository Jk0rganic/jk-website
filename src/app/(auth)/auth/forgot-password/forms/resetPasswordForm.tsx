"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { toast } from "sonner";
import { z } from "zod";

import { FormInput } from "@/comp/form/formInput/formInput";

import { sendPasswordResetEmail } from "../action";
import k from "./styles.module.scss";

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Invalid email address")
    .max(254, "Email is too long"),
});

interface FormData {
  email: string;
}

export default function ResetPasswordForm() {
  const [isPending, startTransition] = useTransition();

  const [emailSent, setEmailSent] = useState(false);

  const {
    register,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = (data: FormData) => {
    if (emailSent) return;

    startTransition(async () => {
      try {
        const res = await sendPasswordResetEmail(data.email);

        if (!res.success) {
          toast.error(res.message);
          return;
        }

        toast.success(res.message);

        reset();
        setEmailSent(true);
      } catch (error) {
        console.error(error);

        toast.error("Something went wrong. Try again.");
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
        disabled={emailSent}
      />

      <button type="submit" className={k.btn} disabled={isPending || emailSent}>
        {isPending ? "Sending..." : emailSent ? "Link Sent" : "Send Reset Link"}
      </button>
    </form>
  );
}
