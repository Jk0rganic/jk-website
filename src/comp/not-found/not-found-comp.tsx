import Button from "@/comp/button/button";
import Section from "@/comp/section/section";
import styles from "./styles.module.scss";

export default function NotFoundComponent() {
  return (
    <Section className={styles.not_found}>
      <h1>
        <span aria-hidden="true">404 - Page Not Found</span>
        <span>404 - Page Not Found</span>
        <span aria-hidden="true">404 - Page Not Found</span>
      </h1>
      <Button href="/" name="back homepage" />
    </Section>
  );
}
