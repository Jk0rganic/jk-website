import React from "react";
import styles from "./styles.module.scss";
import Section from "@/comp/section/section";

export default function NotFoundInternalServerErrorComponent() {
  return (
    <Section className={styles.not_found}>
      <h1>500 - Internal Server Error</h1>
    </Section>
  );
}
