import type { ReactNode } from "react";
import k from "./styles.module.scss";

interface CheckoutStepCardProps {
  step: string;
  title: string;
  description?: string;
  children: ReactNode;
}

export default function CheckoutStepCard({
  step,
  title,
  description,
  children,
}: CheckoutStepCardProps) {
  return (
    <section className={k.card}>
      <header className={k.header}>
        <span className={k.step}>{step}</span>
        <div>
          <h4>{title}</h4>
          {description ? <p>{description}</p> : null}
        </div>
      </header>
      <div className={k.body}>{children}</div>
    </section>
  );
}
