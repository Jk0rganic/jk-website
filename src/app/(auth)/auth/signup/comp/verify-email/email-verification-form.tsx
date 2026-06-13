"use client";

import { useState, useTransition, useRef } from "react";

import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import k from "./styles.module.scss";

import { sendCodeAction, verifyCodeAction } from "./action/action";

interface Props {
  initialEmail?: string;
  onVerified?: (email: string) => void;
}

export function EmailVerificationForm({
  initialEmail = "",
  onVerified,
}: Props) {
  const router = useRouter();

  const [step, setStep] = useState<"email" | "code">("email");
  const [isSending, startSendTransition] = useTransition();
  const [isVerifying, startVerifyTransition] = useTransition();
  const [code, setCode] = useState<string[]>(["", "", "", "", "", ""]);

  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const { register, handleSubmit, getValues } = useForm({
    defaultValues: { email: initialEmail },
  });

  const handleChange = (index: number, value: string) => {
    if (!/^[0-9]*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    if (value && index < 5) inputsRef.current[index + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const paste = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(paste)) {
      setCode(paste.split(""));
      inputsRef.current[5]?.focus();
    }
    e.preventDefault();
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleSendCode = (data: { email: string }) => {
    if (!data.email) {
      toast.error("Email is required");
      return;
    }

    startSendTransition(async () => {
      try {
        const res = await sendCodeAction({ email: data.email });

        if (!res.success) {
          toast.error(res.message || "Failed to send code");
          return;
        }

        toast.success(res.message || "Verification code sent!");
        setCode(["", "", "", "", "", ""]);
        setStep("code");
      } catch (err: any) {
        toast.error(err?.message || "Something went wrong");
      }
    });
  };

  const handleVerifyCode = () => {
    const enteredCode = code.join("");

    if (enteredCode.length !== 6) {
      toast.error("Enter 6-digit code");
      return;
    }

    startVerifyTransition(async () => {
      try {
        const res = await verifyCodeAction({
          email: getValues("email"),
          token: enteredCode,
        });

        if (!res.success) {
          toast.error(res.message || "Invalid code");
          return;
        }

        if (!res.verifiedEmail) return;

        toast.success("Email verified!");

        if (onVerified) {
          onVerified(res.verifiedEmail);
        } else {
          router.push(
            `/auth/signup?token=verified&email=${encodeURIComponent(res.verifiedEmail)}`,
          );
        }
      } catch (err: any) {
        toast.error(err?.message || "Something went wrong");
      }
    });
  };

  return (
    <div className={k.verify_wrapper}>
      {step === "email" && (
        <form onSubmit={handleSubmit(handleSendCode)}>
          <input
            type="email"
            placeholder="Enter your email"
            {...register("email")}
            className={k.input}
          />
          <button type="submit" className={k.verify_btn} disabled={isSending}>
            {isSending ? "Sending..." : "Send Code"}
          </button>
        </form>
      )}

      {step === "code" && (
        <div className={k.otp_wrapper}>
          <div className={k.otp_inputs}>
            {code.map((digit, index) => (
              <input
                key={index}
                type="text"
                value={digit}
                maxLength={1}
                ref={(el) => {
                  inputsRef.current[index] = el;
                }}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                onPaste={index === 0 ? handlePaste : undefined}
                className={k.otp_input}
              />
            ))}
          </div>
          <button
            type="button"
            className={k.verify_btn}
            onClick={handleVerifyCode}
            disabled={isVerifying}
          >
            {isVerifying ? "Verifying..." : "Verify Code"}
          </button>
        </div>
      )}
    </div>
  );
}
