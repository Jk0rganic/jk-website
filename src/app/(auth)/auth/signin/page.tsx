import ImgBox from "@/comp/imgbox/ImgBox";
import SignInForm from "./comp/form/form";
import k from "./styles.module.scss";
import { SocialMediaLogin } from "../signup/comp/social_login/socialLogin";
import { seoMeta } from "@/utils/seo/seoMeta";
import ReUseLogo from "./comp/re-use-logo/re-use-logo";

export const metadata = seoMeta.signin;

export default function signin() {
  return (
    <section className={k.login}>
      <div className={k.form_wrapper}>
        <ReUseLogo className={k.logo} />

        <div className={k.welcome}>
          <h3>Welcome Back </h3>
          <p>
            Welcome back! Sign in to access your account, track orders, and see
            what’s new.
          </p>
        </div>
        <SignInForm />

        <SocialMediaLogin />
      </div>
      <ImgBox
        className={k.img_box}
        imageSrc="https://res.cloudinary.com/dj200tags/images/v1768760644/smart-araromi-FKknWBrPzb0-unsplash_11zon/smart-araromi-FKknWBrPzb0-unsplash_11zon.webp"
        alt="login image"
      />
    </section>
  );
}
