"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import ImgBox from "@/comp/imgbox/ImgBox";
import ReUseLogo from "../../signin/comp/re-use-logo/re-use-logo";

import SignUpForm from "./form/form";
import k from "./styles.module.scss";
import { EmailVerificationForm } from "./verify-email/email-verification-form";

export default function SignUpPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [step, setStep] = useState<"verify" | "signup">("verify");

  const [verifiedEmail, setVerifiedEmail] = useState<string>("");

  useEffect(() => {
    if (token && email) {
      setStep("signup");
      setVerifiedEmail(email);
    } else {
      setStep("verify");
      setVerifiedEmail("");
    }
  }, [token, email]);

  const handleEmailVerified = (email: string) => {
    setVerifiedEmail(email);
    setStep("signup");

    router.push(
      `/auth/signup?token=verified&email=${encodeURIComponent(email)}`,
    );
  };

  return (
    <section className={k.signup}>
      <div className={k.form_wrapper}>
        {step === "verify" && (
          <>
            <div className={k.welcome}>
              <h3>Confirm your email ✉️</h3>
              <p>
                Enter your email and we'll send you a 6-digit code to verify
                your address before continuing.
              </p>
            </div>

            <EmailVerificationForm
              onVerified={handleEmailVerified}
              initialEmail={email ?? undefined}
            />
          </>
        )}

        {step === "signup" && (
          <>
            <div className={k.welcome}>
              <h3>Create Your Account ✨</h3>
              <p>
                Your email has been verified. Complete your details to finish
                registration.
              </p>
            </div>

            <SignUpForm verifiedEmail={verifiedEmail} />
          </>
        )}

        <ReUseLogo className={k.logo} />
      </div>

      <ImgBox
        className={k.img_box}
        imageSrc="https://res.cloudinary.com/dj200tags/images/w_1643,h_2560,c_scale/v1765565794/ayo-ogunseinde-UqT55tGBqzI-unsplash_17_11zon_1299328c/ayo-ogunseinde-UqT55tGBqzI-unsplash_17_11zon_1299328c.webp"
        alt="sign up image"
      />
    </section>
  );
}
