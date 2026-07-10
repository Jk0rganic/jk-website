"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { type SubmitHandler, useForm } from "react-hook-form";
import { toast } from "sonner";
import { FormInput } from "@/comp/form/formInput/formInput";
import { type RegisterUserSchema, registerUserSchema } from "@/utils/zod/zod";
import { registerUserAction } from "../../action";
import PasswordSignup from "../password-signup/password-signup";
import k from "./styles.module.scss";

interface Props {
  verifiedEmail: string;
}

export default function SignUpForm({ verifiedEmail }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RegisterUserSchema>({
    resolver: zodResolver(registerUserSchema),
    defaultValues: { email: verifiedEmail },
  });

  const saveUser: SubmitHandler<RegisterUserSchema> = (data) => {
    if (isPending) return;

    startTransition(async () => {
      try {
        const res = await registerUserAction(data);

        if (!res?.success) {
          toast.error(res?.error || "Failed to create account");
          return;
        }

        toast.success(`Welcome, ${data.full_name}!`);
        reset();
        router.push("/auth/signin");
      } catch (err) {
        console.error(err);
        toast.error("Something went wrong!");
      }
    });
  };

  return (
    <form className={k.form} onSubmit={handleSubmit(saveUser)}>
      <FormInput
        type="text"
        name="full_name"
        register={register}
        errors={errors}
        placeholder="Full Name"
      />

      <FormInput
        type="email"
        name="email"
        register={register}
        errors={errors}
        placeholder="Email Address"
        disabled
      />

      <PasswordSignup register={register} errors={errors} />

      <p className={k.sign_up}>
        Already have an account? <Link href="/auth/signin">Sign in</Link>
      </p>

      <button type="submit" className={k.btn} disabled={isPending}>
        {isPending ? "Creating..." : "Sign Up"}
      </button>
    </form>
  );
}
