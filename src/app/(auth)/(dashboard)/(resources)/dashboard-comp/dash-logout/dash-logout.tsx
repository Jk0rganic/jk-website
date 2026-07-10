import { logoutAll } from "@/app/(auth)/auth/signup/comp/social_login/action";
import k from "./styles.module.scss";

export default function DashLogout() {
  return (
    <form className={k.form} action={logoutAll}>
      <button type="submit">Sign out</button>
    </form>
  );
}
