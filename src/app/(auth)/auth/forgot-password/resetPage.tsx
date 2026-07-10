import "server-only";

import ImgBox from "@/comp/imgbox/ImgBox";
import ReUseLogo from "../signin/comp/re-use-logo/re-use-logo";
import { validateResetToken } from "./action";
import NewPasswordForm from "./forms/newPasswordForm";
import ResetPasswordForm from "./forms/resetPasswordForm";

import k from "./styles.module.scss";

interface ResetPageProps {
  searchParams: {
    token?: string;
  };
}

export default async function ResetPage({ searchParams }: ResetPageProps) {
  const token = searchParams.token ?? null;

  const isResetStep = Boolean(token);

  let isValidToken = false;

  if (token) {
    isValidToken = await validateResetToken(token);
  }

  return (
    <section className={k.reset_p}>
      <div className={k.form_wrapper}>
        <div className={k.welcome}>
          <h3>
            {isResetStep ? "Set a New Password 🔒" : "Reset Your Password 🔑"}
          </h3>

          <p>
            {isResetStep
              ? "Enter your new password below to update your account credentials."
              : "Enter your email address below and we’ll send you a link to reset your password."}
          </p>
        </div>

        {/* Step 1: request reset email */}
        {!isResetStep && <ResetPasswordForm />}

        {/* Step 2: invalid token */}
        {isResetStep && !isValidToken && (
          <div className={k.invalid}>
            <p>❌ Invalid or expired reset link.</p>
            <ResetPasswordForm />
          </div>
        )}

        {/* Step 3: valid token */}
        {isResetStep && isValidToken && <NewPasswordForm token={token} />}

        <ReUseLogo className={k.logo} />
      </div>

      <ImgBox
        className={k.img_box}
        imageSrc="https://res.cloudinary.com/dj200tags/images/w_1707,h_2560,c_scale/v1768760653/rosa-rafael-M41QIR3v3SA-unsplash_11zon/rosa-rafael-M41QIR3v3SA-unsplash_11zon.webp"
        alt="Reset password image"
      />
    </section>
  );
}
