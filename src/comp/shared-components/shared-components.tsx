import Link from "next/link";
import k from "./styles.module.scss";

export function SharedPhone() {
  const phone = "+254795782207";

  // Format: +254 795 782 207
  const displayPhone = phone.replace(
    /(\+\d{3})(\d{3})(\d{3})(\d{3})/,
    "$1 $2 $3 $4",
  );

  return (
    <div className={k.shared_comp}>
      <Link href={`tel:${phone}`} aria-label={displayPhone} target="blank">
        {displayPhone}
      </Link>
    </div>
  );
}

export function SharedEmail() {
  const email = "info.jkorganicske@gmail.com";

  return (
    <div className={k.shared_comp}>
      <Link href={`mailto:${email}`} target="blank" aria-label={email}>
        {email}
      </Link>
    </div>
  );
}
