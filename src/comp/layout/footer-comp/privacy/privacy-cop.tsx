import Link from "next/link";
import k from "./styles.module.scss";

export default function PrivacyCop() {
  return (
    <div className={k.privacy_cop}>
      <Link href="/privacy/privacy-policy">Privacy Policy</Link>
      <Link href="/privacy/refund_returns">Refund Policy</Link>
      <Link href="/privacy/terms-conditions">Terms & Conditions</Link>
    </div>
  );
}
