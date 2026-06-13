import k from "./styles.module.scss";
import { doSocialLogin } from "./action";
import ImgBox from "@/comp/imgbox/ImgBox";

export function SocialMediaLogin() {
  return (
    <div className={k.social_wrapper}>
      <div className={k.or}>
        <span>or</span>
      </div>

      <form className={k.form} action={doSocialLogin}>
        <button type="submit" name="action" value="google">
          <ImgBox
            className={k.img_box}
            imageSrc="https://res.cloudinary.com/dj200tags/images/v1763396773/google-g-2015/google-g-2015.svg"
            alt="Google"
          />
          Sign in with Google
        </button>
      </form>
    </div>
  );
}
