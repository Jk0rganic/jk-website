// Import icons from lucide‑react
import { Facebook, Linkedin, Twitter } from "lucide-react";
import styles from "./styles.module.scss";

export default function SingleProSocial() {
  return (
    <div className={styles.singleProSocial}>
      <a
        href="https://facebook.com/yourpage"
        target="_blank"
        rel="noopener noreferrer"
        className={styles.iconLink}
      >
        <Facebook size={20} />
      </a>
      <a
        href="https://twitter.com/yourprofile"
        target="_blank"
        rel="noopener noreferrer"
        className={styles.iconLink}
      >
        <Twitter size={20} />
      </a>
      <a
        href="https://linkedin.com/in/yourprofile"
        target="_blank"
        rel="noopener noreferrer"
        className={styles.iconLink}
      >
        <Linkedin size={20} />
      </a>
    </div>
  );
}
