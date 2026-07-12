import { Check } from "lucide-react";
import k from "./styles.module.scss";

const stepLabels = ["Details", "Payment"];
const stepTitles = {
  1: "Your details",
  2: "Payment & review",
} as const;

interface CheckoutProgressProps {
  currentStep?: 1 | 2;
}

export default function CheckoutProgress({
  currentStep = 1,
}: CheckoutProgressProps) {
  const title = stepTitles[currentStep] || stepTitles[1];
  const progress = `${(currentStep / 2) * 100}%`;

  return (
    <nav className={k.progress} aria-label="Checkout progress">
      <div className={k.progress_header}>
        <span>Step {currentStep} of 2</span>
        <strong>{title}</strong>
      </div>

      <div className={k.track} aria-hidden="true">
        <span style={{ width: progress }} />
      </div>

      <ol className={k.milestones}>
        {stepLabels.map((label, index) => {
          const stepNumber = (index + 1) as 1 | 2;
          const isDone = stepNumber < currentStep;
          const isActive = stepNumber <= currentStep;

          return (
            <li className={isActive ? k.active : undefined} key={label}>
              {isDone ? <Check size={11} /> : null}
              {label}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
